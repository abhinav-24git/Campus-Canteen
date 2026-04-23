const express = require('express');
const { getIo } = require('../db');
const { getDb } = require('../firebase/config');
const router = express.Router();

let orderSeq = 1000;
const genOrderCode = () => 'CNT-' + (++orderSeq);
const genId = () => Math.random().toString(36).substring(2, 9);

router.post('/checkout', async (req, res) => {
  try {
    const { studentName, phone, cartItems } = req.body;
    const db = getDb();
    
    let generatedOrders = [];
    
    // Safely execute everything in a unified Cloud Firestore transaction
    await db.runTransaction(async (transaction) => {
      // 1. Fetch live inventory docs inside the transaction
      const inventoryRefs = {};
      const inventorySnaps = {};
      
      for (const cartItem of cartItems) {
        const ref = db.collection('inventory').doc(cartItem.id.toString());
        inventoryRefs[cartItem.id] = ref;
        inventorySnaps[cartItem.id] = await transaction.get(ref);
        
        if (!inventorySnaps[cartItem.id].exists) {
          throw new Error(`Item ID ${cartItem.id} no longer exists.`);
        }
      }
      
      // 2. Validate sufficient stock
      const groupedByCounter = {};
      
      for (const cartItem of cartItems) {
        const doc = inventorySnaps[cartItem.id].data();
        if (doc.qty < cartItem.qty || !doc.available) {
          throw new Error(`Not enough stock for ${doc.name}`);
        }
        
        // Prepare to group orders
        if (!groupedByCounter[doc.counter]) {
          groupedByCounter[doc.counter] = [];
        }
        groupedByCounter[doc.counter].push({
          ...doc,
          qty: cartItem.qty,
          totalLine: doc.price * cartItem.qty
        });
        
        // 3. Queue the deduction in the transaction
        const newQty = doc.qty - cartItem.qty;
        transaction.update(inventoryRefs[cartItem.id], {
          qty: newQty,
          available: newQty > 0
        });
      }
      
      // 4. Generate Order Documents
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      
      for (const [counterId, itemsArr] of Object.entries(groupedByCounter)) {
        const orderTotal = itemsArr.reduce((sum, i) => sum + i.totalLine, 0);
        const orderId = genId();
        const order = {
          id: orderId,
          code: genOrderCode(),
          userId: phone,
          studentName,
          counter: parseInt(counterId),
          items: itemsArr,
          total: orderTotal,
          status: 'preparing',
          time: timeStr,
          timestamp: now.getTime()
        };
        
        const orderRef = db.collection('orders').doc(orderId);
        transaction.set(orderRef, order);
        generatedOrders.push(order);
      }
    });
    
    // The transaction completed successfully!
    // Real-time updates for inventory/orders will automatically fire via db.js onSnapshot handlers.
    // We optionally manually push the event to connected sockets for legacy compatibility if needed:
    const io = getIo();
    if (io) {
      io.emit('orders_created', generatedOrders);
    }
    
    res.status(201).json({ status: 'SUCCESS', orders: generatedOrders });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
