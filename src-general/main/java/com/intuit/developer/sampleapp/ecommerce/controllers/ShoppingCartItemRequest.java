package com.intuit.developer.sampleapp.ecommerce.controllers;

import com.intuit.developer.sampleapp.ecommerce.converters.MoneyConverter;

import org.joda.money.Money;

import java.math.BigDecimal;

public class ShoppingCartItemRequest {
	long shoppingCartId;
	long cartItemId;
    String taxRate;
    Money taxAmount;

    public ShoppingCartItemRequest() {

    }

    public long getShoppingCartId() {
        return this.shoppingCartId;
    }

    public void setShoppingCartId(long shoppingCartId) {
        this.shoppingCartId = shoppingCartId;
    }
    
    public long getCartItemId() {
    	return this.cartItemId;
    }
    
    public void setCartItemId(long cartItemId) {
    	this.cartItemId = cartItemId;
    }

    public String getTaxRate() {
        return this.taxRate;
    }

    public void setTaxRate(String taxRate) {
        this.taxRate = taxRate;
    }
    
    public Money getTaxAmount() {
    	return this.taxAmount;
    }
    
    public void setTaxAmount(Money taxAmount) {
    	this.taxAmount = taxAmount;
    }
}
