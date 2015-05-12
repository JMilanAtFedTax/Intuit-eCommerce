package com.intuit.developer.sampleapp.ecommerce.domain;

import java.math.RoundingMode;

import javax.persistence.*;
import java.math.BigDecimal;

import com.intuit.developer.sampleapp.ecommerce.converters.MoneyConverter;

import org.joda.money.Money;

@Entity
public class CartItem {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private long id;

	@ManyToOne(optional=false)
	@JoinColumn(name="item_fk", referencedColumnName="id")
	private SalesItem salesItem;

	@ManyToOne(optional=false)
	@JoinColumn(name="shopping_cart_fk", referencedColumnName="id")
	private ShoppingCart shoppingCart;

	private int quantity;

	private String taxRate = "0.0%";

	@Convert(converter = MoneyConverter.class)
	private Money taxAmount = Money.parse("USD 0.0");
	
	public CartItem() {
	}

	public CartItem(SalesItem salesItem, int quantity, ShoppingCart shoppingCart)
	{
		this.salesItem = salesItem;
		this.quantity = quantity;
		this.shoppingCart = shoppingCart;
	}

	public ShoppingCart getShoppingCart() {
		return shoppingCart;
	}

	public void setShoppingCart(ShoppingCart shoppingcart) {
		this.shoppingCart = shoppingcart;
	}

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public SalesItem getSalesItem() {
		return salesItem;
	}

	public void setSalesItem(SalesItem salesItem) {
		this.salesItem = salesItem;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}
	
	public Money getPromotionPrice() {
		return getSalesItem().getUnitPrice().multipliedBy(1.0 - this.shoppingCart.getPromotionDiscount(), RoundingMode.CEILING);
	}
	
	public String getTaxRate() {
		return taxRate;
	}
	
	public void setTaxRate(String taxRate) {
		this.taxRate = taxRate;
	}
	
	public Money getTaxAmount() {
		return taxAmount;
	}
	
	public void setTaxAmount(Money taxAmount) {
		this.taxAmount = taxAmount;
	}
	
	public Money getOrderAmount() {
		return this.getPromotionPrice().plus(this.taxAmount);
	}

	@Override
	public boolean equals(Object obj)
	{
		if(obj instanceof CartItem)
		{
			if(this.salesItem.getId() == ((CartItem)obj).getSalesItem().getId())
				return true;
		}
		return false;
	}
}
