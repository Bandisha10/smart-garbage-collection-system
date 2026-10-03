"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Leaf, FileText, LineChart, Calendar, Scale, Users, Globe, Shield, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Breadcrumb from './shared/Breadcrumb';
import Footer from './shared/Footer';
import { usePanchayat } from '../context/PanchayatContext';
import api from '../api/axios';
import { useAppNavigate } from '../utils/navigation';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

/* ─── FALLBACK DEFAULTS (used when no published content exists yet) ─── */
const DEFAULT_STATS = [
    { icon: Users,  value: '2,500+', label: 'Households Served' },
    { icon: Globe,  value: '5',      label: 'Active Wards' },
    { icon: Award,  value: '92%',    label: 'Satisfaction Rate' },
    { icon: Shield, value: '100%',   label: 'Government Backed' },
];

const DEFAULT_ACCORDION = [
    { id: 'mission',    title: 'Our Mission',          content: 'Our mission is to create a cleaner, zero-waste community by providing every household with a simple, transparent, and efficient system for waste segregation and collection. Together, we aim to protect the environment and reduce landfill waste.', list: [] },
    { id: 'objectives', title: 'Key Objectives',        content: '', list: ['Achieve 100% household registration.', 'Maintain segregation compliance above 95%.', 'Use technology for efficient monitoring.', 'Promote recycling and composting.'] },
    { id: 'works',      title: 'How the Program Works', content: 'The program follows four steps: Segregation, Collection, Processing, and Reporting. Color-coded bins ensure proper waste separation, and transparent reporting keeps citizens informed.', list: [], action: { label: 'View Detailed Guide', view: 'howItWorks' } },
    { id: 'legal',      title: 'Legal & Compliance',    content: 'EcoSyz operates under Municipal Waste Management Bylaws, ensuring full compliance with national environmental regulations.', list: [] },
];

const DEFAULT_PRINCIPLES = [
    { emoji: '🌿', title: 'Sustainability',  desc: 'Every decision is made with the future of our planet in mind.' },
    { emoji: '🤝', title: 'Community First', desc: 'We exist to serve households and keep communities clean.' },
    { emoji: '📊', title: 'Transparency',   desc: 'Open reporting and clear data for every citizen.' },
    { emoji: '⚡', title: 'Efficiency',     desc: 'Smart systems to minimize waste and maximize output.' },
    { emoji: '♻️', title: 'Circularity',    desc: 'Turning waste into resources through segregation and recycling.' },
    { emoji: '🔒', title: 'Accountability', desc: 'Every pickup, every worker, every complaint — tracked.' },
];

/* Map stat label → icon (for rendering fetched stats that have no icon object) */
const STAT_ICON_MAP = {
    'Households Served': Users,
    'Active Wards':      Globe,
    'Satisfaction Rate': Award,
    'Government Backed': Shield,
    'Waste Collected':   FileText,
    'Total Complaints':  Scale,
    'Panchayats':        Globe,
};
const defaultStatIcon = (label) => STAT_ICON_MAP[label] || Award;

const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
};

const AboutPage = ({ navigate: propNavigate }) => {
    const appNavigate = useAppNavigate();
    const navigate = propNavigate || appNavigate;
    const { selectedPanchayat } = usePanchayat();
    const [expanded, setExpanded]       = useState('mission');
    const [loading,  setLoading]        = useState(true);

    // Dynamic content (populated from API)
    const [bannerImage,    setBannerImage]    = useState(null);
    const [bodyContent,    setBodyContent]    = useState('');
    const [stats,          setStats]          = useState(DEFAULT_STATS);
    const [cards,          setCards]          = useState([]);
    const [accordionItems, setAccordionItems] = useState(DEFAULT_ACCORDION);
    const [principles,     setPrinciples]     = useState(DEFAULT_PRINCIPLES);
    const [ctaHeading,     setCtaHeading]     = useState('Ready to Join the Movement?');
    const [ctaSubtext,     setCtaSubtext]     = useState('Log in today and be part of a cleaner, greener future.');

    useEffect(() => {
        const fetchContent = async () => {
            if (!selectedPanchayat?._id) { setLoading(false); return; }
            try {
                const res = await api.get(`/content/public/${selectedPanchayat._id}?type=about-us`);
                const d = res.data;
                if (!d) return;

                // Banner
                const banner = d.media?.find(m => m.caption === 'Banner');
                if (banner?.url) setBannerImage(banner.url);

                // Body
                if (d.body) setBodyContent(d.body);

                // Stats
                if (d.stats?.length) {
                    setStats(d.stats.map(s => ({ ...s, icon: defaultStatIcon(s.label) })));
                }

                // Infographic cards
                if (d.cards?.length) setCards(d.cards);

                // Accordion
                if (d.accordionItems?.length) setAccordionItems(d.accordionItems);

                // Principles
                if (d.principles?.length) setPrinciples(d.principles);

                // CTA
                if (d.ctaHeading) setCtaHeading(d.ctaHeading);
                if (d.ctaSubtext) setCtaSubtext(d.ctaSubtext);

            } catch (err) {
                // Not published yet — silently fall back to defaults
                console.info('No published About Us content found, using defaults.');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [selectedPanchayat]);

    const actions = [
        { icon: FileText, title: 'File a Complaint',    label: 'Lodge Issue', view: 'complaint',         color: 'bg-red-50 border-red-200 text-red-600' },
        { icon: LineChart, title: 'View Statistics',    label: 'See Reports', view: 'statisticsReports', color: 'bg-blue-50 border-blue-200 text-blue-600' },
        { icon: Calendar, title: 'Collection Schedule', label: 'View Dates',  view: 'viewSchedule',      color: 'bg-purple-50 border-purple-200 text-purple-600' },
    ];

    /* ── Skeleton for loading state ── */
    if (loading) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
                <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-pulse">
                    <div className="h-8 w-32 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                    </div>
                    <div className="h-48 bg-gray-200 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-5xl mx-auto px-4 py-10">
                <Breadcrumb path={[{ label: 'About', view: null }]} navigate={navigate} />

                {/* ── BANNER IMAGE ── */}
                {bannerImage && (
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8 rounded-2xl overflow-hidden shadow-md">
                        <img src={getImageUrl(bannerImage)} alt="About Us Banner" className="w-full h-56 object-cover" />
                    </motion.div>
                )}

                {/* ── HEADER ── */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center my-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Leaf className="w-7 h-7 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-3">
                        About <span className="gradient-text">EcoSyz</span>
                    </h1>
                    {bodyContent ? (
                        <div className="text-gray-500 max-w-xl mx-auto leading-relaxed prose prose-sm text-left">
                            <ReactMarkdown>{bodyContent}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
                            A government-led initiative focused on cleanliness, sustainability, and responsible waste management — making every Panchayat cleaner, one pickup at a time.
                        </p>
                    )}
                </motion.div>

                {/* ── STATS BANNER ── */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {stats.map(({ icon: Icon, value, label }, i) => (
                        <div key={i} className="card p-5 text-center">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                {Icon ? <Icon className="w-5 h-5 text-green-600" /> : <Award className="w-5 h-5 text-green-600" />}
                            </div>
                            <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* ── INFOGRAPHIC CARDS ── */}
                {cards.length > 0 && (
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
                        className="grid sm:grid-cols-3 gap-4 mb-12">
                        {cards.map((card, i) => (
                            <div key={i} className="card p-6 text-center space-y-2">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto text-lg font-bold text-green-700">
                                    {card.icon}
                                </div>
                                <h3 className="font-display font-bold text-gray-900 text-sm">{card.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{card.content}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── ACCORDION ── */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="card overflow-hidden mb-12">
                    {accordionItems.map(({ id, title, content, list, action }) => (
                        <div key={id} className="border-b border-gray-100 last:border-0">
                            <button
                                onClick={() => setExpanded(expanded === id ? null : id)}
                                className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-gray-50 transition-colors group">
                                <span className={`font-semibold transition-colors ${expanded === id ? 'text-green-700' : 'text-gray-800 group-hover:text-green-600'}`}>
                                    {title}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded === id ? 'rotate-180 text-green-500' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {expanded === id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.28 }}
                                        className="overflow-hidden">
                                        <div className="px-7 pb-6 text-gray-600 text-sm leading-relaxed bg-green-50/20">
                                            {content && <p>{content}</p>}
                                            {list?.length > 0 && (
                                                <ul className="space-y-2 mt-2">
                                                    {list.map((l, li) => (
                                                        <li key={li} className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                                            {l}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {action && (
                                                <button onClick={() => navigate(action.view)} className="btn-outline text-sm mt-4 px-5 py-2">
                                                    {action.label}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </motion.div>

                {/* ── GUIDING PRINCIPLES ── */}
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-12">
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 text-center">Our Guiding Principles</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {principles.map(({ emoji, title, desc }, i) => (
                            <motion.div key={title || i} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                                className="card p-5 hover:border-green-200 hover:shadow-md transition-all">
                                <div className="text-2xl mb-3">{emoji}</div>
                                <h3 className="font-display font-bold text-gray-900 mb-1 text-sm">{title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── QUICK ACTIONS ── */}
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="grid sm:grid-cols-3 gap-5 mb-12">
                    {actions.map(({ icon: Icon, title, label, view, color }) => (
                        <div key={view} className={`card p-6 text-center border ${color}`} style={{ background: 'var(--surface-1)' }}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <p className="font-semibold text-gray-800 mb-3 text-sm">{title}</p>
                            <button onClick={() => navigate(view)} className="btn-primary text-xs px-4 py-2">{label}</button>
                        </div>
                    ))}
                </motion.div>

                {/* ── CTA ── */}
                <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="card-premium p-12 text-center">
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">{ctaHeading}</h2>
                    <p className="text-gray-500 mb-6">{ctaSubtext}</p>
                    <button onClick={() => navigate('login-household')} className="btn-primary px-8 py-3">
                        Login Now
                    </button>
                </motion.div>

            </div>
            <Footer navigate={navigate} />
        </div>
    );
};

export default AboutPage;
