const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const prisma = new PrismaClient();
const stripe = Stripe('sk_test_51Q5z8wFsnlbHkz80TopZoOxOo4daSfiZSloFu1Gwl32KVBjVL9pdmIkvXOWoOIqYfJ5o9K0skDrGE6XtkqgbyFlE00opdCDaQl'); // Replace with your Stripe secret key

const express = require('express')
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key





// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    // console.log('Retrieved products:', products); // Log the retrieved products
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
}

// Get a single product by ID
exports.getProductById = async (req, res) => {
  const productId = req.params.id

  // console.log(productId)
  try {
    const product = await prisma.products.findUnique({where : {id : +productId} });
    // console.log('Retrieved product:', product); // Log the retrieved product
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching product.' });
  }
}

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  const productCategory = req.params.categorytype
  const convertedCategory = productCategory.replace('_', ' ');
  // console.log(convertedCategory);
  try {
    const CategoryProducts = await prisma.products.findMany({ where: { category: `${convertedCategory}` } });    
    // console.log('Retrieved category products:', CategoryProducts); // Log the retrieved products
    res.json(CategoryProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
}


// Search products by title, category, or description
exports.searchProducts = async (req, res) => {
  // console.log(req.query); // Log the incoming query parameters
  const { q } = req.query; // Extract 'q' from query params
  
  // Check if the search query is provided
  if (!q || q.trim() === "") {
    return res.status(400).json({ error: 'Invalid search query.' }); // Return an error if invalid
  }

  try {
    const SearchedProducts = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: {
              contains: q, // Matches products with title containing the search query
              // mode: 'insensitive' // Case-insensitive search
            },
          },
          {
            category: {
              contains: q, // Matches products with category containing the search query
              // mode: 'insensitive'
            },
          },
          {
            description: {
              contains: q, // Matches products with category containing the search query
              // mode: 'insensitive'
            },
          },
        ],
      },
    });

    // console.log(SearchedProducts, "sp"); // Log the searched products
    res.json(SearchedProducts); // Send the searched products as JSON
  } catch (error) {
    // console.error('Search error:', error); // Log the actual error for debugging
    res.status(500).json({ error: 'Error while searching products' }); // Return a generic error message
  }
}





