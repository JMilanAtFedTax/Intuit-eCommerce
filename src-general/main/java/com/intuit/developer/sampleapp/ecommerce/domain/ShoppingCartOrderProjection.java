package com.intuit.developer.sampleapp.ecommerce.domain;

import org.joda.money.Money;
import org.springframework.data.rest.core.config.Projection;

@Projection(name = "order", types = ShoppingCart.class)
public interface ShoppingCartOrderProjection {
    long getId();
    long getInstanceId();
    Money getSubTotal();
    Double getPromotionDiscount();
    Money getPromotionSavings();
    Money getTaxAmount();
	Money getShipping();
    Money getTotal();
}
