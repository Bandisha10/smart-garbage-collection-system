"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, ExternalLink, FileText, Video, ChevronRight, Play } from 'lucide-react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Breadcrumb from './shared/Breadcrumb';
import Footer from './shared/Footer';
import { usePanchayat } from '../context/PanchayatContext';
import api from '../api/axios';
import { useAppNavigate } from '../utils/navigation';

/* ─── HARDCODED DEFAULTS ─── */
const DEFAULT_GUIDES = [
    { icon: '🗑️', title: 'Waste Segregation Guide',     description: 'Learn how to properly separate dry, wet, and hazardous waste for efficient collection and recycling.', type: 'PDF Guide',   color: 'bg-amber-50 border-amber-200',  iconColor: 'bg-amber-100 text-amber-600',  tag: 'badge-yellow', steps: ['Use Green bin for organic/wet waste', 'Use Blue bin for dry/recyclable waste', 'Use Red bin for hazardous items', 'Never mix sanitary waste with recyclables'] },
    { icon: '🌿', title: 'Home Composting Basics',       description: 'Turn your kitchen and garden waste into rich compost. A step-by-step guide for households.',           type: 'Video Guide', color: 'bg-green-50 border-green-200',  iconColor: 'bg-green-100 text-green-600',  tag: 'badge-green',  steps: ['Start with a compost bin or pit', 'Add kitchen scraps and dry leaves alternately', 'Turn the pile every 2 weeks', 'Ready compost in 4–6 weeks'] },
    { icon: '📋', title: 'How to Submit Feedback',      description: 'A quick guide on using the EcoSyz feedback system to report missed collections or civic issues.',       type: 'Article',     color: 'bg-blue-50 border-blue-200',    iconColor: 'bg-blue-100 text-blue-600',    tag: 'badge-blue',   steps: ['Login with your mobile number', 'Go to Dashboard → Submit Feedback', 'Choose a feedback type and describe the issue', 'Track status from your dashboard'] },
    { icon: '♻️', title: 'Recyclable Materials List',    description: 'Know what can and cannot be recycled. This helps ensure cleaner segregation and better recovery rates.',  type: 'PDF Guide',   color: 'bg-purple-50 border-purple-200', iconColor: 'bg-purple-100 text-purple-600', tag: 'badge-blue',   steps: ['Paper, cardboard, newspapers — YES', 'Glass bottles and jars — YES', 'Plastic bags and film — NO', 'Styrofoam / thermocol — NO'] },
    { icon: '🏠', title: 'Household Registration Guide', description: 'New to EcoSyz? Follow these steps to get your household registered under your Panchayat.',              type: 'Article',     color: 'bg-rose-50 border-rose-200',    iconColor: 'bg-rose-100 text-rose-600',    tag: 'badge-red',    steps: ['Contact your Panchayat incharge', 'Provide your address and mobile number', 'You will receive an OTP to activate your account', 'Login via EcoSyz and select your Panchayat'] },
];

const getUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
};

const typeIcon = (type) => {
    if (type === 'PDF Guide')   return <FileText className="w-3.5 h-3.5" />;
    if (type === 'Video Guide') return <Video    className="w-3.5 h-3.5" />;
    return <BookOpen className="w-3.5 h-3.5" />;
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
};

const GuidesResourcesPage = ({ navigate: propNavigate }) => {
    const appNavigate = useAppNavigate();
    const navigate = propNavigate || appNavigate;
    const { selectedPanchayat } = usePanchayat();
    const [loading,       setLoading]       = useState(true);
    const [guides,        setGuides]        = useState(DEFAULT_GUIDES);
    const [bodyContent,   setBodyContent]   = useState('');
    const [tutorialVideo, setTutorialVideo] = useState(null);
    const [pdfFile,       setPdfFile]       = useState(null);
    const [showBody,      setShowBody]      = useState(false); // toggle guide detail panel

    useEffect(() => {
        const fetchContent = async () => {
            if (!selectedPanchayat?._id) { setLoading(false); return; }
            try {
                const res = await api.get(`/content/public/${selectedPanchayat._id}?type=segregation-guide`);
                const d = res.data;
                if (!d) return;
                if (d.guides?.length)  setGuides(d.guides);
                if (d.body)            setBodyContent(d.body);
                if (d.media) {
                    const vid = d.media.find(m => m.type === 'video');
                    if (vid) setTutorialVideo(vid.url);
                    const pdf = d.media.find(m => m.caption === 'PDF Guide');
                    if (pdf) setPdfFile(pdf.url);
                }
            } catch {
                console.info('No published segregation guide content, using defaults.');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [selectedPanchayat]);

    if (loading) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
                <div className="max-w-5xl mx-auto px-4 py-10 space-y-5 animate-pulse">
                    <div className="h-8 w-40 bg-gray-200 rounded" />
                    {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
                </div>
            </div>
        );
    }

    const hasRichContent = bodyContent || tutorialVideo || pdfFile;

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-5xl mx-auto px-4 py-10">
                <Breadcrumb path={[{ label: 'Guides & Resources', view: null }]} navigate={navigate} />

                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-7 h-7 text-amber-600" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Guides &amp; <span className="gradient-text">Resources</span>
                    </h1>
                    <p className="text-gray-500">Everything you need to manage waste the right way.</p>
                </motion.div>

                {/* ── FEATURED SEGREGATION GUIDE (video + body + pdf) ── */}
                {hasRichContent && (
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                        className="card border border-amber-200 bg-amber-50 overflow-hidden mb-8">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">📋</span>
                                <div>
                                    <h2 className="font-display font-bold text-gray-900">Segregation Guide</h2>
                                    <p className="text-xs text-amber-600 font-medium">Published by your Panchayat</p>
                                </div>
                            </div>

                            {/* Tutorial Video */}
                            {tutorialVideo && (
                                <div className="mb-4 rounded-xl overflow-hidden">
                                    <video controls className="w-full max-h-64 bg-black rounded-xl" src={getUrl(tutorialVideo)}>
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}

                            {/* Body markdown */}
                            {bodyContent && (
                                <div>
                                    <button onClick={() => setShowBody(!showBody)}
                                        className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 font-semibold mb-2 transition">
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showBody ? 'rotate-90' : ''}`} />
                                        {showBody ? 'Hide' : 'Show'} Guide Content
                                    </button>
                                    {showBody && (
                                        <div className="prose prose-sm bg-white rounded-lg p-4 max-h-64 overflow-y-auto border border-amber-200">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                                h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-3 mb-1" {...props} />,
                                                h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-2 mb-1" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                            }}>
                                                {bodyContent}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PDF download */}
                            {pdfFile && (
                                <div className="flex gap-3 mt-4">
                                    <a href={getUrl(pdfFile)} download target="_blank" rel="noreferrer"
                                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                    </a>
                                    <a href={getUrl(pdfFile)} target="_blank" rel="noreferrer"
                                        className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
                                        <ExternalLink className="w-3.5 h-3.5" /> View Online
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── GUIDE CARDS ── */}
                <div className="space-y-5">
                    {guides.map((guide, i) => (
                        <motion.div key={i} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible"
                            className={`card border ${guide.color || 'border-gray-200'} overflow-hidden`}>
                            <div className="p-6">
                                <div className="flex gap-4 items-start">
                                    <div className={`rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${guide.iconColor || 'bg-gray-100 text-gray-600'} border`}
                                        style={{ width: 52, height: 52 }}>
                                        {guide.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-display font-bold text-gray-900">{guide.title}</h3>
                                            <span className={`badge ${guide.tag || 'badge-blue'} flex items-center gap-1`}>
                                                {typeIcon(guide.type)} {guide.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">{guide.description}</p>
                                        <ul className="space-y-1.5">
                                            {(guide.steps || []).map((step, j) => (
                                                <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 pb-5 flex gap-3">
                                <button onClick={() => toast.info('Download will be available soon.')}
                                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button onClick={() => toast.info('Online viewer coming soon.')}
                                    className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5">
                                    <ExternalLink className="w-3.5 h-3.5" /> View Online
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            <Footer navigate={navigate} />
        </div>
    );
};

export default GuidesResourcesPage;
