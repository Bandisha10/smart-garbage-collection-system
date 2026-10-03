"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Maximize2, X, Loader2, Camera } from 'lucide-react';
import Breadcrumb from './shared/Breadcrumb';
import Footer from './shared/Footer';
import { usePanchayat } from '../context/PanchayatContext';
import api from '../api/axios';
import { useAppNavigate } from '../utils/navigation';

const defaultPhotos = [
    { url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80', caption: 'Community Cleanup Drive 2024' },
    { url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', caption: 'New Recycling Bins Installation' },
    { url: 'https://images.unsplash.com/photo-1536147116438-62679a5e01f2?auto=format&fit=crop&w=800&q=80', caption: 'Awareness Seminar at Local School' },
    { url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80', caption: 'Organic Waste Processing Unit' },
    { url: 'https://images.unsplash.com/photo-1591193512858-12bb5a0ff8e5?auto=format&fit=crop&w=800&q=80', caption: 'Panchayat Waste Collection Fleet' },
    { url: 'https://images.unsplash.com/photo-1503596476-1c12a8f09a91?auto=format&fit=crop&w=800&q=80', caption: 'Beach Cleaning Initiative' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const GalleryPage = ({ navigate: propNavigate }) => {
    const appNavigate = useAppNavigate();
    const navigate = propNavigate || appNavigate;
    const { selectedPanchayat } = usePanchayat();
    const [photos, setPhotos] = useState(defaultPhotos);
    const [loading, setLoading] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    useEffect(() => {
        if (!selectedPanchayat?._id) {
            setPhotos(defaultPhotos);
            return;
        }
        setLoading(true);
        api.get(`/content/public/${selectedPanchayat._id}?type=gallery`)
            .then(res => {
                const data = res.data?.photos;
                if (data && data.length > 0) {
                    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
                    setPhotos(data.map(p => ({
                        ...p,
                        url: p.url.startsWith('http') ? p.url : `${base}/${p.url.replace(/^\//, '')}`
                    })));
                } else {
                    setPhotos(defaultPhotos);
                }
            })
            .catch(() => setPhotos(defaultPhotos))
            .finally(() => setLoading(false));
    }, [selectedPanchayat]);

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
            <div className="max-w-6xl mx-auto px-4 py-10">
                <Breadcrumb path={[{ label: 'Photo Gallery', view: null }]} navigate={navigate} />

                {/* Header */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-12">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Photo <span className="gradient-text">Gallery</span>
                    </h1>
                    <p className="text-gray-500">Glimpses of our journey towards a cleaner environment.</p>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <Loader2 className="animate-spin mr-2" size={24} /> Loading gallery...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {photos.map((photo, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ y: -5 }}
                                className="group relative card overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                                    <img
                                        src={photo.url}
                                        alt={photo.caption}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => setSelectedImg(photo)}
                                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                                        >
                                            <Maximize2 size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{photo.caption}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
 className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 md:p-10" 
                        onClick={() => setSelectedImg(null)}
                    >
                        <button
                            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedImg(null); }}
                        >
                            <X size={24} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImg.url}
                                alt={selectedImg.caption}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                            />
                            <p className="mt-6 text-white text-lg font-display font-medium text-center">
                                {selectedImg.caption}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer navigate={navigate} />
        </div>
    );
};

export default GalleryPage;
