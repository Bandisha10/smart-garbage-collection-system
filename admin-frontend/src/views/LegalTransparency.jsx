"use client";

import { useState, useEffect, useRef } from 'react'
import { Download, Eye, RefreshCw, Trash2, Plus, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { toast } from 'react-toastify'

const CONTENT_TYPE = 'legal'
const RAW_API = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || 'https://smartgarbageserver.kamsoft.co.in/api'
const BASE_URL = RAW_API.replace(/\/api$/, '')

export default function LegalTransparency() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const fileRef = useRef(null)

  /* ── Fetch legal docs ── */
  const fetchDocs = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/content?type=${CONTENT_TYPE}`)
      setDocs(res.data?.legalDocs || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  /* ── Save docs array ── */
  const saveDocs = async (updatedDocs) => {
    setSaving(true)
    try {
      await api.post('/content', {
        type: CONTENT_TYPE,
        title: 'Legal & Transparency',
        status: 'published',
        legalDocs: updatedDocs,
      })
      toast.success('Documents saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ── Upload PDF ── */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!newDocTitle.trim()) { toast.error('Please enter a document title first'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const fileSizeKB = (file.size / 1024).toFixed(0)
      const fileSize = fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`
      const newDoc = {
        title: newDocTitle.trim().toUpperCase(),
        fileType: 'PDF',
        fileName: file.name,
        url: res.data.url,
        size: fileSize,
        updatedAt: new Date().toISOString().split('T')[0],
      }
      const updatedDocs = [...docs, newDoc]
      setDocs(updatedDocs)
      await saveDocs(updatedDocs)
      setShowUploadModal(false)
      setNewDocTitle('')
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (idx) => {
    if (!confirm(`Delete "${docs[idx].title}"?`)) return
    const updatedDocs = docs.filter((_, i) => i !== idx)
    setDocs(updatedDocs)
    await saveDocs(updatedDocs)
  }

  const handleView = (doc) => {
    if (!doc.url) { toast.error('File not available'); return }
    const url = doc.url.startsWith('http') ? doc.url : `${BASE_URL}/${doc.url}`
    window.open(url, '_blank')
  }

  const handleReplace = () => {
    setShowUploadModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">Central Dashboard › Legal & Transparency</p>
        <h1 className="text-xl font-black text-gray-800">Legal & Transparency</h1>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Upload Document
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading documents...
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-3 text-lg font-semibold">No documents yet</p>
          <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
            Upload your first document
          </button>
        </div>
      ) : (
        /* Documents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {docs.map((doc, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-8">
              {/* Document Icon */}
              <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl mb-6 mx-auto">
                <div className="text-white text-2xl font-bold">{doc.fileType || 'PDF'}</div>
              </div>

              {/* Title */}
              <h3 className="text-center text-lg font-bold text-gray-800 mb-4 truncate">{doc.title}</h3>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <button
                  onClick={() => handleView(doc)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  <Eye size={14} /> View
                </button>
                <button
                  onClick={handleReplace}
                  className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition"
                >
                  <RefreshCw size={14} /> Replace
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {/* Meta */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>{doc.size}</p>
                <p>Updated: {doc.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-overlay"> 
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Upload Legal Document</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Document Title *</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. Privacy Policy Document"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PDF File *</label>
                  {uploading ? (
                    <div className="flex items-center gap-2 py-4 text-gray-500 font-medium">
                      <Loader2 size={18} className="animate-spin" /> Uploading PDF...
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 transition-all hover:border-blue-200">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold hover:file:bg-blue-100 transition-all cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="mt-8 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors uppercase tracking-wider">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
