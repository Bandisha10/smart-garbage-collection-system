"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Truck, Clock, AlertCircle, Plus, LogOut,
    TrendingUp, CheckCircle2, LayoutDashboard, ChevronRight,
    Leaf, Recycle, MapPin, Bell, ArrowUpRight, FileText, Wallet
} from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';
import api from '../../api/axios';
import LogoutConfirmModal from '../shared/LogoutConfirmModal';
import { useAppNavigate } from '../../utils/navigation';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.42, ease: 'easeOut' } })
};

const statusBadge = (status) => {
    const map = {
        Confirmed:    'badge badge-green',
        Pending:      'badge badge-yellow',
        Resolved:     'badge badge-green',
        'In Progress':'badge badge-blue',
        Received:     'badge badge-yellow',
        Rejected:     'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100',
    };
    return map[status] || 'badge badge-yellow';
};

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
    <motion.div
        custom={delay}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="card p-5 relative overflow-hidden group hover:shadow-lg transition-shadow"
    >
        {/* Soft blob */}
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${gradient}`} />
        <div className="flex items-start justify-between relative">
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-display font-extrabold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${gradient}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    </motion.div>
);

/* ─── Quick Action ─── */
const QuickAction = ({ label, icon: Icon, bg, iconColor, onClick, delay }) => (
    <motion.button
        custom={delay}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`w-full flex flex-col items-center gap-2.5 p-4 rounded-2xl border ${bg} transition-all text-center`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
    </motion.button>
);

const HouseholdDashboard = ({ navigate: propNavigate }) => {
    const appNavigate = useAppNavigate();
    const navigate = propNavigate || appNavigate;
    const { selectedPanchayat, refreshPanchayatData } = usePanchayat();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                setUser(null);
            }
        }
    }, []);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const [dashboardData, setDashboardData] = useState({
        totalPickups: 0,
        thisMonthPickups: 0,
        openComplaints: 0,
        ecoScore: 100,
        upcomingPickups: [],
        householdData: { compliance: "Compliant" },
    });

    useEffect(() => {
        if (!user) return;
        
        // Refresh panchayat status (feature toggles etc.)
        refreshPanchayatData();

        // Fetch Complaints (for recent complaints list)
        api.get('/complaints/me')
            .then(r => setComplaints(r.data))
            .catch(() => {});
            
        // Fetch Dashboard aggregations
        api.get('/households/dashboard')
            .then(res => {
                setDashboardData(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch dashboard data:", err);
            })
            .finally(() => setLoading(false));
    }, [user]);

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('home');
    };

    const schedules = dashboardData.upcomingPickups;
    const openComplaints = dashboardData.openComplaints;

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── HEADER ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-green-200 flex-shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Leaf className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Household Dashboard</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                                Hello, {user?.name?.split(' ')[0] || 'there'}! 👋
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {selectedPanchayat?.name || 'Manage your waste efficiently'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowLogoutModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── STAT CARDS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard delay={0} icon={Truck}        label="Total Pickups"    value={dashboardData.totalPickups}    sub="All time"         gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                    <StatCard delay={1} icon={Calendar}     label="This Month"       value={dashboardData.thisMonthPickups}     sub="Scheduled"        gradient="bg-gradient-to-br from-green-500 to-emerald-500" />
                    <StatCard delay={2} icon={AlertCircle}  label="Open Feedback"    value={openComplaints}  sub="Awaiting resolution" gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard delay={3} icon={Recycle}      label="Compliance"       value={`${dashboardData.ecoScore}%`}   sub="Segregation score" gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
                </div>

                {/* ── QUICK ACTIONS ── */}
                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-display font-bold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className={`grid ${selectedPanchayat?.isScheduleEnabled !== false ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                        {selectedPanchayat?.isScheduleEnabled !== false && (
                            <QuickAction delay={5} label="Schedule Pickup"    icon={Calendar}   bg="bg-blue-50/60 border-blue-100 hover:border-blue-300"    iconColor="bg-blue-100 text-blue-600"    onClick={() => navigate('schedule-booking')} />
                        )}
                        <QuickAction delay={6} label="Submit Feedback"   icon={AlertCircle} bg="bg-red-50/60 border-red-100 hover:border-red-300"       iconColor="bg-red-100 text-red-500"      onClick={() => navigate('complaint')} />
                    </div>
                </motion.div>

                {/* ── MAIN GRID ── */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">

                    {/* Upcoming Pickups */}
                    <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible" className="lg:col-span-2 card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-display font-bold text-gray-900">Upcoming Pickups</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{schedules.length} scheduled</p>
                            </div>
                            {selectedPanchayat?.isScheduleEnabled !== false && (
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('schedule-booking')}
                                    className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" /> New Pickup
                                </motion.button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {schedules.map((s, i) => (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center flex-shrink-0">
                                            <Truck className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{s.date}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-400">{s.time}</span>
                                                <span className="text-xs text-gray-300">·</span>
                                                <Leaf className="w-3 h-3 text-green-400" />
                                                <span className="text-xs text-gray-500">{s.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={statusBadge(s.status)}>{s.status}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" />
                                    </div>
                                </motion.div>
                            ))}
                            {schedules.length === 0 && (
                                <div className="text-center py-10">
                                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No upcoming pickups scheduled.</p>
                                    <button onClick={() => navigate('schedule-booking')} className="mt-3 text-sm text-green-600 font-medium hover:underline">
                                        Schedule one now →
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Eco Score / Info panel */}
                    <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible" className="card p-6 flex flex-col">
                        <h2 className="text-base font-display font-bold text-gray-900 mb-4">Your Eco Score</h2>

                        {/* Big Eco Score Ring */}
                        <div className="flex flex-col items-center py-4 mb-4">
                            <div className="relative w-28 h-28">
                                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f0fdf4" strokeWidth="12" />
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#eco-grad)" strokeWidth="12"
                                        strokeDasharray="314" strokeDashoffset={314 * 0.08} strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="eco-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#22c55e" />
                                            <stop offset="100%" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-display font-extrabold text-gray-900">92</span>
                                    <span className="text-xs text-gray-400 font-medium">/100</span>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-green-600 mt-2">Excellent!</p>
                            <p className="text-xs text-gray-400 text-center mt-1">Your household segregation is above average</p>
                        </div>

                        <div className="space-y-2 mt-auto">
                            {[
                                { label: 'Pickup Compliance', val: '100%', color: 'bg-green-500' },
                                { label: 'Waste Segregation', val: '92%', color: 'bg-emerald-500' },
                                { label: 'Timely Disposal', val: '85%', color: 'bg-blue-500' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="font-semibold text-gray-700">{item.val}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.val }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── RECENT FEEDBACK ── */}
                <motion.div variants={fadeUp} custom={7} initial="hidden" animate="visible" className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-display font-bold text-gray-900">Recent Feedback</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{complaints.length} total · {openComplaints} open</p>
                        </div>
                        <button
                            onClick={() => navigate('complaint')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Feedback
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No feedback submitted yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {complaints.slice(0, 5).map((c, i) => (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-100 hover:bg-green-50/30 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {c.photo ? (
                                                <img 
                                                    src={c.photo?.startsWith('http') ? c.photo : `${(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '')}/${c.photo.replace(/^\//, '')}`} 
                                                    alt="Feedback" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'; }}
                                                />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{c.type}</p>
                                            <p className="text-xs text-gray-400 font-mono">{c.complaintId} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <span className={statusBadge(c.status)}>{c.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </div>
    );
};

export default HouseholdDashboard;
