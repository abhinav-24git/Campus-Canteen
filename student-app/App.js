import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform, View } from 'react-native';
import { io } from 'socket.io-client';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ThemeProvider, useTheme } from './src/Theme';

const localBackend = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://10.0.2.2:8080';
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || localBackend;
const socket = io(backendUrl);

// ─── Web-only styles injected once ────────────────────────────────────────────
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Page reset — DO NOT set display:flex on html/body, that breaks RN root */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0a0b0a;
      overflow: hidden;
    }

    /* Expo mounts into #root — center it without stretching it */
    #root {
      width: 100%;
      height: 100%;
      background: #0a0b0a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── Phone shell cosmetics ── */
    #phone-shell {
      width: 390px;
      height: 844px;
      border-radius: 44px;
      overflow: hidden;
      border: 2px solid #2e322e;
      box-shadow:
        0 0 0 6px #181a18,
        0 0 0 9px #2e322e,
        0 32px 80px rgba(0,0,0,0.88),
        0 0 60px rgba(200,241,53,0.06);
      position: relative;
      background: #0e0f0e;
      flex-shrink: 0;
    }

    /* Dynamic island notch */
    #phone-shell::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 34px;
      background: #000;
      border-radius: 20px;
      z-index: 9999;
      pointer-events: none;
    }

    /* Side volume buttons */
    #phone-shell::after {
      content: '';
      position: absolute;
      right: -10px;
      top: 140px;
      width: 4px;
      height: 70px;
      background: #2e322e;
      border-radius: 2px;
      box-shadow: 0 90px 0 #2e322e;
      pointer-events: none;
    }

    /* Hide all scrollbars inside the phone frame — scrolling still works */
    #phone-shell *::-webkit-scrollbar { display: none; }
    #phone-shell * { scrollbar-width: none; -ms-overflow-style: none; }
  `;
  document.head.appendChild(style);

  // ── Auto-scale the phone shell to always fit the visible viewport ──────────
  function scalePhoneShell() {
    const shell = document.getElementById('phone-shell');
    if (!shell) return;

    const PHONE_W = 390;
    const PHONE_H = 844;
    const PAD = 24; // min padding around the phone (px, each side)

    const availW = window.innerWidth  - PAD * 2;
    const availH = window.innerHeight - PAD * 2;

    const scaleByW = availW / PHONE_W;
    const scaleByH = availH / PHONE_H;
    const scale    = Math.min(1, scaleByW, scaleByH); // never upscale

    // Apply scale — transform-origin: center so shell shrinks inward equally
    shell.style.transform       = `scale(${scale})`;
    shell.style.transformOrigin = 'center center';

    // CSS transform doesn't change the element's layout footprint.
    // Collapse the dead space so #root can center it properly.
    const dead = Math.round(PHONE_H * (1 - scale));
    shell.style.marginTop    = `-${dead / 2}px`;
    shell.style.marginBottom = `-${dead / 2}px`;

    const deadW = Math.round(PHONE_W * (1 - scale));
    shell.style.marginLeft  = `-${deadW / 2}px`;
    shell.style.marginRight = `-${deadW / 2}px`;
  }

  // Run once DOM is ready, then on every resize
  window.addEventListener('resize', scalePhoneShell);
  // Use rAF loop until the shell is mounted then stop
  function waitAndScale() {
    if (document.getElementById('phone-shell')) {
      scalePhoneShell();
    } else {
      requestAnimationFrame(waitAndScale);
    }
  }
  requestAnimationFrame(waitAndScale);
  // ────────────────────────────────────────────────────────────────────────────
}
// ──────────────────────────────────────────────────────────────────────────────

/**
 * PhoneFrame — on web, wraps children in a cosmetic phone shell div AND
 * an explicit RN View (390×844) so that all flex:1 children measure against
 * phone dimensions instead of the browser viewport.
 * On native it is a transparent passthrough.
 */
function PhoneFrame({ children, bg, phoneViewStyle }) {
  if (Platform.OS !== 'web') {
    return children;
  }
  return (
    <div id="phone-shell" style={{ background: bg }}>
      {/* This View is the TRUE layout root — flex:1 children measure against it */}
      <View style={phoneViewStyle}>
        {children}
      </View>
    </div>
  );
}

function MainApp() {
  const { Theme, isLight } = useTheme();
  const styles = getStyles(Theme);
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('Menu'); // Menu | Checkout
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    socket.on('state_sync', state => {
      setInventory(state.inventory);
      setOrders(state.orders);
    });
    socket.on('inventory_updated', inv => setInventory(inv));
    socket.emit('request_state');

    socket.on('orders_created', newOrders => {
      setOrders(prev => [...prev, ...newOrders]);
    });

    socket.on('order_updated', updatedOrder => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.off('state_sync');
      socket.off('inventory_updated');
      socket.off('orders_created');
      socket.off('order_updated');
    };
  }, []);

  const activeUserOrders = user
    ? orders.filter(o => o.userId === user.phone && o.status !== 'delivered')
    : [];

  const historyUserOrders = user
    ? orders.filter(o => o.userId === user.phone && o.status === 'delivered')
    : [];

  const appContent = !user ? (
    <View style={styles.fill}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} backgroundColor={Theme.bg} />
      <LoginScreen onLogin={(userObj) => setUser(userObj)} />
    </View>
  ) : (
    <View style={styles.fill}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} backgroundColor={Theme.bg} />
      {route === 'Menu' && (
        <MenuScreen
          inventory={inventory}
          cart={cart}
          setCart={setCart}
          activeOrders={activeUserOrders}
          user={user}
          onLogout={() => { setUser(null); setCart({}); }}
          onCheckout={() => setRoute('Checkout')}
          onHistory={() => setRoute('History')}
        />
      )}
      {route === 'Checkout' && (
        <CheckoutScreen
          cart={cart}
          inventory={inventory}
          user={user}
          onBack={() => setRoute('Menu')}
          onComplete={() => {
            setCart({});
            setRoute('Menu');
          }}
        />
      )}
      {route === 'History' && (
        <HistoryScreen 
          historyOrders={historyUserOrders}
          onBack={() => setRoute('Menu')}
        />
      )}
    </View>
  );

  return (
    <PhoneFrame bg={Theme.bg} phoneViewStyle={styles.phoneView}>
      {appContent}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const getStyles = (Theme) => StyleSheet.create({
  // 390×844 = iPhone 14 logical dimensions — this is the layout root on web
  phoneView: {
    width: 390,
    height: 844,
    backgroundColor: Theme.bg,
    //overflow: 'hidden',
  },
  // Used as the app root inside the phone view
  fill: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
});
