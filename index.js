


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

