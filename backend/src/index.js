const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { setIo, getState } = require('./db');
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
  socket.on('update_inventory', (newInventory) => {
    getState().inventory = newInventory;
    io.emit('inventory_updated', newInventory);
  });

  socket.on('add_item', (item) => {
    const db = getState();
    const newId = Math.max(0, ...db.inventory.map(i => i.id)) + 1;
    const newItem = { ...item, id: newId };
    db.inventory.push(newItem);
    io.emit('inventory_updated', db.inventory);
  });

  socket.on('delete_item', (id) => {
    const db = getState();
    db.inventory = db.inventory.filter(i => i.id !== id);
    io.emit('inventory_updated', db.inventory);
  });

  socket.on('update_order_status', ({ orderId, status, deliveredAt }) => {
    const order = getState().orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (deliveredAt) order.deliveredAt = deliveredAt;
      io.emit('order_updated', order);
    }
  });
});

app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);

// Basic ping route
app.get('/', (req, res) => res.json({ status: 'Platform Active' }));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Antigravity live socket backend listening on port ${PORT}`));
