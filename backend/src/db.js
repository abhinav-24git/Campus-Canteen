const { initializeApp, getDb } = require('./firebase/config');

// Initialize Firebase App
initializeApp();

const state = {
  inventory: [],
  orders: [], 
};

let ioInstance = null;
let isInitialized = false;

function setIo(io) {
  ioInstance = io;
  if (!isInitialized) {
    setupRealtimeListeners();
    isInitialized = true;
  }
}

function getIo() {
  return ioInstance;
}

function getState() {
  return state;
}

function setupRealtimeListeners() {
  const db = getDb();
  
  seedInitialDataIfEmpty(db);
  scheduleDataCleanup(db);
  
  db.collection('inventory').onSnapshot((snapshot) => {
    state.inventory = snapshot.docs.map(doc => ({ id: Number(doc.id), ...doc.data() }));
    if (ioInstance) {
      ioInstance.emit('inventory_updated', state.inventory);
    }
  });

  db.collection('orders').onSnapshot((snapshot) => {
    state.orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (ioInstance) {
      // Broadcast full state dynamically when orders mutate (useful for reconnection)
      // ioInstance.emit('order_updated', specificOrder) usually handles specific tickets
    }
  });
}

async function seedInitialDataIfEmpty(db) {
  try {
    const invSnap = await db.collection('inventory').limit(1).get();
    if (invSnap.empty) {
      console.log('Seeding initial inventory to Firestore...');
      const initialInventory = [
        { id: 1, name: 'Paneer Chapati', counter: 1, price: 35, qty: 50, available: true },
        { id: 2, name: 'Samosa', counter: 2, price: 10, qty: 80, available: true },
        { id: 3, name: 'Pattice', counter: 2, price: 15, qty: 60, available: true },
        { id: 4, name: 'Vada Pav', counter: 2, price: 12, qty: 0, available: false },
        { id: 5, name: 'Shabudana Khichdi', counter: 3, price: 30, qty: 40, available: true },
        { id: 6, name: 'Dal Khichadi', counter: 3, price: 40, qty: 25, available: true },
      ];
      for (const item of initialInventory) {
        await db.collection('inventory').doc(item.id.toString()).set(item);
      }
      console.log('Initial inventory seeded.');
    }
  } catch (e) {
    console.error('Error seeding data:', e.message);
  }
}

async function scheduleDataCleanup(db) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  const cleanup = async () => {
    try {
      const cutoff = Date.now() - (30 * ONE_DAY_MS);
      const snapshot = await db.collection('orders').where('timestamp', '<', cutoff).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`[Cron] Cleaned up ${snapshot.size} expired historical orders.`);
      }
    } catch (e) {
      console.error('[Cron] Cleanup error:', e.message);
    }
  };

  // Run once on startup, then every 24 hours
  cleanup();
  setInterval(cleanup, ONE_DAY_MS);
}

module.exports = { state, setIo, getIo, getState };
