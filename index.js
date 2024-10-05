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


const port = process.env.PORT || 3001;
//middle ware to parse json 

const app = express()
const prisma = new PrismaClient();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Post user Sign Up
app.post('/signup', async (req, res) => {
  const {name , email , password} = req.body
  const hashedPassword = await bcrypt.hash(password, 10);
  // console.log(req.body)
  // res.status(200)
  try {
    const alreadyExist = await prisma.user.findUnique({where: { email: email} }); //returns null if not exist
    if(!alreadyExist){
      const newUser = await prisma.user.create({
        data: {
          name : name,
          email : email,
          password : hashedPassword
        },
      });
      // console.log('Created NewUser:', newUser); // Log NewUser
      return res.status(201).json({ message: "Account created successfully", user: newUser });
    } 
    return res.status(409).json({message : "User ALready, Exist Please try Login"})
  } catch (error) {
     console.log(error);
     res.status(500).json({ error: 'An error occurred while Sign Up.' });
  }
});


// Post user Sign In
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  // console.log(email , password)
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please register." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password. Please try again." });
    }

    // Successful sign-in
    // You can send back user info or a token here
    // Successful sign-in, generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload
      JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiration time
    );

    // Send back the token along with user info
    return res.status(200).json({ 
      message: "Sign in successful", 
      user: { id: user.id, email: user.email },
      token // Send the token to the front end
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while signing in.' });
  }
});



// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    // console.log('Retrieved products:', products); // Log the retrieved products
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
});

// Get a single product
app.get('/product/:id', async (req, res) => {
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
});

// Get all products by Category
app.get('/products/category/:categorytype', async (req, res) => {
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
});


// Route to search products
app.get('/search', async (req, res) => {
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
});


//Adding to cart
app.post('/product/:id/addtocart', async (req, res) => {
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
});

// Show Cart
app.post('/cart', async (req, res) => {
  // console.log(req.body)
  const userId = req.body.id;  // Use the user ID from the request body

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
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Create a payment intent with the total amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in smallest currency unit (e.g., cents)
      currency: currency, // Currency like 'usd', 'eur'
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret, // Send the client secret to the frontend
    });
  } catch (error) {
    console.log('Error creating payment intent:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});



// Handle application shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


  app.listen(port, () => {
    console.log(`http://localhost:${port}`)
  })