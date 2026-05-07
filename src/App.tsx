import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Monitor,
  CheckCircle2,
  X,
  Lock,
  FileText,
  User
} from 'lucide-react';
import OrderForm from './components/OrderForm';
import { Order, AppSettings } from './types';
import { cn } from './lib/utils';
import { db, auth } from './lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';

import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState<'home' | 'order' | 'track' | 'admin'>('home');
  const [trackingId, setTrackingId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    emergencyNotice: "Welcome to Mridha Digital Studio. We are open daily from 8 AM to 11 PM.",
    showNotice: true,
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Initialize data
  useEffect(() => {
    // If firebase is disconnected or failed, we could load from localStorage
    // But for now let's try to fetch if we have db
    if (db) {
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders.sort((a, b) => b.createdAt - a.createdAt));
      });

      const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
        if (!snapshot.empty) {
          setSettings(snapshot.docs[0].data() as AppSettings);
        }
      });

      return () => {
        unsubOrders();
        unsubSettings();
      };
    } else {
      const saved = localStorage.getItem('mridha_orders');
      if (saved) setOrders(JSON.parse(saved));
    }
  }, []);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleCreateOrder = async (data: any) => {
    const newTrackingId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newOrder: Omit<Order, 'id'> = {
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      serviceType: data.serviceType,
      status: 'pending',
      trackingId: newTrackingId,
      documentUrl: data.documentBase64,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (db) {
      try {
        await addDoc(collection(db, 'orders'), newOrder);
        notify(`Order placed! Your ID is: ${newTrackingId}`);
        setView('home');
      } catch (e: any) {
        console.error(e);
        notify("Failed to place order. Using local mode.", "error");
        saveLocally(newOrder);
      }
    } else {
      saveLocally(newOrder);
    }
  };

  const saveLocally = (order: Omit<Order, 'id'>) => {
    const localOrders = [...orders, { ...order, id: Date.now().toString() }];
    setOrders(localOrders);
    localStorage.setItem('mridha_orders', JSON.stringify(localOrders));
    notify(`Order saved locally! ID: ${order.trackingId}`);
    setView('home');
  };

  const handleTrackOrder = () => {
    const order = orders.find(o => o.trackingId === trackingId.toUpperCase());
    if (order) {
      setFoundOrder(order);
    } else {
      notify("Tracking ID not found", "error");
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    if (db) {
      try {
        await updateDoc(doc(db, 'orders', id), { status, updatedAt: Date.now() });
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = orders.map(o => o.id === id ? { ...o, status, updatedAt: Date.now() } : o);
      setOrders(updated);
      localStorage.setItem('mridha_orders', JSON.stringify(updated));
    }
    notify("Status updated");
  };

  const openInMaps = () => {
    window.open("https://www.google.com/maps/search/?api=1&query=Mridha+Digital+Studio+Boroitola+Bazar+Shibpur+Narsingdi", "_blank");
  };

  const sendWhatsApp = (order: Order) => {
    const statusMsg = order.status === 'completed' ? 'ready for pickup' : order.status === 'working' ? 'currently being processed' : 'received';
    const message = `Hello ${order.customerName},\n\nThis is from Mridha Digital Studio. Your job with Tracking ID: ${order.trackingId} is ${statusMsg}.\n\nThank you for choosing us!`;
    window.open(`https://wa.me/88${order.phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAdminLogin = () => {
    // For demo/studio purposes, we use a simple check. In production with Firebase, use auth
    const correctPassword = settings.adminPassword || 'studio963';
    if (adminPassword === correctPassword) {
      setIsAdminLoggedIn(true);
      setAdminPassword('');
    } else {
      notify("Incorrect password", "error");
    }
  }

  const updateSettings = async (newSettings: AppSettings) => {
    if (db) {
      try {
        const settingsRef = collection(db, 'settings');
        const q = query(settingsRef);
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await updateDoc(doc(db, 'settings', snapshot.docs[0].id), { ...newSettings });
        } else {
          await addDoc(collection(db, 'settings'), newSettings);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setSettings(newSettings);
      localStorage.setItem('mridha_settings', JSON.stringify(newSettings));
    }
    notify("Settings saved");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setView('home')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">M</div>
            <span className="font-bold text-xl tracking-tight">Mridha Digital Studio</span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium">
            <button onClick={() => setView('home')} className={cn("hover:text-blue-500 transition-colors", view === 'home' && "text-blue-500")}>Home</button>
            <button onClick={() => setView('track')} className={cn("hover:text-blue-500 transition-colors", view === 'track' && "text-blue-500")}>Track Order</button>
            <button onClick={() => setView('order')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95">Place Order</button>
          </div>
          <button 
            onClick={() => setView(view === 'admin' ? 'home' : 'admin')}
            className={cn("p-2 transition-colors", view === 'admin' ? "text-blue-500" : "text-zinc-500 hover:text-white")}
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              {/* Emergency Notice */}
              {settings.showNotice && settings.emergencyNotice && (
                <div className="mb-12 bg-blue-600/10 border border-blue-600/30 rounded-2xl p-4 flex items-center gap-4">
                  <AlertTriangle className="text-blue-500 shrink-0" />
                  <p className="text-sm font-medium text-blue-200">{settings.emergencyNotice}</p>
                </div>
              )}

              {/* Hero Section */}
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                <div className="space-y-8 text-center lg:text-left">
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl lg:text-7xl font-bold leading-[1.1]"
                  >
                    Defining Digital <br /> Excellence.
                  </motion.h1>
                  <p className="text-xl text-zinc-400 max-w-lg mx-auto lg:mx-0">
                    High-quality photography, photocopy, and online application services 
                    in Shibpur, Narsingdi. Open daily 8 AM to 11 PM.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                    <button 
                      onClick={() => setView('order')}
                      className="group bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all text-lg shadow-xl shadow-white/5"
                    >
                      Place Order <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => setView('track')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-2xl font-bold transition-all text-lg border border-zinc-700/50"
                    >
                      Track Job
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-10 bg-blue-600/10 blur-[120px] rounded-full opacity-50" />
                  <div className="relative grid grid-cols-12 grid-rows-6 gap-4 h-[500px]">
                    {/* Main Studio Image */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="col-span-8 row-span-4 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/50"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1000" 
                        alt="Professional Studio" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>

                    {/* Camera Detail */}
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="col-span-4 row-span-3 rounded-[2rem] overflow-hidden shadow-xl border border-white/50"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600" 
                        alt="DSLR Camera" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>

                    {/* Printer / Production */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="col-span-5 row-span-2 rounded-[2rem] overflow-hidden shadow-xl border border-white/50"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=600" 
                        alt="Digital Printer" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>

                    {/* Badge Overlay */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="col-span-7 row-span-2 bg-zinc-800 rounded-[2rem] p-6 flex items-center justify-between shadow-2xl border border-zinc-700/50"
                    >
                      <div>
                        <p className="text-white font-bold text-xl">Premium Quality</p>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Narsingdi's Best</p>
                      </div>
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-24 transition-all">
                <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl transition-all h-full group">
                  <MapPin className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">Location</h3>
                  <p className="text-zinc-400 mb-4">Boroitola Bazar, Shibpur, Narsingdi.</p>
                  <button onClick={openInMaps} className="text-blue-500 font-medium hover:underline flex items-center gap-2">Find Us on Google Maps <ArrowRight className="w-4 h-4" /></button>
                </div>
                <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl transition-all h-full group">
                  <Clock className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">Business Hours</h3>
                  <p className="text-zinc-400">Daily: 8:00 AM - 11:00 PM</p>
                  <p className="text-zinc-500 text-sm mt-2">Available for late-night emergency services.</p>
                </div>
                <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl transition-all h-full group">
                  <Phone className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">Contact Us</h3>
                  <p className="text-zinc-400">Call: +8801909569963</p>
                  <p className="text-zinc-500 text-sm mt-2">Proprietor: Md. Nasir Uddin Mridha</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <OrderForm onSubmit={handleCreateOrder} />
            </motion.div>
          )}

          {view === 'track' && (
            <motion.div
              key="track"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6">Track Your Job</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="Enter Tracking ID (e.g. AB12CD)"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                    />
                    <button 
                      onClick={handleTrackOrder}
                      className="bg-blue-600 px-6 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 flex items-center justify-center p-3"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>

                  {foundOrder && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 pt-8 border-t border-zinc-800"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1 font-bold">Customer</p>
                          <h4 className="text-2xl font-bold">{foundOrder.customerName}</h4>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase",
                          foundOrder.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
                          foundOrder.status === 'working' && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                          foundOrder.status === 'completed' && "bg-green-500/10 text-green-500 border border-green-500/20",
                        )}>
                          {foundOrder.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                          <p className="text-zinc-500 mb-1 leading-none font-medium">Service</p>
                          <p className="font-bold text-lg">{foundOrder.serviceType}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                          <p className="text-zinc-500 mb-1 leading-none font-medium">Last Update</p>
                          <p className="font-bold text-lg">{new Date(foundOrder.updatedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {!isAdminLoggedIn ? (
                <div className="max-w-sm mx-auto bg-zinc-900 p-10 rounded-3xl border border-zinc-800 text-center shadow-2xl">
                  <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Admin Access</h2>
                  <p className="text-zinc-500 text-sm mb-8">Please enter the security password to manage the studio data.</p>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Security Token"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 mb-4 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <button 
                    onClick={handleAdminLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    Authenticate
                  </button>
                </div>
              ) : (
                <AdminDashboard 
                  orders={orders}
                  onUpdateStatus={updateOrderStatus}
                  onSendWhatsApp={sendWhatsApp}
                  onLogout={() => setIsAdminLoggedIn(false)}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border",
              showNotification.type === 'success' ? "bg-zinc-900/90 text-green-500 border-green-500/30" : "bg-zinc-900/90 text-red-500 border-red-500/30"
            )}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">{showNotification.message}</p>
            <button onClick={() => setShowNotification(null)} className="p-1 hover:bg-white/5 rounded-md transition-colors"><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-24 py-16 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-xs text-white">M</div>
              <span className="font-bold text-lg">Mridha Digital Studio</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Professional digital imaging and printing solutions. We provide high-end studio 
              services at an affordable price for the community of Shibpur.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-zinc-400">Quick Links</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><button onClick={() => setView('order')} className="hover:text-blue-500 transition-colors">Start New Job</button></li>
              <li><button onClick={() => setView('track')} className="hover:text-blue-500 transition-colors">Order Status</button></li>
              <li><button onClick={openInMaps} className="hover:text-blue-500 transition-colors">Studio Location</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-zinc-400">Support</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>Call: +8801909569963</li>
              <li>Whatsapp: Direct Link</li>
              <li>Proprietor: Nasir Uddin Mridha</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-zinc-400">Security</h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              All files uploaded are handled with professional confidentiality and are removed 
              from our daily processing queue once the job is completed.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-zinc-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-600 font-medium">
            © 2026 Mridha Digital Studio. All rights reserved.
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold text-zinc-700">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

