const state = {
  inventory: [
    { id: 1, name: 'Paneer Chapati', counter: 1, price: 35, qty: 50, available: true },
    { id: 2, name: 'Samosa', counter: 2, price: 10, qty: 80, available: true },
    { id: 3, name: 'Pattice', counter: 2, price: 15, qty: 60, available: true },
    { id: 4, name: 'Vada Pav', counter: 2, price: 12, qty: 0, available: false },
    { id: 5, name: 'Shabudana Khichdi', counter: 3, price: 30, qty: 40, available: true },
    { id: 6, name: 'Dal Khichadi', counter: 3, price: 40, qty: 25, available: true },
  ],
  orders: [], // Array of sub-orders grouped by counter
};

let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function getState() {
  return state;
}

module.exports = { state, setIo, getIo, getState };
