const admin = require('firebase-admin');
const path = require('path');

let db;

const initializeApp = () => {
  try {
    let serviceAccount;
    // For Production (Render/Railway, etc) we parse an Environment Variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // For Local Development we fallback to reading the json file
      serviceAccount = require('../../firebase-service-account.json');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin connected correctly.');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase:', err.message);
    if (err.message.includes("Cannot find module")) {
        console.error('Make sure firebase-service-account.json is placed in the backend folder or FIREBASE_SERVICE_ACCOUNT is set in your environment variables.');
    }
  }
};

const getDb = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

module.exports = { initializeApp, getDb };
