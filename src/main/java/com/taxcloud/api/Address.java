package com.taxcloud.api;

public class Address {

	static private final String VERIFYADDRESS_SOAP_PACKAGE = "<VerifyAddress xmlns='http://taxcloud.net'><address1>$address1</address1><address2>$address2</address2><city>$city</city><state>$state</state><zip5>$zip5</zip5><zip4>$zip4</zip4></VerifyAddress>";
	
	private String address1;
	private String address2;
	private String city;
	private String state;
	private String zip5;
	private String zip4;
	
	private boolean isOrigin = false;
	private boolean isVerified = false;
	
	public Address(String address1, String address2, String city, String state, String zip5, String zip4) {
		this.address1 = address1;
		this.address2 = address2;
		this.city = city;
		this.state = state;
		this.zip5 = zip5;
		this.zip4 = zip4;
	}
	
	public boolean IsOrigin() {
		return this.isOrigin;
	}
	
	public void SetIsOrigin(boolean flag) {
		this.isOrigin = flag;
	}
	
	public boolean IsVerified() {
		return this.isVerified;
	}
	
	public void SetIsVerified(boolean flag) {
		this.isVerified = flag;
	}
	
	public String SoapPackage() {
		String resultPackage = VERIFYADDRESS_SOAP_PACKAGE.replace("$address1",  this.address1);
		resultPackage = resultPackage.replace("$address1", this.address2);
		resultPackage = resultPackage.replace("$city", this.city);
		resultPackage = resultPackage.replace("$state", this.state);
		resultPackage = resultPackage.replace("$zip5",  this.zip5);
		resultPackage = resultPackage.replace("$zip4", this.zip4);
		return resultPackage;
	}
}
