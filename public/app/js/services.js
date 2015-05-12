'use strict';

/* Services */


var ecommerceServices = angular.module('myApp.services', ['ngResource']);

ecommerceServices.value('version', '0.1');

ecommerceServices.factory('InitializerSvc', ['$rootScope', 'RootUrlSvc', 'CompanySvc', 'SalesItemSvc', 'CustomerSvc', 'ShoppingCartSvc', 'CartItemSvc', 'SystemPropertySvc', 'IntuitSvc', 'TaxCloudSvc',
    function ($rootScope, RootUrlSvc, CompanySvc, SalesItemSvc, CustomerSvc, ShoppingCartSvc, CartItemSvc, SystemPropertySvc, IntuitSvc, TaxCloudSvc) {

        var initialized = false;

        var initialize = function () {

            $rootScope.$on('api.loaded', function() {
                SystemPropertySvc.initializeModel();
                TaxCloudSvc.initialize();
                CompanySvc.initialize();
                SalesItemSvc.initialize();
                CustomerSvc.initialize();
                ShoppingCartSvc.initialize();
                CartItemSvc.initialize();
                CompanySvc.initializeModel();
                IntuitSvc.initialize();
            });

            $rootScope.$on('model.company.change', function() {
                SalesItemSvc.initializeModel();
                CustomerSvc.initializeModel();
            });

            $rootScope.$on('model.customer.change', function () {
                ShoppingCartSvc.initializeModel();
            });

            $rootScope.$on('model.shoppingcart.change', function () {
            });

            $rootScope.$on('model.shoppingcartitem.change', function () {
                ShoppingCartSvc.calculate();
            });

            RootUrlSvc.initialize();

            $rootScope.$on('$viewContentLoaded', function (scope, next, current) {
                /*
                 Every time we load a new view, we need to reinitialize the intuit anywhere library
                 so that the connect to quickbooks button is rendered properly
                 */
                if (initialized) { //only reinitialize from the 2nd time onwards
                    intuit.ipp.anywhere.init();
                }
                initialized = true;
            });
        };

        return {
            initialize: initialize
        }
    }]);

//A service which contains the current model (e.g. companies, items, etc)
ecommerceServices.factory('ModelSvc', ['$rootScope',
    function ($rootScope) {

        var model = {};
        model.company = {};

        var broadcastCompanyChange = function () {
            $rootScope.$broadcast('model.company.change');
        };

        var onCompanyChange = function ($scope, callback) {
            $scope.$on('model.company.change', function () {
                callback(model);
            });
        };

        return {
            model: model,
            onCompanyChange: onCompanyChange,
            broadcastCompanyChange: broadcastCompanyChange
        }
    }]);

//a service which reads the root of the API and stores all the resource urls
ecommerceServices.factory('RootUrlSvc', ['$resource', '$rootScope', '$location',
    function ($resource, $rootScope, $location) {

        var rootUrls = {};
        var apiRoot = function() {
            return $location.protocol() +"://" + $location.host() + ":9001";
        };

        var initialize = function () {
            $resource(apiRoot()).get(function (data) {
                var links = data._links;
                for (var link in  links) {
                    var href = links[link].href;
//                    console.log("Discovered the URL for " + link + ": " + href);
                    rootUrls[link] = href.split(/\{/)[0]; //chop off the template stuff
                }
                rootUrls['syncRequest'] = apiRoot() + "/syncrequest";  // non-discoverable
                rootUrls['orders'] = apiRoot() + "/orders";  // non-discoverable
                $rootScope.$broadcast('api.loaded');  //broadcast an event so that the CompanySvc can know to load the companies
            });
        };

        var oauthGrantUrl = function() {
            return apiRoot() + "/request_token";
        }

        var onApiLoaded = function ($scope, callback) {
            $scope.$on('api.loaded', function () {
                callback();
            });out
        };

        return {
            initialize: initialize,
            rootUrls: rootUrls,
            onApiLoaded: onApiLoaded,
            oauthGrantUrl : oauthGrantUrl
        }
    }]);

//A service which deals with CRUD operations for companies
ecommerceServices.factory('CompanySvc', ['$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($resource, $rootScope, RootUrlSvc, ModelSvc) {

        var Company;

        var initialize = function () {
            Company = $resource(RootUrlSvc.rootUrls.companies + ':companyId', {}, { query: {method: 'GET', isArray: false} });
        };

        var initializeModel = function() {
            Company.query(function (data) {
                var companies = data._embedded.companies;
                ModelSvc.model.companies = companies;
                ModelSvc.model.company = companies[0]; //select the first company for now
                ModelSvc.broadcastCompanyChange();

                var grantUrl = RootUrlSvc.oauthGrantUrl() + '?appCompanyId=' + ModelSvc.model.company.id;
                intuit.ipp.anywhere.setup({
                    grantUrl: grantUrl,
                    datasources: {
                        quickbooks: true,
                        payments: true

                    }
                });
            });
        };

        return {
            initialize: initialize,
            initializeModel: initializeModel
        }

    }]);


ecommerceServices.factory('SalesItemSvc', ['$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($resource, $rootScope, RootUrlSvc, ModelSvc) {

        var SalesItem;

        var initialize = function() {
            SalesItem = $resource(RootUrlSvc.rootUrls.salesItems, {}, { query: {method: 'GET', isArray: false} });
        };

        var initializeModel = function() {
            SalesItem.query(function (data) {
                var salesItems = data._embedded.salesItems;
                ModelSvc.model.company.salesItems = salesItems;
            });
        }

        return {
            initialize: initialize,
            initializeModel: initializeModel
        }
    }]);


ecommerceServices.factory('CustomerSvc', ['$http', '$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc', 'ShoppingCartSvc',
    function ($http, $resource, $rootScope, RootUrlSvc, ModelSvc, ShoppingCartSvc) {

        var broadcastCustomerChange = function () {
            $rootScope.$broadcast('model.customer.change');
            ModelSvc.taxCloud.addressDestination.name = "TaxCloud/Intuit eCommerce Sample App";
            ModelSvc.taxCloud.addressDestination.address1 = "3205 South Judkins Street";
            ModelSvc.taxCloud.addressDestination.city = "Seattle";
            ModelSvc.taxCloud.addressDestination.state = "WA";
            ModelSvc.taxCloud.addressDestination.zip5 = "98144";
            ModelSvc.taxCloud.VerifyDestinationAddress(function (flag) {
                if (flag)
                    console.debug('TaxCloud destination address verified');
                else
                    console.debug('TaxCloud destination address NOT verified');
            });
        };

        //var onCustomerChange = function ($scope, callback) {
        //    $scope.$on('model.customer.change', function () {
        //        //callback(model);
        //    });
        //};

        var promise = $http.get('/customers').success(function (data) {
            var customers = data._embedded.customers;
            ModelSvc.model.company.customers = customers;
            ModelSvc.model.customer = customers[0];  // auto-set the 'logged in' customer
            ModelSvc.taxCloud.customerID = ModelSvc.model.customer.id;
            broadcastCustomerChange();
        });

        var Customer;

        var initialize = function() {
            Customer = $resource(RootUrlSvc.rootUrls.customers, {}, { query: {method: 'GET', isArray: false} });
        };

        var initializeModel = function() {
            //Customer.query(function(data) {
                //var customers = data._embedded.customers;
                //ModelSvc.model.company.customers = customers;
                //ModelSvc.model.customer = customers[0];  // auto-set the 'logged in' customer

                //ShoppingCartSvc.initializeModel();
            //});
        }

        return {
            promise: promise,
            initialize: initialize,
            initializeModel: initializeModel,
            broadcastCustomerChange: broadcastCustomerChange
        }
    }]);


ecommerceServices.factory('ShoppingCartSvc', ['$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc', 'CartItemSvc',
    function ($resource, $rootScope, RootUrlSvc, ModelSvc, CartItemSvc) {

        var broadcastShoppingCartChange = function () {
            $rootScope.$broadcast('model.shoppingcart.change');
        };

        var calculate = function () {
            ModelSvc.model.shoppingCart.total -= ModelSvc.model.shoppingCart.taxAmount;
            ModelSvc.model.shoppingCart.taxAmount = 0.0;
            angular.forEach(ModelSvc.model.shoppingCartItems, function (cartItem) {
                ModelSvc.model.shoppingCart.taxAmount += cartItem.taxAmount;
                ModelSvc.model.shoppingCart.total += cartItem.taxAmount;
            });
            $rootScope.$apply();
        };

        var ShoppingCart;

        var initialize = function() {
            ShoppingCart = $resource(RootUrlSvc.rootUrls.shoppingCarts, {},
                {
                    forCustomer: {  method: 'GET',
                        url: RootUrlSvc.rootUrls.shoppingCarts + '/search/findByCustomerId',
                        params: {projection: 'order'},
                        isArray: false},

                    query: { method: 'GET', isArray: false}
                });
        };

        var initializeModel = function() {
            refreshShoppingCart();
        };

        var refreshShoppingCart = function() {
            var customerShoppingCart = ShoppingCart.forCustomer({customerId: ModelSvc.model.customer.id}, function() {
                ModelSvc.model.shoppingCart = customerShoppingCart._embedded.shoppingCarts[0];
                ModelSvc.taxCloud.CreateCart(ModelSvc.model.shoppingCart.instanceId);
                console.debug('TaxCloud cart created with id: ' + ModelSvc.taxCloud.cart.id);
                CartItemSvc.getCartItems();
            });
        };

        return {
            initialize: initialize,
            initializeModel: initializeModel,
            refreshShoppingCart: refreshShoppingCart,
            calculate: calculate,
            broadcastShoppingCartChange: broadcastShoppingCartChange
        }
    }]);


ecommerceServices.factory('CartItemSvc', ['$http', '$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($http, $resource, $rootScope, RootUrlSvc, ModelSvc) {

        var broadcastShoppingCartItemChange = function () {
            $rootScope.$broadcast('model.shoppingcartitem.change');
        };

        var calculate = function () {
            $rootScope.$apply();
        };

        var CartItem;

        var initialize = function() {
            CartItem = $resource(RootUrlSvc.rootUrls.cartItems, {},
                        {   query: { method: 'GET', isArray: false },
                            forShoppingCart: {
                                method: 'GET',
                                url: RootUrlSvc.rootUrls.cartItems + '/search/findByShoppingCartId',
                                params: {projection: 'summary'},
                                isArray: false}
                        });

            ModelSvc.model.shoppingCartItems = [];
        };

        var angularCartItemsToTaxCloudCartItems = function (aCart, tCart) {
            ModelSvc.taxCloud.cart.ClearItems();
            angular.forEach(aCart.cartItems, function (item) {
                ModelSvc.taxCloud.cart.AddItem(new TaxCloudCartItem(item.salesItem.id, item.salesItem.name, item.salesItem.unitPrice, ModelSvc.model.shoppingCart.promotionDiscount, item.quantity, item.salesItem.tic));
                console.debug('\tTaxCloud load cart item: ' + item.salesItem.name);
            });
        };

        var taxCloudCartItemsToAngularCartItems = function (tCart, aCart) {
            for (var ii = 0; ii < tCart.items.length; ++ii) {
                var tItem = tCart.items[ii];
                var aItem = aCart.cartItems[ii];
                aItem.taxRate = tItem.TaxRate();
                aItem.taxAmount = tItem.taxAmount;
                broadcastShoppingCartItemChange();
            }
        };

        var getCartItems = function() {
            if (ModelSvc.model.shoppingCart != 'undefined') {
                var shoppingCartItems = CartItem.forShoppingCart({ shoppingCartId: ModelSvc.model.shoppingCart.id }, function (data) {
                    ModelSvc.model.shoppingCartItems =
                        shoppingCartItems._embedded ?
                            ModelSvc.model.shoppingCartItems = shoppingCartItems._embedded.cartItems : {};
                });
                shoppingCartItems.$promise.then(function (data) {
                    if (data._embedded) {
                        angularCartItemsToTaxCloudCartItems(data._embedded, ModelSvc.taxCloud.cart);
                        console.debug('TaxCloud cart loaded with persistent items');
                    }
                    else
                        console.debug('TaxCloud cart is empty');
                });
            }
        };

        var addCartItem = function(salesItem, shoppingCart) {
            var cartItem = new CartItem();
            cartItem.shoppingCart = shoppingCart._links.self.href.split(/\{/)[0];
            cartItem.salesItem = salesItem._links.self.href.split(/\{/)[0];
            cartItem.quantity = 1;
            //cartItem.taxRate = "9.50%";
            //cartItem.taxAmount = "6.50";
            //cartItem.$save();
            ModelSvc.taxCloud.cart.AddItem(new TaxCloudCartItem(salesItem.id, salesItem.name, salesItem.unitPrice, shoppingCart.promotionDiscount, cartItem.quantity, salesItem.tic));
            ModelSvc.taxCloud.Lookup(function (success) {
                if (success) {
                    cartItem.taxRate = (ModelSvc.taxCloud.cart.items[0].TaxRate() * 100.0).toFixed(2) + '%';
                    cartItem.taxAmount = ModelSvc.taxCloud.cart.items[0].taxAmount.toFixed(2);
                    cartItem.$save();
                    console.debug('TaxCloud item added to cart');
                }
            });
        };

        return {
            initialize: initialize,
            getCartItems: getCartItems,
            addCartItem: addCartItem,
            calculate: calculate,
            broadcastShoppingCartItemChange: broadcastShoppingCartItemChange
        }
    }]);

ecommerceServices.factory('OrderSvc', ['$http', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($http, $rootScope, RootUrlSvc, ModelSvc) {

        var sendOrder = function (creditCard, billingInfo, successCallback, errorCallback) {
            // step 1 - tokenize credit card info
            var request = {};

            request.card = {};
            var card = request.card;
            card.number = creditCard.number;
            card.expMonth = creditCard.expMonth;
            card.expYear = creditCard.expYear;
            card.cvc = creditCard.CVC;
            card.address = {};
            card.address.streetAddress = billingInfo.address;
            card.address.city = billingInfo.cityStateZip.split(",")[0];
            card.address.region = billingInfo.cityStateZip.split(",")[1].trim().split(" ")[0];
            card.address.country = "US";
            card.address.postalCode = billingInfo.cityStateZip.split(",")[1].trim().split(" ")[1];;

            tokenize(request, successCallback, errorCallback);
        };

        var tokenize = function(card, successCallback, errorCallback) {
            intuit.ipp.payments.tokenize(ModelSvc.model.systemProperties.appToken, card, function(token, response) {
                if (token) {
                    // step 2 - place order to backend
                    console.log('placing order to: ' + RootUrlSvc.rootUrls.orders + ' with args: ' + token + ", " + ModelSvc.model.shoppingCart.id);
                    $http.post(
                        RootUrlSvc.rootUrls.orders,
                        { shoppingCartId: ModelSvc.model.shoppingCart.id, paymentToken: token })
                        .success(successCallback)
                        .error(errorCallback);
                }
                else {
                    console.log("Error during tokenization " + response.code +"<br/>" + response.message + "<br/>" + response.detail + "<br/>" + response.moreinfo);
                    errorCallback(response);
                }
            });
         };

        var initialize = function () {

        };

        return {
            initialize: initialize,
            sendOrder: sendOrder
        }
    }]);

ecommerceServices.factory('SyncRequestSvc', ['$http', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($http, $rootScope, RootUrlSvc, ModelSvc) {

        var sendSyncRequest = function (entityType, successCallback, errorCallback) {
            $http.post(RootUrlSvc.rootUrls.syncRequest, {type: entityType, companyId: ModelSvc.model.company.id})
                    .success(successCallback);
        };

        var initialize = function () {

        };

        return {
            initialize: initialize,
            sendCustomerSyncRequest: function (callback) { sendSyncRequest('Customer', callback); },
            sendSalesItemSyncRequest: function (callback) { sendSyncRequest('SalesItem', callback) }
        }
    }]);

ecommerceServices.factory('DeepLinkSvc', ['ModelSvc',
    function (ModelSvc) {

        var getQboDeepLinkURLRoot = function () {
            return "https://" + ModelSvc.model.systemProperties.qboUiHostname + "/login?";
        };

        var getMultipleEntitiesUrl = function (entityType) {
            return getQboDeepLinkURLRoot() + "deeplinkcompanyid=" + ModelSvc.model.company.qboId + "&pagereq=" + entityType;
        };

        var getSingleEntityUrl = function (entityType, entityId) {
            return getQboDeepLinkURLRoot() + "pagereq=" + entityType + "?txnId=" + entityId + "&deeplinkcompanyid=" + ModelSvc.model.company.qboId;
        };

        var getCustomersLink = function () {
            return getMultipleEntitiesUrl("customers");
        };

        var getSalesReceiptLink = function (entityId) {
            return getSingleEntityUrl("salesreceipt", entityId);
        };

        var getItemsLink = function () {
            return getMultipleEntitiesUrl("items");
        };

        return {
            getCustomersLink: getCustomersLink,
            getItemsLink: getItemsLink,
            getSalesReceiptLink: getSalesReceiptLink
        }
    }
]);

ecommerceServices.factory('SystemPropertySvc', [ '$resource', 'RootUrlSvc', 'ModelSvc',
    function ($resource, RootUrlSvc, ModelSvc) {

        var SystemProperty;

        var initializeModel = function () {
            SystemProperty = $resource(RootUrlSvc.rootUrls.systemProperties, {},
                {
                    query: {
                        isArray: false
                    }
                });
            SystemProperty.query(function (data) {
                ModelSvc.model.systemProperties = {};

                if (data._embedded) {
                    angular.forEach(data._embedded.systemProperties, function (systemProperty) {
                        ModelSvc.model.systemProperties[systemProperty.key] = systemProperty.value;
                    });
                }
            });
        }

        return {
            initializeModel: initializeModel
        }
}]);

ecommerceServices.factory('TrackingSvc', [function () {
    return {

        trackPage: function (pageName, event, properties) {
            var props = properties || {};
            props['site_section'] = 'sampleapps';
            pageName = 'sampleapps/ecommerce/' + pageName;

            wa.trackPage(pageName, event, properties);
        },

        trackEvent: function (event, properties) {
            var props = properties || {};
            props['site_section'] = 'sampleapps';

            wa.trackEvent(event, properties);
        }

    };
}]);

//A service which works with Inuit
ecommerceServices.factory('IntuitSvc', ['$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($resource, $rootScope, RootUrlSvc, ModelSvc) {

        var Connection;

        var initialize = function () {
        };

        return {
            initialize: initialize,
        }
    }]);

//A service which works with TaxCLoud
ecommerceServices.factory('TaxCloudSvc', ['$resource', '$rootScope', 'RootUrlSvc', 'ModelSvc',
    function ($resource, $rootScope, RootUrlSvc, ModelSvc) {

        var taxCloud = null;

        var initialize = function () {
            taxCloud = new TaxCloud('C1988C0', 'D35B1C5F-D6D8-43C0-B804-10EDFCA52796');
            taxCloud.Ping(function (flag) {
                if (flag)
                    console.debug('TaxCloud ping successful');
                else
                    console.debug('TaxCloud ping NOT successful');

            });
            taxCloud.addressOrigin.name = "TaxCloud/Intuit eCommerce Sample App";
            taxCloud.addressOrigin.address1 = "3205 South Judkins Street";
            taxCloud.addressOrigin.city = "Seattle";
            taxCloud.addressOrigin.state = "WA";
            taxCloud.addressOrigin.zip5 = "98144";
            taxCloud.VerifyOriginAddress(function (flag) {
                if (flag)
                    console.debug('TaxCloud origin address verified');
                else
                    console.debug('TaxCloud origin address NOT verified');
            });
            ModelSvc.taxCloud = taxCloud;
        };

        return {
            initialize: initialize,
        }
    }]);
