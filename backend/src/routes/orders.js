const express = require('express');
const { getIo, getState } = require('../db');
const router = express.Router();

let orderSeq = 1000;
const genOrderCode = () => 'CNT-' + (++orderSeq);
const genId = () => Math.random().toString(36).substring(2, 9);

// Create multiple sub-orders from cart, split by counter.
router.post('/checkout', async (req, res) => {
  try {
    const { studentName, phone, cartItems } = req.body;
    const db = getState();
    
    // Validate inventory first
    for (const cartItem of cartItems) {
      const invItem = db.inventory.find(i => i.id === cartItem.id);
      if (!invItem || invItem.qty < cartItem.qty || !invItem.available) {
        return res.status(400).json({ error: `Not enough stock for ${invItem ? invItem.name : cartItem.id}` });
      }
    }
    
    // Group items by counter ID to split the main order
    const groupedByCounter = {};
    cartItems.forEach(cartItem => {
      const invItem = db.inventory.find(i => i.id === cartItem.id);
      if (!groupedByCounter[invItem.counter]) {
        groupedByCounter[invItem.counter] = [];
      }
      groupedByCounter[invItem.counter].push({
        ...invItem, // Copy price, name, etc
        qty: cartItem.qty,
        totalLine: invItem.price * cartItem.qty
      });
    });
    
    // Deduct inventory 
    for (const cartItem of cartItems) {
      const invItem = db.inventory.find(i => i.id === cartItem.id);
      invItem.qty -= cartItem.qty;
      if (invItem.qty === 0) invItem.available = false;
    }
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const generatedOrders = [];
    
    // Generate tickets
    for (const [counterId, itemsArr] of Object.entries(groupedByCounter)) {
      const orderTotal = itemsArr.reduce((sum, i) => sum + i.totalLine, 0);
      const order = {
        id: genId(),
        code: genOrderCode(),
        userId: phone, // using phone as ID
        studentName,
        counter: parseInt(counterId),
        items: itemsArr,
        total: orderTotal,
        status: 'preparing',
        time: timeStr,
        timestamp: now.getTime()
      };
      db.orders.push(order);
      generatedOrders.push(order);
    }
    
    // Broadcast updates to all clients instantly
    const io = getIo();
    if (io) {
      io.emit('inventory_updated', db.inventory);
      io.emit('orders_created', generatedOrders);
    }
    
    res.status(201).json({ status: 'SUCCESS', orders: generatedOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
