package com.intuit.developer.sampleapp.ecommerce.domain;

import org.joda.money.CurrencyUnit;
import org.joda.money.Money;

import javax.persistence.*;

import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
public class ShoppingCart {

    public static final double SHIPPING_PERCENTAGE = .05d;
    public static final double PROMOTION_MULTIPLIER = .2d;
	
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	long id;
	
	long instanceId;
	
	@OneToOne(optional=false)
	@JoinColumn(name="customer_fk", referencedColumnName="id")
	Customer customer;
	
	@OneToMany(fetch = FetchType.EAGER, cascade=CascadeType.ALL, mappedBy="shoppingCart", orphanRemoval = true)
	List<CartItem> cartItems = new ArrayList<CartItem>();

	protected ShoppingCart()
	{
	}
	
	public ShoppingCart(Customer cust)
	{
		this.customer = cust;
	}
	
	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public long getInstanceId() {
		return this.instanceId;
	}
	
	public void setInstanceId(long instanceId) {
		this.instanceId = instanceId;
	}

	public Customer getCustomer() {
		return customer;
	}

	public void setCustomer(Customer customer) {
		this.customer = customer;
	}

	public List<CartItem> getCartItems() {
		return cartItems;
	}

	public void setCartItems(List<CartItem> cartItems) {
		this.cartItems = cartItems;
	}
	
	public CartItem getCartItem(long id) {
		for (int ii = 0; ii < this.cartItems.size(); ++ii) {
			CartItem cartItem = this.cartItems.get(ii);
			if (cartItem.getId() == id)
				return cartItem;
		}
		return null;
	}
	
	public void addToCart(CartItem cartItem)
	{
		cartItems.add(cartItem);
	}

    public Money getSubTotal() {
        Money subTotal = Money.zero(CurrencyUnit.USD);
        for (CartItem cartItem : cartItems) {
            // subTotal = subTotal + unitPrice * quantity
            subTotal = subTotal.plus(cartItem.getSalesItem().getUnitPrice().multipliedBy(cartItem.getQuantity()));
        }
        return subTotal;
    }
    
    public Double getPromotionDiscount() {
    	return PROMOTION_MULTIPLIER;
    }

    public Money getPromotionSavings() {
        return getSubTotal().multipliedBy(PROMOTION_MULTIPLIER, RoundingMode.CEILING);
    }

    public Money getTaxAmount() {
    	Money taxAmount = Money.zero(CurrencyUnit.USD);
    	for (CartItem cartItem : cartItems) {
    		taxAmount = taxAmount.plus(cartItem.getTaxAmount());
    	}
        return taxAmount;
    }

	public Money getShipping() {
		return getSubTotal().minus(getPromotionSavings()).multipliedBy(SHIPPING_PERCENTAGE, RoundingMode.FLOOR);
	}

    public Money getTotal() {
        return getSubTotal().plus(getTaxAmount()).minus(getPromotionSavings());
    }

}

