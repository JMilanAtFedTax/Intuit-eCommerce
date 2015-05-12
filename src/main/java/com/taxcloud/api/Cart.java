package com.taxcloud.api;

import java.lang.*;
import java.util.*;

public class Cart {
	
	static private final String LOOKUP_SOAP_PACKAGE = "<cartID>$id</cartID><cartItems>$cartItems</cartItems>";
    static private final String RETURNED_SOAP_PACKAGE = "<cartItems>$cartItems</cartItems>";

	
	private String id;
	private List<CartItem> cartItems = new ArrayList<CartItem>();
	
	public Cart(String id) {
		this.id = id;
	}
	
	public String ID() {
		return this.id;
	}
	
	public List<CartItem> CartItems() {
		return this.cartItems;
	}
	
	public int Count() {
		return this.cartItems.size();
	}
	
	public CartItem Item(int index) throws Issue {
		if (index >= 0 && index < this.cartItems.size())
			return this.cartItems.get(index);
		else
			throw new Issue("Index past size of cartItems");
	}
	
	private String soapPackage() {
		StringBuilder result = new StringBuilder();
		for (int ii = 0; ii < this.cartItems.size(); ++ii) {
			CartItem ci = this.cartItems.get(ii);
			result.append(ci.SoapPackage());
		}
		return result.toString();		
	}
	
	public String LookupSoapPackage() {
		String result = LOOKUP_SOAP_PACKAGE.replace("$cartID", this.id);
		result.replace("$cartItems", this.soapPackage());
		return result;
	}
	
	public String ReturnedSoapPackage() {
		String result = RETURNED_SOAP_PACKAGE.replace("$cartItems", this.soapPackage());
		return result;		
	}
}
