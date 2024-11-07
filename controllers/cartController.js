const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express')
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Q5z8wFsnlbHkz80TopZoOxOo4daSfiZSloFu1Gwl32KVBjVL9pdmIkvXOWoOIqYfJ5o9K0skDrGE6XtkqgbyFlE00opdCDaQl'); // Replace with your Stripe secret key




// Add product to cart
exports.addToCart = async (req, res) => {
  const productId = parseInt(req.params.id); // Get product ID from the URL
  const { userId, quantity } = req.body; // Get user ID or email and quantity from request body

  if (!userId) {
    return res.status(400).json({ error: 'User identification is required (userId or email)' });
  }

  try {
    // Step 1: Find the user by userId or email
    const user = await prisma.user.findUnique({
      where:  { id: userId } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Add the product to the user's cart
    const existingCart = user.cart || []; // Get existing cart (assume 'cart' is stored as JSON)
    
    // Check if the product is already in the cart
    const productIndex = existingCart.findIndex(item => item.productId === productId);
    
    if (productIndex >= 0) {
      // If product is already in the cart, update the quantity
      existingCart[productIndex].quantity += quantity;
    } else {
      // If product is not in the cart, add a new entry
      existingCart.push({ productId, quantity });
    }

    // Step 3: Update the user's cart in the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // Use the user's ID to update the row
      data: { cart: existingCart },
    });

    console.log('Updated user cart:', updatedUser);
    res.status(201).json(updatedUser); // Send updated user info (including updated cart) back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
  }
}


// Show Cart
exports.showCart = async (req, res) => {
  // console.log(req.body)
  const userId = req.body.id;  // Use the user ID from the request body
  console.log(userId)
  try {
    // Step 1: Fetch the user's cart
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cart: true },  // Only fetch the cart field
    });

    if (!user || !user.cart) {
      return res.status(404).json({ error: 'User or cart not found.' });
    }

    const cartItems = user.cart;  // Assuming the cart is stored as JSON
    const productIds = cartItems.map(item => item.productId);  // Extract product IDs from cart

    if (productIds.length === 0) {
      return res.json([]);  // If the cart is empty, return an empty array
    }

    // Step 2: Fetch product details from the products table
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },  // Fetch products by IDs
    });

    // Step 3: Combine product details with quantities from the cart
    const cartWithDetails = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...product,
        quantity: item.quantity,  // Add the quantity from the cart to the product details
      };
    });

    // Step 4: Return the cart with product details and quantities
    res.json(cartWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the cart.' });
  }
}
