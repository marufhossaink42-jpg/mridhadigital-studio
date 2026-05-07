import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  History as HistoryIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  User,
  Hash,
  ChevronDown,
  Settings as SettingsIcon,
  Megaphone,
  Lock
} from 'lucide-react';
import { Order, OrderStatus, AppSettings } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onSendWhatsApp: (order: Order) => void;
  onLogout: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
}

export default function AdminDashboard({ 
  orders, 
  onUpdateStatus, 
  onSendWhatsApp, 
  onLogout,
  settings,
  onUpdateSettings
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState(settings.emergencyNotice || '');
  const [isNoticeVisible, setIsNoticeVisible] = useState(settings.showNotice);
  const [newPassword, setNewPassword] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phoneNumber.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    working: orders.filter(o => o.status === 'working').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const handleUpdateNotice = async () => {
    await onUpdateSettings({
      ...settings,
      emergencyNotice,
      showNotice: isNoticeVisible,
      adminPassword: newPassword || settings.adminPassword
    });
    setNewPassword('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-blue-500" />
            Admin Panel
          </h2>
          <p className="text-zinc-500 mt-1">Control your studio and track orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'orders' ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              Order History
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'settings' ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              Store settings
            </button>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm border border-zinc-800 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: stats.total, color: 'text-white' },
              { label: 'Pending', value: stats.pending, color: 'text-yellow-500', icon: Clock },
              { label: 'Working', value: stats.working, color: 'text-blue-500', icon: Briefcase },
              { label: 'Completed', value: stats.completed, color: 'text-green-500', icon: CheckCircle2 },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <div className="flex justify-between items-start">
                  <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
                  {stat.icon && <stat.icon className={cn("w-4 h-4", stat.color)} />}
                </div>
                <p className={cn("text-3xl font-bold mt-2 font-mono", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search database..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-3 text-zinc-300 hover:bg-zinc-800 transition-colors w-full md:w-auto"
              >
                <Filter className="w-4 h-4" />
                <span className="capitalize">{statusFilter === 'all' ? 'All Status' : statusFilter}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {['all', 'pending', 'working', 'completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status as any);
                          setIsFilterOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors capitalize text-sm border-b border-zinc-800 last:border-0"
                      >
                        {status}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto shadow-xl">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /> Customer</div>
                  </th>
                  <th className="px-8 py-5">
                    <div className="flex items-center gap-2"><Hash className="w-4 h-4" /> Tracking ID</div>
                  </th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Service</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-4">
                        <Search className="w-12 h-12 opacity-20" />
                        <p>No orders found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-bold text-white mb-0.5">{order.customerName}</p>
                        <p className="text-sm text-zinc-500 font-mono italic">{order.phoneNumber}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-mono text-blue-500 bg-blue-500/5 px-2 py-1 rounded-md border border-blue-500/10">
                          {order.trackingId}
                        </span>
                        <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <select 
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
                          className={cn(
                            "text-[10px] font-black uppercase rounded-full px-3 py-1 bg-transparent border transition-all cursor-pointer",
                            order.status === 'pending' && "text-yellow-500 border-yellow-500/20 bg-yellow-500/5",
                            order.status === 'working' && "text-blue-500 border-blue-500/20 bg-blue-500/5",
                            order.status === 'completed' && "text-green-500 border-green-500/20 bg-green-500/5",
                          )}
                        >
                          <option value="pending" className="bg-zinc-900">Pending</option>
                          <option value="working" className="bg-zinc-900">Working</option>
                          <option value="completed" className="bg-zinc-900">Completed</option>
                        </select>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm text-zinc-400">{order.serviceType}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          {order.documentUrl && (
                            <a 
                              href={order.documentUrl} 
                              download={`MridhaStudio_${order.trackingId}`}
                              className="p-2.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all"
                              title="Download Document"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          )}
                          <button 
                            onClick={() => onSendWhatsApp(order)}
                            className="p-2.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl transition-all"
                            title="WhatsApp Status"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Store Settings</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> Emergency Notice Text
              </label>
              <textarea
                value={emergencyNotice}
                onChange={(e) => setEmergencyNotice(e.target.value)}
                placeholder="Broadcast a message..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Change Admin Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
              <div>
                <p className="text-white font-medium">Show Notice</p>
                <p className="text-zinc-500 text-sm">Visible to customers on home page.</p>
              </div>
              <button
                onClick={() => setIsNoticeVisible(!isNoticeVisible)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  isNoticeVisible ? "bg-blue-600" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  isNoticeVisible ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <button
              onClick={handleUpdateNotice}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-500/10"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
