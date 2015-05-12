package com.intuit.developer.sampleapp.ecommerce.controllers;

import com.intuit.developer.sampleapp.ecommerce.domain.CartItem;

public class ShoppingCartItemResponse {
	
    private String status;
	
	public static ShoppingCartItemResponse fromCartItem(CartItem cartItem) {
        ShoppingCartItemResponse response = new ShoppingCartItemResponse();
        response.setStatus("OK");
        return response;
    }
	
	String getStatus() {
		return this.status;
	}
	
	public void setStatus(String status) {
		this.status = status;
	}
}
