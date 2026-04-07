const admin = require('firebase-admin');

const initializeApp = () => {
  // In a real environment, this utilizes GOOGLE_APPLICATION_CREDENTIALS
  // For scaffolding without keys, we mock the admin initialization
  console.log('Firebase Admin mock initialized');
};

const getDb = () => {
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({ exists: true, data: () => ({ quantity: 10, price: 45 }) }),
        set: async (data, merge) => console.log(`Mock set ${name}/${id}`, data),
        update: async (data) => console.log(`Mock update ${name}/${id}`, data),
      })
    }),
    runTransaction: async (cb) => {
      console.log('Mock transaction executed');
      return cb({
        get: async () => ({ exists: true, data: () => ({ quantity: 10, price: 45 }) }),
        update: () => {},
        set: () => {}
      });
    }
  };
};

module.exports = { initializeApp, getDb };
