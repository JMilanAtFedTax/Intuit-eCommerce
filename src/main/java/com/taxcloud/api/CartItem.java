package com.taxcloud.api;

public class CartItem {
	
	static private final String SOAP_PACKAGE = "<CartItem><Index>$index</Index><ItemID>$itemID</ItemID><TIC>$tic</TIC><Price>$price</Price><Qty>$quantity</Qty></CartItem>";
	
	private String id;
	private Integer index;
	private Integer tic;
	private Double price;
	private Integer quantity;
	private Double discount = 0.0;
	private Double taxRate = 0.0;
	private Double taxAmount = 0.0;

	public CartItem(String id, Integer tic, Double price, Integer quantity) {
		this.id = id;
		this.tic = tic;
		this.price = price;
		this.quantity = quantity;
	}
	
	public Double Discount() {
		return this.discount;
	}
	
	public void SetDiscount(Double discount) {
		this.discount = discount;
	}
	
	public Double TaxablePrice() {
		return (this.price * (1.0 - this.discount) * this.quantity);
	}
	
	public String SoapPackage() {
		String resultPackage = SOAP_PACKAGE.replace("$index",  this.index.toString());
		resultPackage = resultPackage.replace("$itemID",  this.id);
		resultPackage = resultPackage.replace("$tic", this.tic.toString());
		resultPackage = resultPackage.replace("$price", this.TaxablePrice().toString());
		resultPackage = resultPackage.replace("$quantity", this.quantity.toString());
		return resultPackage;
	}
}
