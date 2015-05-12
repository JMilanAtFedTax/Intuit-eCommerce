package com.taxcloud.api;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Date;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;

import org.joda.time.*;

public class TaxCloud {

	static private final String USER_AGENT = "TaxCloud Java Library";
	static private final String TAXCLOUD_ENDPOINT = "https://api.taxcloud.net/1.0/TaxCloud.asmx";
	static private final String TAXCLOUD_DEVELOPMENT_ENDPOINT = "https://api.hoth.taxcloud.net/1.0/TaxCloud.asmx";
	static private final String PING_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Ping xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey></Ping></s:Body></s:Envelope>";
	static private final String VERIFYADDRESS_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><VerifyAddress xmlns='http://taxcloud.net'><uspsUserID>$uspsUserID</uspsUserID><address1>$address1</address1><address2>$address2</address2><city>$city</city><state>$state</state><zip5>$zip5</zip5><zip4>$zip4</zip4></VerifyAddress></s:Body></s:Envelope>";
	static private final String LOOKUP_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Lookup xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID>$cart$addressOrigin$addressDestination<deliveredBySeller>$deliveredBySeller</deliveredBySeller></Lookup></s:Body></s:Envelope>";
	static private final String AUTHORIZED_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Authorized xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><cartID>$cartID</cartID><orderID>$orderID</orderID><dateAuthorized>$dateAuthorized</dateAuthorized></Authorized></s:Body></s:Envelope>";
    static private final String CAPTURED_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Captured xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><orderID>$orderID</orderID></Captured></s:Body></s:Envelope>";
    static private final String AUTHORIZEDWITHCAPTURE_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><AuthorizedWithCapture xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKey</apiKey><customerID>$customerID</customerID><cartID>$cartID</cartID><orderID>$orderID</orderID><dateAuthorized>$dateAuthorized</dateAuthorized><dateCaptured>$dateCaptured</dateCaptured></AuthorizedWithCapture></s:Body></s:Envelope>";
    static private final String RETURNED_SOAP_PACKAGE = "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/'><s:Body xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'><Returned xmlns='http://taxcloud.net'><apiLoginID>$apiLoginID</apiLoginID><apiKey>$apiKeyID</apiKey><orderID>$orderID</orderID>$cartItems<returnedDate>$dateReturned</returnedDate></Returned></s:Body></s:Envelope>";

    private String loginID;
    private String apiKey;
    private Cart cart = null;
    private boolean inDevelopmentMode = false;
    
    public TaxCloud(String loginID, String apiKey) {
    	this.loginID = loginID;
    	this.apiKey = apiKey;
    }
    
    public boolean InDevelopmentMode() {
    	return this.inDevelopmentMode;
    }
    
    public void SetInDevelopmentMode(boolean flag) {
    	this.inDevelopmentMode = flag;
    }
    
    public String GetEndpoint() {
    	if (this.inDevelopmentMode)
    		return TAXCLOUD_DEVELOPMENT_ENDPOINT;
    	else
    		return TAXCLOUD_ENDPOINT;
    }
    
    private String replaceCommon(String soapPackage) {
    	String result = soapPackage.replace("$apiLoginID", this.loginID);
    	result = result.replace("$apiKey",  this.apiKey);
    	return result;
    }
    
    private String execute(String soapPackage) throws Exception {
		URL obj = new URL(this.GetEndpoint());
		HttpsURLConnection con = (HttpsURLConnection) obj.openConnection();
		con.setHostnameVerifier(new HostnameVerifier() {
            public boolean verify(String hostname, SSLSession session) {
                return true;
            }
        });
		
		//add request header
		con.setRequestMethod("POST");
		con.setRequestProperty("User-Agent", USER_AGENT);
		con.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
		con.setRequestProperty("Accept", "text/xml");
 
		// Send post request
		con.setDoOutput(true);
		DataOutputStream wr = new DataOutputStream(con.getOutputStream());
		wr.writeBytes(soapPackage);
		wr.flush();
		wr.close();
 
		int responseCode = con.getResponseCode();
		 
		BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
		String inputLine;
		StringBuffer response = new StringBuffer();
 
		while ((inputLine = in.readLine()) != null) {
			response.append(inputLine);
		}
		in.close();

		return response.toString();
    }
    
    public boolean VerifyOrigin(Address address) throws Issue {
    	if (!address.IsOrigin())
    		throw new Issue("VeifiyOrigin called but address object is not marked as origin.");
    	String soapPackage = this.replaceCommon(VERIFYADDRESS_SOAP_PACKAGE);
    	return false;
    }
    
    public boolean VerifyDestination(Address address) {
    	String soapPackage = this.replaceCommon(VERIFYADDRESS_SOAP_PACKAGE);
    	return false;
    }
    
    public boolean Lookup() throws Issue {
    	if (this.cart == null)
    		throw new Issue("Cannot lookup a null cart");
    	
    	String soapPackage = this.replaceCommon(LOOKUP_SOAP_PACKAGE);
    	soapPackage = soapPackage.replace("$cart", this.cart.LookupSoapPackage());
    	
    	String response = null;
    	try {
    		response = execute(soapPackage);
    		if (this.inDevelopmentMode)
    			System.out.println("\nTaxCloud LookupL " + response.toString());
    		return true;
    	}
    	catch (Exception ex) {
    		System.out.println(ex.getMessage());
    		return false;
    	}
    }
    
    public boolean Authorized(String customerId, String cartId, String orderId, Date dateAuthorized) {
    	String isoDateAuthorized = new DateTime(dateAuthorized).toString();
    	String soapPackage = this.replaceCommon(AUTHORIZED_SOAP_PACKAGE);
    	soapPackage = soapPackage.replace("$customerID", customerId);
    	soapPackage = soapPackage.replace("$cartID", cartId);
    	soapPackage = soapPackage.replace("$orderID",  orderId);
    	soapPackage = soapPackage.replace("$dateAuthorized", isoDateAuthorized);
    	
    	String response = null;
    	try {
    		response = execute(soapPackage);
	    	System.out.println("\nTaxCloud Authorized: " + response.toString());
	    	return true;
	    }
	    catch (Exception ex) {
    		System.out.println(ex.getMessage());
    		return false;
    	}
    }
    
    public boolean Captured(String customerID, String orderId) {
    	String soapPackage = this.replaceCommon(CAPTURED_SOAP_PACKAGE);
    	soapPackage = soapPackage.replace("$customerID",  customerID);
    	soapPackage = soapPackage.replace("$orderID",  orderId);
    	
    	String response = null;
    	try {
    		response = execute(soapPackage);
	    	System.out.println("\nTaxCloud Captured: " + response.toString());
	    	return true;
	    }
	    catch (Exception ex) {
    		System.out.println(ex.getMessage());
    		return false;
    	}
    }
    
    public boolean AuthorizedWithCapture(String customerId, String cartId, String orderId, Date dateAuthorized) {
    	String isoDateAuthorized = new DateTime(dateAuthorized).toString();
    	String soapPackage = this.replaceCommon(AUTHORIZEDWITHCAPTURE_SOAP_PACKAGE);
    	soapPackage = soapPackage.replace("$customerID", customerId);
    	soapPackage = soapPackage.replace("$cartID", cartId);
    	soapPackage = soapPackage.replace("$orderID",  orderId);
    	soapPackage = soapPackage.replace("$dateAuthorized", isoDateAuthorized);
    	
    	String response = null;
    	try {
    		response = execute(soapPackage);
	    	System.out.println("\nTaxCloud AuthorizedWithCapture: " + response.toString());
	    	return true;
	    }
	    catch (Exception ex) {
    		System.out.println(ex.getMessage());
    		return false;
    	}
    }
    
    public boolean Returned() {
    	String soapPackage = this.replaceCommon(RETURNED_SOAP_PACKAGE);
    	return false;
    }
}
