const express = require('express')

const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Q5z8wFsnlbHkz80TopZoOxOo4daSfiZSloFu1Gwl32KVBjVL9pdmIkvXOWoOIqYfJ5o9K0skDrGE6XtkqgbyFlE00opdCDaQl'); // Replace with your Stripe secret key

const prisma = new PrismaClient();

const port = process.env.PORT || 3001;
//middle ware to parse json 
// Signup controller
exports.signup = async (req, res) => {
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
}

// Signin controller
exports.signin = async (req, res) => {
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
}