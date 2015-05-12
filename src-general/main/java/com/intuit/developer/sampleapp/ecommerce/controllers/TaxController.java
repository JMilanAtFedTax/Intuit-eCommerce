package com.intuit.developer.sampleapp.ecommerce.controllers;

import com.intuit.developer.sampleapp.ecommerce.domain.ShoppingCart;
import com.intuit.developer.sampleapp.ecommerce.domain.CartItem;
import com.intuit.developer.sampleapp.ecommerce.qbo.PaymentGateway;
import com.intuit.developer.sampleapp.ecommerce.qbo.QBOGateway;
import com.intuit.developer.sampleapp.ecommerce.repository.CartItemRepository;
import com.intuit.developer.sampleapp.ecommerce.repository.CustomerRepository;
import com.intuit.developer.sampleapp.ecommerce.repository.SalesItemRepository;
import com.intuit.developer.sampleapp.ecommerce.repository.ShoppingCartRepository;
import com.intuit.ipp.data.SalesReceipt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Handles requests to update shopping carts
 */
@RestController
@RequestMapping("/taxes")
public class TaxController {
	private static final Logger LOGGER = LoggerFactory.getLogger(TaxController.class);

    @Autowired
    private ShoppingCartRepository shoppingCartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SalesItemRepository salesItemRepository;

    @Autowired
    private PaymentGateway paymentGateway;

    @Autowired
    private QBOGateway qboGateway;

    @RequestMapping(method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
    @ResponseBody
    public ShoppingCartItemResponse updateTaxInformation(@RequestBody final ShoppingCartItemRequest shoppingCartItemRequest) {
        ShoppingCart cart = shoppingCartRepository.findOne(shoppingCartItemRequest.getShoppingCartId());
        CartItem cartItem = cart.getCartItem(shoppingCartItemRequest.getCartItemId());
        cartItem.setTaxRate(shoppingCartItemRequest.getTaxRate());
        cartItem.setTaxAmount(shoppingCartItemRequest.getTaxAmount());
        return ShoppingCartItemResponse.fromCartItem(cartItem);
    }
}
