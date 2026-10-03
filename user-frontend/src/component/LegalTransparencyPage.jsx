"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, FileText, Download, ExternalLink, Loader2, Info } from 'lucide-react';
import Breadcrumb from './shared/Breadcrumb';
import Footer from './shared/Footer';
import { usePanchayat } from '../context/PanchayatContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAppNavigate } from '../utils/navigation';

const defaultDocs = [
    { title: 'Waste Management Bylaws 2024', description: 'Official regulations for household waste segregation and collection frequency.', date: 'Jan 15, 2024', size: '1.2 MB', url: '#' },
    { title: 'Transparency Report Q4', description: 'Quarterly report on waste collection efficiency and disposal metrics.', date: 'Feb 02, 2024', size: '2.5 MB', url: '#' },
    { title: 'Privacy Policy & Data Security', description: 'How we handle household and user data within the EcoSyz platform.', date: 'Dec 10, 2023', size: '0.8 MB', url: '#' },
    { title: 'Citizen Charter', description: 'Commitment of the Panchayat towards timely waste collection and grievance redressal.', date: 'Oct 20, 2023', size: '1.1 MB', url: '#' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
};

const LegalTransparencyPage = ({ navigate: propNavigate }) => {
    const appNavigate = useAppNavigate();
    const navigate = propNavigate || appNavigate;
    const { selectedPanchayat } = usePanchayat();
    const [docs, setDocs] = useState(defaultDocs);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedPanchayat?._id) {
            setDocs(defaultDocs);
            return;
        }
        setLoading(true);
        api.get(`/content/public/${selectedPanchayat._id}?type=legal`)
            .then(res => {
                const data = res.data?.legalDocs;
                if (data && data.length > 0) {
                    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
                    setDocs(data.map(d => ({
                        ...d,
                        url: d.url.startsWith('http') ? d.url : `${base}/${d.url.replace(/^\//, '')}`
                    })));
                } else {
                    setDocs(defaultDocs);
                }
            })
            .catch(() => setDocs(defaultDocs))
            .finally(() => setLoading(false));
    }, [selectedPanchayat]);

    const handleDownload = (url, title) => {
        if (!url || url === '#') {
            toast.info("Download will be available soon");
            return;
        }
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-4xl mx-auto px-4 py-10">
                <Breadcrumb path={[{ label: 'Legal & Transparency', view: null }]} navigate={navigate} />

                {/* Header */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-12">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-gray-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Scale className="w-7 h-7 text-slate-600" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Legal &amp; <span className="gradient-text">Transparency</span>
                    </h1>
                    <p className="text-gray-500">Official documents, bylaws, and transparency reports.</p>
                </motion.div>

                {/* Info Card */}
                <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
                    className="flex items-start gap-4 p-5 bg-blue-50 border border-blue-200 rounded-2xl mb-10">
                    <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">EcoSyz Compliance</h3>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            All operations are conducted under the guidelines of the Plastic Waste Management Rules and Solid Waste Management Rules as mandated by the Government.
                        </p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <Loader2 className="animate-spin mr-2" size={24} /> Loading documents...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {docs.map((doc, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                className="card p-6 flex items-center gap-5 hover:border-gray-300 transition-all border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        {doc.title}
                                        <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">PDF</span>
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-1 mb-1">{doc.description}</p>
                                    <p className="text-xs text-gray-400 font-medium">{doc.date} • {doc.size}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(doc.url, doc.title)}
                                        className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100"
                                        title="Download"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(doc.url, doc.title)}
                                        className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-xl transition-all border border-gray-200"
                                        title="View"
                                    >
                                        <ExternalLink size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <motion.div variants={fadeUp} custom={docs.length + 1} initial="hidden" animate="visible"
                    className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                        Missing a document? Contact the Panchayat office or use our contact form for inquiries.
                    </p>
                </motion.div>
            </div>
            <Footer navigate={navigate} />
        </div>
    );
};

export default LegalTransparencyPage;
