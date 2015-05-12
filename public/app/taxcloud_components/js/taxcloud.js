/*

Copyright: (c) 2009-2015 The Federal Tax Authority, LLC (FedTax). TaxCloud is a registered trademark of FedTax.
This file contains Original Code and/or Modifications of Original Code as defined in, and that are subject to, the FedTax Public Source License (reference http://dev.taxcloud.net/ftpsl/ or http://taxcloud.net/ftpsl.pdf). 

Support: Questions about this file should be directed to service@taxcloud.net.
Author: John Milan (jmilan@fedtax.net)
Revision: 2.0
Released: 5/20/2015

*/

var TaxCloudHelper_States = Object.freeze({ "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming" });
var TaxCloudHelper_Months = Object.freeze({ "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" });
var TaxCloudHelper_Years = Object.freeze({ "13": "2013", "14": "2014", "15": "2015", "16": "2016", "17": "2017", "18": "2018", "19": "2019", "20": "2020", "21": "2021", "22": "2022" });

var USPSVerifiedAddressURL = "https://taxcloud.net/imgs/usps_verified.png";
var USPSUnverifiedAddressURL = "https://taxcloud.net/imgs/usps_unverified.png";
var USPSVerifyAddressURL = "https://taxcloud.net/imgs/usps_verify.png";

var TaxCloudHelper_myTaxCloudInstance = null;

function TaxCloudHelper_IsDefined(func) {
    if (func !== undefined)
        return true;
    else
        return false;
}

function TaxCloudExemptionCertificate() {
}

function TaxCloudAddress(origin) {
    this.isVerified = false;
    this.origin = origin;
    this.name = "";
    this.address1 = "";
    this.address2 = "";
    this.city = "";
    this.state = "";
    this.zip5 = "";
    this.zip4 = "";
    this.commonVerifiedSoapPackage = "<Address1>$address1</Address1><Address2>$address2</Address2><City>$city</City><State>$state</State><Zip5>$zip5</Zip5><Zip4>$zip4</Zip4><ErrNumber>0</ErrNumber>";
    this.originVerifiedSoapPackage = "<origin xsi:type='VerifiedAddress'>" + this.commonVerifiedSoapPackage + "</origin>";
    this.destinationVerifiedSoapPackage = "<destination xsi:type='VerifiedAddress'>" + this.commonVerifiedSoapPackage + "</destination>";
}

TaxCloudAddress.prototype.AsCustomerID = function () {
    return this.address1.toUpperCase() + ":" + this.address2.toUpperCase() + ":" + this.city.toUpperCase() + ":" + this.state.toUpperCase() + ":" + this.zip5 + ":" + this.zip4;
}

TaxCloudAddress.prototype.IsVerified = function () {
    return this.isVerified;
}

TaxCloudAddress.prototype.path = function () {
    var result = encodeURIComponent(this.address1);
    result += "/";
    if (this.address2)
        result += encodeURIComponent(this.address2);
    else
        result += "*";
    result += "/" + encodeURIComponent(this.city);
    result += "/" + encodeURIComponent(this.state);
    result += "/" + encodeURIComponent(this.zip5);
    result += "/";
    if (this.zip4)
        result += encodeURIComponent(this.zip4);
    else
        result += "*";
    return result;
}

TaxCloudAddress.prototype.SoapPackage = function () {
    var soapPackage = (this.origin) ? this.originVerifiedSoapPackage : this.destinationVerifiedSoapPackage;
    return soapPackage.replace("$address1", this.address1).replace("$address2", this.address2).replace("$city", this.city).replace("$state", this.state).replace("$zip5", this.zip5).replace("$zip4", this.zip4);
}

function TaxCloudCartItem(id, displayName, price, discount, quantity, tic) {
    this.id = id;
    this.index = 0;
    this.displayName = displayName;
    this.tic = (tic) ? tic : 00000;
    this.price = price;
    this.quantity = quantity;
    this.quantityFloor = 1;
    this.discount = discount;
    this.taxAmount = 0.0;
    this.lookupSoapPackage = "<CartItem><Index>$index</Index><ItemID>$itemID</ItemID><TIC>$tic</TIC><Price>$price</Price><Qty>$quantity</Qty></CartItem>";
}

TaxCloudCartItem.prototype.SetQuantity = function (quantity) {
    if (quantity < this.quantityFloor)
        quantity = this.quantityFloor;
    this.quantity = quantity;
}

TaxCloudCartItem.prototype.SetQuantityFloor = function (quantityFloor) {
    this.quantityFloor = quantityFloor;
}

TaxCloudCartItem.prototype.DiscountPrice = function () {
    return (1.0 - this.discount) * this.price;
}

TaxCloudCartItem.prototype.PriceTotal = function () {
    var asCents = Math.floor(this.price * 100.0) * (1.0 - this.discount) * this.quantity;
    return (asCents / 100.0);
}

TaxCloudCartItem.prototype.TaxTotal = function () {
    var asCents = Math.floor(this.taxAmount * 100.0);
    return (asCents / 100.0);
}

TaxCloudCartItem.prototype.PricePlusTaxTotal = function () {
    return this.PriceTotal() + this.TaxTotal();
}

TaxCloudCartItem.prototype.TaxRate = function () {
    var taxRate = 1.0 - ((this.DiscountPrice() - this.taxAmount) / (this.DiscountPrice()));
    return taxRate.toFixed(4);
}

TaxCloudCartItem.prototype.SoapPackage = function () {
    return this.lookupSoapPackage.replace("$index", this.index.toString()).replace("$itemID", this.id).replace("$tic", this.tic).replace("$price", this.DiscountPrice()).replace("$quantity", this.quantity);
}

function TaxCloudCart(id) {
    this.id = id;
    this.items = [];
    this.exemptionCertificate = null;
    this.lookupSoapPackage = "<cartID>$id</cartID><cartItems>$cartItems</cartItems>";
    this.returnedSoapPackage = "<cartItems>$cartItems</cartItems>";
    this.observers = [];
}

TaxCloudCart.prototype.PriceTotal = function () {
    var total = 0.0;
    for (var index = 0; index < this.items.length; ++index) {
        total += this.items[index].PriceTotal();
    }
    return total;
}

TaxCloudCart.prototype.TaxTotal = function () {
    var total = 0.0;
    for (var index = 0; index < this.items.length; ++index) {
        total += this.items[index].TaxTotal();
    }
    return total;
}

TaxCloudCart.prototype.GrandTotal = function () {
    return this.PriceTotal() + this.TaxTotal();
}


TaxCloudCart.prototype.AddItem = function (cartItem) {
    for (var cartItemII = 0; cartItemII < this.items.length; ++cartItemII) {
        if (this.items[cartItemII] == cartItem)
            return;
    }
    cartItem.index = this.items.length;
    this.items.push(cartItem);
    this.NotifyObservers("CartItemAdded", cartItem);
}

TaxCloudCart.prototype.RemoveItem = function (cartItem) {
    var cartItemII = 0;
    for (; cartItemII < this.items.length; ++cartItemII) {
        if (this.items[cartItemII] == cartItem)
            break;
    }
    if (cartItemII == this.items.length)
        return;
    this.items.splice(cartItemII, 1);
    for (; cartItemII < this.items.length; ++cartItemII)
        this.items[cartItemII].index = cartItemII;
    this.NotifyObservers("CartItemRemoved", cartItem);

}

TaxCloudCart.prototype.ClearItems = function () {
    while (this.items.length > 0)
        this.RemoveItem(this.items[0]);
}

TaxCloudCart.prototype.LookupSoapPackage = function () {
    var cartItemsSoapPackage = "";
    index = 0;
    for (; index < this.items.length; ++index) {
        var cartItem = this.items[index];
        cartItemsSoapPackage += cartItem.SoapPackage();
    }
    return this.lookupSoapPackage.replace("$id", this.id).replace("$cartItems", cartItemsSoapPackage);
}

TaxCloudCart.prototype.ReturnedSoapPackage = function () {
    var cartItemsSoapPackage = "";
    index = 0;
    for (; index < this.items.length; ++index) {
        var cartItem = this.items[index];
        cartItemsSoapPackage += cartItem.SoapPackage();
    }
    return this.returnedSoapPackage.replace("$cartItems", cartItemsSoapPackage);
}

TaxCloudCart.prototype.AddObserver = function (observer) {
    var observerII = 0;
    for (; observerII < this.observers.length; ++observerII) {
        if (this.observers[observerII] == observer)
            return;
    }
    this.observers.push(observer);
}

TaxCloudCart.prototype.NotifyObservers = function (name, cartItem) {
    var observerII = 0;
    for (; observerII < this.observers.length; ++observerII) {
        var observer = this.observers[observerII];
        if (typeof (observer[name]) == "function")
            observer[name](cartItem);
    }
}

TaxCloudCart.prototype.RemoveObserver = function (observer) {
    var observerII = 0;
    for (; observerII < this.observers.length; ++observerII) {
        if (this.observers[observerII] == observer) {
            this.observers.splice(observerII, 1);
            return;
        }
    }
}

function TaxCloud(apiLoginID, apiKey) {
    this.apiLoginID = apiLoginID;
    this.apiKey = apiKey;
    this.customerID = null;
    this.addressOrigin = new TaxCloudAddress(true);
    this.addressDestination = new TaxCloudAddress(false);
    this.shippingAddressNotInUSA = false;
    this.cart = null;
    this.pingSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Ping xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey></Ping></s:Body></s:Envelope>";
    this.verifyAddressSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><VerifyAddress xmlns='http://taxcloud.net'><uspsUserID>$uspsUserID</uspsUserID><address1>$address1</address1><address2>$address2</address2><city>$city</city><state>$state</state><zip5>$zip5</zip5><zip4>$zip4</zip4></VerifyAddress></s:Body></s:Envelope>";
    this.lookupSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Lookup xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID>$cart$addressOrigin$addressDestination<deliveredBySeller>$deliveredBySeller</deliveredBySeller></Lookup></s:Body></s:Envelope>";
    this.authorizedSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Authorized xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><cartID>$cartID</cartID><orderID>$orderID</orderID><dateAuthorized>$dateAuthorized</dateAuthorized></Authorized></s:Body></s:Envelope>";
    this.capturedSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Captured xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><orderID>$orderID</orderID></Captured></s:Body></s:Envelope>";
    this.authorizedWithCaptureSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><AuthorizedWithCapture xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><cartID>$cartID</cartID><orderID>$orderID</orderID><dateAuthorized>$dateAuthorized</dateAuthorized><dateCaptured>$dateCaptured</dateCaptured></AuthorizedWithCapture></s:Body></s:Envelope>";
    this.returnedSoapPackage = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Returned xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKeyID</apiKey><orderID>$orderID</orderID>$cartItems<returnedDate>$dateReturned</returnedDate></Returned></s:Body></s:Envelope>";
    // this.endpoint = 'https://api.hoth.taxcloud.net/1.0/TaxCloud.asmx';
    this.endpoint = 'https://api.taxcloud.net/1.0/TaxCloud.asmx';
    this.addingCartItem = false;
    this.pingResponseType = null;
    this.pingResponseMessage = null;
    this.lookupResponseType = null;
    this.lookupResponseMessage = null;
    this.authorizedResponseType = null;
    this.authorizedResponseMessage = null;
    this.capturedResponseType = null;
    this.capturedResponseMessage = null;
    this.authorizedWithCaptureResponseType = null;
    this.authorizedWithCaptureResponseMessage = null;
}

TaxCloud.prototype.padzero = function (n) {
    return n < 10 ? '0' + n : n;
}

TaxCloud.prototype.pad2zeros = function (n) {
    if (n < 100) {
        n = '0' + n;
    }

    if (n < 10) {
        n = '0' + n;
    }

    return n;
}


TaxCloud.prototype.ToISODateTime = function (d) {
    return d.getUTCFullYear() + '-' + this.padzero(d.getUTCMonth() + 1) + '-' + this.padzero(d.getUTCDate()) + 'T' + this.padzero(d.getUTCHours()) + ':' + this.padzero(d.getUTCMinutes()) + ':' + this.padzero(d.getUTCSeconds()) + 'Z';
}

TaxCloud.prototype.maximumDisplayName = function (displayName) {
    if (displayName) {
        if (displayName.length > 40)
            return displayName.substring(0, 37) + "...";
        else
            return displayName;
    }
    else
        "<No Display Name>";
}

TaxCloud.prototype.SetLocalStorageEnabled = function (flag) {
    this.localStorageEnabled = flag;
}

TaxCloud.prototype.GetLocalStorageEnabled = function () {
    return this.localStorageEnabled;
}

TaxCloud.prototype.SetCustomerID = function (customerID, loadFromStorage) {
    this.customerID = customerID;
    if (loadFromStorage)
        this.LoadFromLocalStorage();
}

TaxCloud.prototype.GetCustomerID = function () {
    if (this.customerID)
        return this.customerID;
    else if (this.addressDestination) {
        this.customerID = this.addressDestination.AsCustomerID();
        return this.customerID;
    }
    else {
        this.customerID = this.ToISODateTime(new DateTime());
        return customerID;
    }
}

TaxCloud.prototype.getDOMChildElementTextContent = function (parentElement, childElementName) {
    var children = parentElement.getElementsByTagName(childElementName);
    if (!children || children.length == 0)
        return "";
    var child = children[0];
    if (child.textContent)
        return child.textContent;
    else
        return "";
}

TaxCloud.prototype.CreateCart = function (cartID) {
    this.cart = new TaxCloudCart(cartID);
}

TaxCloud.prototype.SetCart = function (cart) {
    this.cart = cart;
}

TaxCloud.prototype.Ping = function (callback) {
    var closureThis = this;
    var soapPackage = this.pingSoapPackage.replace('$apiLoginID', this.apiLoginID).replace('$apiKey', this.apiKey);
    $.ajax({
        url: this.endpoint,
        type: 'POST',
        data: soapPackage,
        dataType: 'xml',
        contentType: 'text/xml'
    })
        .done(function (xmlDOM) {
            closureThis.pingResponseType = closureThis.getDOMChildElementTextContent(xmlDOM, "ResponseType");
            closureThis.pingResponseMessage = closureThis.getDOMChildElementTextContent(xmlDOM, "Message");
            if (callback)
                callback(true);
        })
        .fail(function (data) {
            if (callback)
                callback(false);
        })
        .always(function () {
        });
}

TaxCloud.prototype.DataToAddress = function (xmlDOM, address) {
    var verifyAddressResult = xmlDOM.documentElement.firstElementChild.firstElementChild.firstElementChild;
    var ErrNumberElementValue = this.getDOMChildElementTextContent(xmlDOM, "ErrNumber");
    if (ErrNumberElementValue == "0") {
        address.isVerified = true;
        address.address1 = this.getDOMChildElementTextContent(verifyAddressResult, 'Address1');
        address.address2 = this.getDOMChildElementTextContent(verifyAddressResult, 'Address2');
        address.city = this.getDOMChildElementTextContent(verifyAddressResult, 'City');
        address.state = this.getDOMChildElementTextContent(verifyAddressResult, 'State');
        address.zip5 = this.getDOMChildElementTextContent(verifyAddressResult, 'Zip5');
        address.zip4 = this.getDOMChildElementTextContent(verifyAddressResult, 'Zip4');
    }
    else
        address.isVerified = false;
}

TaxCloud.prototype.VerifyOriginAddress = function (callback) {
    if (!this.addressOrigin) {
        alert("Please use a valid origin address");
        return false;
    }
    var closureThis = this;
    var soapPackage = this.verifyAddressSoapPackage.replace('$apiLoginID', this.apiLoginID).replace('$apiKey', this.apiKey);
    var soapPackage = soapPackage.replace("$address1", this.addressOrigin.address1).replace("$address2", this.addressOrigin.address2).replace("$city", this.addressOrigin.city).replace("$state", this.addressOrigin.state).replace("$zip5", this.addressOrigin.zip5).replace("$zip4", this.addressOrigin.zip4);
    $.ajax({
        url: this.endpoint,
        type: 'POST',
        data: soapPackage,
        dataType: 'xml',
        contentType: 'text/xml'
    })
        .done(function (xmlDOM) {
            closureThis.DataToAddress(xmlDOM, closureThis.addressOrigin);
            if (callback)
                callback(true);
        })
        .fail(function (data) {
            closureThis.addressOrigin = new TaxCloudAddress(true);
            if (callback)
                callback(false);
        })
        .always(function () {
        });
}

TaxCloud.prototype.VerifyDestinationAddress = function (callback) {
    if (!this.addressDestination) {
        alert("Please use a valid destination address");
        return false;
    }
    if (this.shippingAddressNotInUSA) {
    }
    else {
        var closureThis = this;
        var soapPackage = this.verifyAddressSoapPackage.replace('$apiLoginID', this.apiLoginID).replace('$apiKey', this.apiKey);
        var soapPackage = soapPackage.replace("$address1", this.addressDestination.address1).replace("$address2", this.addressDestination.address2).replace("$city", this.addressDestination.city).replace("$state", this.addressDestination.state).replace("$zip5", this.addressDestination.zip5).replace("$zip4", this.addressDestination.zip4);
        $.ajax({
            url: this.endpoint,
            type: 'POST',
            data: soapPackage,
            dataType: 'xml',
            contentType: 'text/xml'
        })
            .done(function (xmlDOM) {
                closureThis.DataToAddress(xmlDOM, closureThis.addressDestination);
                if (callback)
                    callback(true);
            })
            .fail(function (data) {
                closureThis.addressDestination = new TaxCloudAddress(false);
                if (callback)
                    callback(false);
            })
            .always(function () {
            });
    }
}

TaxCloud.prototype.Lookup = function (callback) {
    // verify the required fields are there
    if (!this.customerID) {
        alert("Customer ID needs to be set");
        return false;
    }
    if (!this.cart) {
        alert("Please generate a cart first");
        return false;
    }
    if (!this.addressOrigin) {
        alert("Please use a valid origin address");
        return false;
    }
    if (!this.addressDestination) {
        alert("Please use a valid destination address");
        return false;
    }
    if (this.shippingAddressNotInUSA) {
        this.lookupResponseType = "OK";
        this.lookupResponseMessage = "shippingAddressNotInUSA";
        if (callback)
            callback(false);
    }
    else {
        var soapPackage = this.lookupSoapPackage.replace('$apiLoginID', this.apiLoginID).replace('$apiKey', this.apiKey);
        soapPackage = soapPackage.replace("$customerID", this.customerID).replace("$cart", this.cart.LookupSoapPackage()).replace("$addressOrigin", this.addressOrigin.SoapPackage()).replace("$addressDestination", this.addressDestination.SoapPackage()).replace("$deliveredBySeller", (this.deliveredBySeller) ? "true" : "false");
        var closureThis = this;
        $.ajax({
            url: this.endpoint,
            type: 'POST',
            data: soapPackage,
            dataType: 'xml',
            contentType: 'text/xml'
        })
            .done(function (xmlDOM) {
                closureThis.lookupResponseType = closureThis.getDOMChildElementTextContent(xmlDOM, "ResponseType");
                closureThis.lookupResponseMessage = closureThis.getDOMChildElementTextContent(xmlDOM, "Message");
                var cartItemResponses = xmlDOM.documentElement.getElementsByTagName("CartItemResponse");
                for (var index = 0; index < cartItemResponses.length; ++index) {
                    var responseElement = cartItemResponses[index];
                    var cartItem = closureThis.cart.items[index];
                    if (cartItem.quantity > 0)
                        cartItem.taxAmount = parseFloat(closureThis.getDOMChildElementTextContent(responseElement, 'TaxAmount'));
                    else
                        cartItem.taxAmount = 0.0;
                }
                if (callback)
                    callback(true);
            })
            .fail(function (data) {
                if (callback)
                    callback(false);
            })
            .always(function () {
            });
    }
}

TaxCloud.prototype.Authorized = function (taxCloudPostUrl, callback) {
    this.userAuthorizedCallback = callback;
    if (!this.customerID) {
        alert("Customer ID needs to be set");
        return false;
    }
    if (!this.cart) {
        alert("Please generate a cart first");
        return false;
    }
    if (this.shippingAddressNotInUSA) {
        this.authorizedResponseType = "OK";
        this.authorizedResponseMessage = "shippingAddressNotInUSA";
        if (this.UserAuthorizedCallback)
            this.userAuthorizedCallback(this);
    }
    else {
        var request = new TaxCloudConnection(this);
        var soapPackage = this.authorizedSoapPackage.replace("$customerID", this.customerID).replace("$cartID", this.cart.id).replace("$orderID", orderID).replace("$dateAuthorized", authorizedDate);
        request.post((taxCloudPostUrl) ? taxCloudPostUrl : this.taxCloudPostUrl, "Authorized", soapPackage, "AuthorizedCallback");
    }
}

TaxCloud.prototype.AuthorizedCallback = function (request) {
    var xmlDOM = request.GetResponseDOM();
    this.authorizedResponseType = this.getDOMChildElementTextContent(xmlDOM, "ResponseType");
    this.authorizedResponseMessage = this.getDOMChildElementTextContent(xmlDOM, "Message");
    if (this.UserAuthorizedCallback)
        this.userAuthorizedCallback(this);
}

TaxCloud.prototype.Captured = function (taxCloudPostUrl, callback) {
    this.userCapturedCallback
    if (!this.customerID) {
        alert("Customer ID needs to be set");
        return false;
    }
    if (!this.cart) {
        alert("Please generate a cart first");
        return false;
    }
    if (this.shippingAddressNotInUSA) {
        this.capturedResponseType = "OK";
        this.capturedResponseMessage = "shippingAddressNotInUSA";
        if (this.userCapturedCallback)
            this.userCapturedCallback(this);
    }
    else {
        var request = new TaxCloudConnection(this);
        var soapPackage = this.capturedSoapPackage.replace("$orderID", orderID);
        request.post((taxCloudPostUrl) ? taxCloudPostUrl : this.taxCloudPostUrl, "Captured", soapPackage, "CapturedCallback");
    }
}

TaxCloud.prototype.CapturedCallback = function (request) {
    var xmlDOM = request.GetResponseDOM();
    this.capturedResponseType = this.getDOMChildElementTextContent(xmlDOM, "ResponseType");
    this.capturedResponseMessage = this.getDOMChildElementTextContent(xmlDOM, "Message");
    if (this.userCapturedCallback)
        this.userCapturedCallback(this);
}

TaxCloud.prototype.AuthorizedWithCapture = function (taxCloudPostUrl, orderID, authorizedDate, capturedDate, callback) {
    this.userAuthorizedWithCaptureCallback = callback;
    if (!this.customerID) {
        alert("Customer ID needs to be set");
        return false;
    }
    if (!this.cart) {
        alert("Please generate a cart first");
        return false;
    }
    if (this.shippingAddressNotInUSA) {
        this.authorizedWithCaptureResponseType = "OK";
        this.authorizedWithCaptureResponseMessage = "shippingAddressNotInUSA";
        if (this.userAuthorizedWithCaptureCallback)
            this.userAuthorizedWithCaptureCallback(this);
    }
    else {
        var request = new TaxCloudConnection(this);
        var soapPackage = this.authorizedWithCaptureSoapPackage.replace("$customerID", this.customerID).replace("$cartID", this.cart.id).replace("$orderID", orderID).replace("$dateAuthorized", this.ToISODateTime(authorizedDate)).replace("$dateCaptured", this.ToISODateTime(capturedDate));
        request.post((taxCloudPostUrl) ? taxCloudPostUrl : this.taxCloudPostUrl, "AuthorizedWithCapture", soapPackage, "AuthorizedWithCaptureCallback");
    }
}

TaxCloud.prototype.AuthorizedWithCaptureCallback = function (request) {
    var xmlDOM = request.GetResponseDOM();
    this.authorizedWithCaptureResponseType = this.getDOMChildElementTextContent(xmlDOM, "ResponseType");
    this.authorizedWithCaptureResponseMessage = this.getDOMChildElementTextContent(xmlDOM, "Message");
    if (this.userAuthorizedWithCaptureCallback)
        this.userAuthorizedWithCaptureCallback(this);
}

TaxCloud.prototype.Returned = function (taxCloudPostUrl, orderID, returnedDate, callback) {
    this.userReturnedCallback = callback;
    if (this.shippingAddressNotInUSA) {
        this.returnedResponseType = "OK";
        this.returnedResponseMessage = "shippingAddressNotInUSA";
        if (this.userReturnedCallback)
            this.userReturnedCallback(this);
    }
    else {
        var request = new TaxCloudConnection(this);
        var soapPackage = this.returnedSoapPackage.replace("$orderID", orderID).replace("$cartItems", this.cart.ReturnedSoapPackage()).replace("$dateReturned", this.ToISODateTime(returnedDate));
        request.post((taxCloudPostUrl) ? taxCloudPostUrl : this.taxCloudPostUrl, "Returned", soapPackage, "ReturnedCallback");
    }
}

TaxCloud.prototype.ReturnedCallback = function (request) {
    var xmlDOM = request.GetResponseDOM();
    this.returnedResponseType = this.getDOMChildElementTextContent(xmlDOM, "ResponseType");
    this.returnedResponseMessage = this.getDOMChildElementTextContent(xmlDOM, "Message");
    if (this.userReturnedCallback)
        this.userReturnedCallback(this);
}

