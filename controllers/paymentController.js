
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Q5z8wFsnlbHkz80TopZoOxOo4daSfiZSloFu1Gwl32KVBjVL9pdmIkvXOWoOIqYfJ5o9K0skDrGE6XtkqgbyFlE00opdCDaQl'); // Replace with your Stripe secret key



// Create Payment Intent
exports.createPaymentIntent = async (req, res) => {
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
  }