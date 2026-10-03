"use client";

import { useState, useEffect, useRef } from 'react'
import { Upload, Edit2, Trash2, Plus, X, Loader2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { toast } from 'react-toastify'

const CONTENT_TYPE = 'gallery'
const RAW_API = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || 'https://smartgarbageserver.kamsoft.co.in/api'
const BASE_URL = RAW_API.replace(/\/api$/, '')

export default function ManagePhotoGallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  /* ── Fetch gallery from backend ── */
  const fetchGallery = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/content?type=${CONTENT_TYPE}`)
      setPhotos(res.data?.photos || [])
    } catch {
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGallery() }, [])

  useEffect(() => {
    if (isUploadModalOpen) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [isUploadModalOpen])

  /* ── Save entire photos array ── */
  const saveGallery = async (updatedPhotos, status = 'published') => {
    setSaving(true)
    try {
      await api.post('/content', {
        type: CONTENT_TYPE,
        title: 'Photo Gallery',
        status,
        photos: updatedPhotos,
      })
      toast.success(status === 'published' ? 'Gallery published!' : 'Draft saved!')
    } catch {
      toast.error('Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }

  /* ── Upload image via content upload endpoint ── */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const newPhotos = [...photos]
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await api.post('/content/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        newPhotos.push({ url: res.data.url, caption: file.name.replace(/\.[^.]+$/, '') })
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setPhotos(newPhotos)
    setUploading(false)
    setIsUploadModalOpen(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const resolveUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${BASE_URL}/${url}`
  }

  const handleDeleteImage = (idx) => {
    if (!window.confirm('Delete this photo?')) return
    setPhotos(p => p.filter((_, i) => i !== idx))
  }

  const handleSaveCaption = (idx) => {
    setPhotos(p => p.map((photo, i) => i === idx ? { ...photo, caption: editCaption } : photo))
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">Public Website CMS › Manage Photo Gallery</p>
        <h1 className="text-xl font-black text-gray-800">Manage Photo Gallery</h1>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Header with buttons */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">PHOTO GALLERY MANAGEMENT</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition"
            >
              <Plus size={18} /> Upload New Photo
            </button>
            <button
              onClick={() => saveGallery(photos, 'draft')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded font-semibold text-sm hover:bg-gray-600 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Draft
            </button>
            <button
              onClick={() => saveGallery(photos, 'published')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded font-semibold text-sm hover:bg-teal-600 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Publish
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading gallery...
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-3 text-lg font-semibold">No photos yet</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700"
            >
              Upload your first photo
            </button>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div className="relative bg-gray-200 h-48 overflow-hidden">
                  <img
                    src={resolveUrl(photo.url)}
                    alt={photo.caption}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition" />
                </div>
                <div className="p-4 space-y-3">
                  {editingId === idx ? (
                    <input
                      type="text"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full px-3 py-2 border border-teal-500 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="Enter caption"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 font-medium text-center">{photo.caption || 'No caption'}</p>
                  )}
                  <div className="flex gap-2">
                    {editingId === idx ? (
                      <>
                        <button onClick={() => handleSaveCaption(idx)} className="flex-1 px-3 py-2 bg-teal-500 text-white rounded font-semibold text-xs hover:bg-teal-600 transition">Save</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-2 bg-gray-400 text-white rounded font-semibold text-xs hover:bg-gray-500 transition">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(idx); setEditCaption(photo.caption || '') }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-500 text-white rounded font-semibold text-xs hover:bg-teal-600 transition"><Edit2 size={14} />Edit</button>
                        <button onClick={() => handleDeleteImage(idx)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded font-semibold text-xs hover:bg-red-600 transition"><Trash2 size={14} />Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto modal-overlay"> 
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Upload Photos</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              {uploading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw size={40} className="text-blue-500" />
                  </motion.div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Uploading your photos...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-100 rounded-3xl p-10 text-center bg-gray-50 group hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer relative"
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all group-hover:scale-110">
                        <Upload size={32} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-800">Click to upload files</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">PNG, JPG, WEBP up to 10MB each</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsUploadModalOpen(false)} className="w-full px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors uppercase tracking-widest">Cancel</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
