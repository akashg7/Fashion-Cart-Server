


const express = require('express')
const data = require("./db.json")
const cors = require('cors');
const connection = require('./db');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Q5z8wFsnlbHkz80TopZoOxOo4daSfiZSloFu1Gwl32KVBjVL9pdmIkvXOWoOIqYfJ5o9K0skDrGE6XtkqgbyFlE00opdCDaQl'); // Replace with your Stripe secret key





const authController = require('./controllers/authController'); // Your authController
const cartController = require('./controllers/cartController'); // Your cartController
const productController = require('./controllers/productController'); // Your productController
const paymentController = require('./controllers/paymentController'); // Your productController
const bodyParser = require('body-parser')



const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // To parse JSON request bodies



// Auth Routes (Signup and Signin)
app.post('/signup', authController.signup);
app.post('/signin', authController.signin);

// Product Routes
app.get('/products', productController.getAllProducts); // Get all products
app.get('/product/:id', productController.getProductById); // Get single product by ID
app.get('/products/category/:categorytype', productController.getProductsByCategory); 
app.get('/search', productController.searchProducts); 

// Cart Routes (Add to Cart, View Cart)
app.post('/product/:id/addtocart', cartController.addToCart); // Adding product to cart
app.post('/cart', cartController.showCart); // getting user's cart


app.delete('/product/:id', async (req, res) => {
  const { id } = req.params; 

  try {
    // Attempt to delete the product by its ID
    const deletedProduct = await prisma.products.delete({
      where: {
        id: parseInt(id), // Ensure the ID is an integer if it's stored as INT in your database
      },
    });

    // Send a success response
    res.status(200).json({
      message: 'Product deleted successfully',
      deletedProduct, // Optionally return the deleted product details
    });
  } catch (error) {
    
    if (error.code === 'P2025') { // P2025 is Prisma's "Record to delete does not exist" error code
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'An error occurred while deleting the product', error });
  }
});


app.put('/product/:id', async (req, res) => {
  const { id } = req.params; 
  const { title, price, description, category } = req.body; 

  try {
    
    const updatedProduct = await prisma.products.update({
      where: {
        id: parseInt(id), 
      },
      data: {
        title,
        price,
        description,
        category,
      },
    });

    
    res.status(200).json({
      message: 'Product updated successfully',
      updatedProduct, 
    });
  } catch (error) {
    
    if (error.code === 'P2025') { // P2025 is Prisma's "Record to update does not exist" error code
      return res.status(404).json({ message: 'Product not found' });
    }
    // Other errors
    res.status(500).json({ message: 'An error occurred while updating the product', error });
  }
});


//checkout
app.post('/create-payment-intent', paymentController.createPaymentIntent) 


app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Handle application shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

