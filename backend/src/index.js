const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { setIo, getState } = require('./db');
const { getDb } = require('./firebase/config');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
setIo(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Send current state upon connection
  socket.emit('state_sync', getState());

  socket.on('request_state', () => {
    socket.emit('state_sync', getState());
  });

  // Handle admin updates
  socket.on('update_inventory', async (newInventory) => {
    const db = getDb();
    const batch = db.batch();
    newInventory.forEach(item => {
      const docRef = db.collection('inventory').doc(item.id.toString());
      batch.set(docRef, item);
    });
    await batch.commit();
    // onSnapshot in db.js handles emitting
  });

  socket.on('add_item', async (item) => {
    const db = getDb();
    const currentState = getState();
    const newId = Math.max(0, ...currentState.inventory.map(i => i.id)) + 1;
    const newItem = { ...item, id: newId };
    await db.collection('inventory').doc(newId.toString()).set(newItem);
  });

  socket.on('delete_item', async (id) => {
    const db = getDb();
    await db.collection('inventory').doc(id.toString()).delete();
  });

  socket.on('update_order_status', async ({ orderId, status, deliveredAt }) => {
    const db = getDb();
    const updateData = { status };
    if (deliveredAt) updateData.deliveredAt = deliveredAt;
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    // Fallback broadcast since we aren't sending specific order_updated in onSnapshot
    // We fetch the updated state here just to emit the single update event locally to matching clients
    const order = getState().orders.find(o => o.id === orderId);
    if (order) {
      io.emit('order_updated', { ...order, ...updateData });
    }
  });
});

app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);

// Basic ping route
app.get('/', (req, res) => res.json({ status: 'Platform Active' }));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Antigravity live socket backend listening on port ${PORT}`));
