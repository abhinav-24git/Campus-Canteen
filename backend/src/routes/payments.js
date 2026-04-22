const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const Razorpay = require('razorpay');
const router = express.Router();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

router.post('/create-rzp', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: 'order_rcptid_11'
    };
    
    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('RZP Creation Error:', JSON.stringify(error, null, 2));
    // Razorpay SDK wraps API errors — surface the real description if available
    const errMsg = error?.error?.description || error?.message || 'Unknown gateway error';
    res.status(500).json({ success: false, error: errMsg });
  }
});

module.exports = router;
