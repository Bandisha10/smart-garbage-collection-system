"use client";

import { useState, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Link, Image, X, Play, Trash2, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'react-toastify'
import api from '../api/axios'

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

/* ── Default guide cards matching user-frontend GuidesResourcesPage ── */
const DEFAULT_GUIDES = [
  { icon: '🗑️', title: 'Waste Segregation Guide',     description: 'Learn how to properly separate dry, wet, and hazardous waste for efficient collection and recycling.', type: 'PDF Guide',   color: 'bg-amber-50 border-amber-200',  iconColor: 'bg-amber-100 text-amber-600',  tag: 'badge-yellow', steps: ['Use Green bin for organic/wet waste', 'Use Blue bin for dry/recyclable waste', 'Use Red bin for hazardous items', 'Never mix sanitary waste with recyclables'] },
  { icon: '🌿', title: 'Home Composting Basics',       description: 'Turn your kitchen and garden waste into rich compost. A step-by-step guide for households.',           type: 'Video Guide', color: 'bg-green-50 border-green-200',  iconColor: 'bg-green-100 text-green-600',  tag: 'badge-green',  steps: ['Start with a compost bin or pit', 'Add kitchen scraps and dry leaves alternately', 'Turn the pile every 2 weeks', 'Ready compost in 4–6 weeks'] },
  { icon: '📋', title: 'How to File a Complaint',      description: 'A quick guide on using the EcoSyz complaint system to report missed collections or civic issues.',       type: 'Article',     color: 'bg-blue-50 border-blue-200',    iconColor: 'bg-blue-100 text-blue-600',    tag: 'badge-blue',   steps: ['Login with your mobile number', 'Go to Dashboard → Submit Complaint', 'Choose a complaint type and describe the issue', 'Track status from your dashboard'] },
  { icon: '♻️', title: 'Recyclable Materials List',    description: 'Know what can and cannot be recycled. This helps ensure cleaner segregation and better recovery rates.',  type: 'PDF Guide',   color: 'bg-purple-50 border-purple-200', iconColor: 'bg-purple-100 text-purple-600', tag: 'badge-blue',   steps: ['Paper, cardboard, newspapers — YES', 'Glass bottles and jars — YES', 'Plastic bags and film — NO', 'Styrofoam / thermocol — NO'] },
  { icon: '🏠', title: 'Household Registration Guide', description: 'New to EcoSyz? Follow these steps to get your household registered under your Panchayat.',              type: 'Article',     color: 'bg-rose-50 border-rose-200',    iconColor: 'bg-rose-100 text-rose-600',    tag: 'badge-red',    steps: ['Contact your Panchayat incharge', 'Provide your address and mobile number', 'You will receive an OTP to activate your account', 'Login via EcoSyz and select your Panchayat'] },
];

const TYPE_OPTIONS = ['PDF Guide', 'Video Guide', 'Article'];

/* ─── SECTION WRAPPER (must be at module scope to avoid remount on re-render) ─── */
const Section = ({ title, children }) => (
  <div className="space-y-4 pt-4 border-t border-gray-200">
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    {children}
  </div>
)

export default function EditSegregationGuide() {
  const [content,       setContent]       = useState('')
  const [tutorialVideo, setTutorialVideo] = useState(null)
  const [pdfFile,       setPdfFile]       = useState(null)
  const [guides,        setGuides]        = useState(DEFAULT_GUIDES)
  const [activeTab,     setActiveTab]     = useState('write')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)

  /* ── FETCH ── */
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/content?type=segregation-guide')
        if (res.data) {
          setContent(res.data.body || '')
          if (res.data.media) {
            const video = res.data.media.find(m => m.type === 'video')
            if (video) setTutorialVideo({ name: 'Tutorial Video', url: video.url })
            const pdf = res.data.media.find(m => m.caption === 'PDF Guide')
            if (pdf) setPdfFile({ name: 'Guide PDF', url: pdf.url })
          }
          if (res.data.guides?.length) setGuides(res.data.guides)
        }
      } catch (err) {
        console.error("Fetch Error:", err)
        toast.error("Failed to load content")
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  /* ── SAVE ── */
  const handleSave = async (status) => {
    try {
      setSaving(true)
      const media = []
      if (tutorialVideo) media.push({ url: tutorialVideo.url, type: 'video',  caption: 'Tutorial Video' })
      if (pdfFile)       media.push({ url: pdfFile.url,       type: 'file',   caption: 'PDF Guide' })
      await api.post('/content', {
        type: 'segregation-guide',
        title: 'Segregation Guide',
        body: content,
        status,
        media,
        guides,
      })
      if (status === 'draft')     toast.success("Draft saved successfully")
      if (status === 'published') toast.success("Segregation Guide published successfully!")
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  /* ── UPLOAD HANDLERS ── */
  const uploadFile = async (e, onSuccess, toastMsg) => {
    const file = e.target.files[0]; if (!file) return
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await api.post('/content/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSuccess({ name: file.name, url: res.data.url })
      toast.success(toastMsg)
    } catch (err) { console.error(err); toast.error("Upload failed") }
  }

  const insertFormatting = (before, after = '') => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return
    const start = textarea.selectionStart, end = textarea.selectionEnd
    const sel = content.substring(start, end)
    setContent(content.substring(0, start) + before + (sel || 'text') + after + content.substring(end))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + (sel || 'text').length)
    }, 0)
  }

  /* ── GUIDE CARD HELPERS ── */
  const handleGuideChange = (i, field, value) => {
    const next = [...guides]; next[i] = { ...next[i], [field]: value }; setGuides(next)
  }
  const handleStepChange = (gi, si, value) => {
    const next = [...guides]; next[gi].steps[si] = value; setGuides(next)
  }
  const addStep    = (gi) => { const next = [...guides]; next[gi].steps = [...next[gi].steps, '']; setGuides(next) }
  const removeStep = (gi, si) => { const next = [...guides]; next[gi].steps = next[gi].steps.filter((_, idx) => idx !== si); setGuides(next) }
  const addGuide   = () => setGuides([...guides, { icon: '📄', title: '', description: '', type: 'Article', color: 'bg-gray-50 border-gray-200', iconColor: 'bg-gray-100 text-gray-600', tag: 'badge-blue', steps: [] }])
  const removeGuide = (i) => setGuides(guides.filter((_, idx) => idx !== i))

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">Public Website CMS › Edit Segregation Guide</p>
        <h1 className="text-xl font-black text-gray-800">Edit Segregation Guide</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">SEGREGATION GUIDE CONTENT MANAGEMENT</h1>
          <div className="flex gap-2">
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-400 text-gray-700 rounded font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={() => handleSave('published')} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded font-semibold text-sm hover:bg-teal-600 transition disabled:opacity-50">
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-800">Segregation Guide Editor</h2>

          {/* ── TUTORIAL VIDEO ── */}
          <div className="space-y-3 border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-700">Tutorial Video</label>
            {tutorialVideo ? (
              <div className="relative w-full">
                <div className="bg-gray-900 rounded-lg h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                    <p className="text-white text-sm font-semibold">{tutorialVideo.name}</p>
                  </div>
                </div>
                <button onClick={() => setTutorialVideo(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                <div className="text-4xl mb-3">🎬</div>
                <label className="cursor-pointer">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload tutorial video or drag and drop</p>
                  <p className="text-xs text-gray-500">MP4, WebM, OGG up to 100MB</p>
                  <input type="file" accept="video/*" className="hidden"
                    onChange={(e) => uploadFile(e, setTutorialVideo, "Video uploaded")} />
                </label>
              </div>
            )}
          </div>

          {/* ── BODY TEXT ── */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold text-gray-800">Do's &amp; Don'ts / Guide Text (Markdown)</h3>
              <div className="flex bg-gray-200 rounded p-1 gap-1">
                <button onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${activeTab === 'write' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>Write</button>
                <button onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${activeTab === 'preview' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>Preview</button>
              </div>
            </div>
            {activeTab === 'write' ? (
              <>
                <div className="bg-gray-50 border border-gray-300 rounded-t-lg p-3 flex flex-wrap gap-2 items-center">
                  <button onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-gray-200 rounded transition" title="Bold"><Bold size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-gray-200 rounded transition" title="Italic"><Italic size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('<u>', '</u>')} className="p-2 hover:bg-gray-200 rounded transition" title="Underline"><Underline size={18} className="text-gray-700" /></button>
                  <div className="h-6 border-l border-gray-300" />
                  <button onClick={() => insertFormatting('- ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="Bullets"><List size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('1. ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="Numbered"><ListOrdered size={18} className="text-gray-700" /></button>
                  <div className="h-6 border-l border-gray-300" />
                  <button onClick={() => insertFormatting('# ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="H1"><Heading1 size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('## ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="H2"><Heading2 size={18} className="text-gray-700" /></button>
                  <div className="h-6 border-l border-gray-300" />
                  <button onClick={() => insertFormatting('[', '](https://example.com)')} className="p-2 hover:bg-gray-200 rounded transition" title="Link"><Link size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('![', '](image-url)')} className="p-2 hover:bg-gray-200 rounded transition" title="Image"><Image size={18} className="text-gray-700" /></button>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-mono text-sm"
                  placeholder="Enter segregation guide content here... (Markdown supported)" />
              </>
            ) : (
              <div className="w-full px-6 py-6 border border-gray-300 rounded-lg h-96 overflow-y-auto prose prose-sm bg-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                  p:  ({node, ...props}) => <p className="mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                  a: ({node, ...props}) => <a className="text-teal-600 hover:underline" {...props} />,
                }}>
                  {content || '*No content to preview*'}
                </ReactMarkdown>
              </div>
            )}
            <div className="text-right text-xs text-gray-500 font-medium">
              {content.length} characters | {content.split(/\s+/).filter(w => w.length > 0).length} words
            </div>
          </div>

          {/* ── PDF ── */}
          <Section title="Segregation Guide PDF (Downloadable)">
            {pdfFile ? (
              <div className="border border-gray-300 rounded-lg p-6 text-center">
                <div className="text-5xl mb-3">📄</div>
                <p className="text-sm font-semibold text-gray-800 mb-4">{pdfFile.name}</p>
                <div className="flex gap-2 justify-center">
                  <a href={pdfFile.url.startsWith("http") ? pdfFile.url : `${(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '')}/${pdfFile.url.replace(/^\//, '')}`} target="_blank" rel="noreferrer"
                    className="px-4 py-2 bg-yellow-500 text-white rounded font-semibold text-sm hover:bg-yellow-600 transition">
                    View
                  </a>
                  <button onClick={() => setPdfFile(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded font-semibold text-sm hover:bg-red-600 transition flex items-center gap-2">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                <div className="text-4xl mb-3">📥</div>
                <label className="cursor-pointer">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload PDF or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF up to 50MB</p>
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={(e) => uploadFile(e, setPdfFile, "PDF uploaded")} />
                </label>
              </div>
            )}
          </Section>

          {/* ── GUIDE CARDS EDITOR ── */}
          <Section title="Guide & Resource Cards (shown on Guides &amp; Resources page)">
            <div className="space-y-4">
              {guides.map((guide, gi) => (
                <div key={gi} className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-sm">Card {gi + 1}</span>
                    <button onClick={() => removeGuide(gi)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Icon (emoji)</label>
                      <input type="text" value={guide.icon} onChange={(e) => handleGuideChange(gi, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-center text-lg" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                      <input type="text" value={guide.title} onChange={(e) => handleGuideChange(gi, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                      <select value={guide.type} onChange={(e) => handleGuideChange(gi, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm bg-white">
                        {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <textarea value={guide.description} onChange={(e) => handleGuideChange(gi, 'description', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Card color classes</label>
                      <input type="text" value={guide.color} onChange={(e) => handleGuideChange(gi, 'color', e.target.value)}
                        placeholder="e.g. bg-amber-50 border-amber-200"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Icon color classes</label>
                      <input type="text" value={guide.iconColor} onChange={(e) => handleGuideChange(gi, 'iconColor', e.target.value)}
                        placeholder="e.g. bg-amber-100 text-amber-600"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Steps / Key Points</label>
                    <div className="space-y-2">
                      {(guide.steps || []).map((step, si) => (
                        <div key={si} className="flex gap-2">
                          <input type="text" value={step} onChange={(e) => handleStepChange(gi, si, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder={`Step ${si + 1}`} />
                          <button onClick={() => removeStep(gi, si)} className="text-red-400 hover:text-red-600 transition"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addStep(gi)}
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium transition mt-2">
                      <Plus size={13} /> Add step
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addGuide}
              className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition mt-1">
              <Plus size={16} /> Add Guide Card
            </button>
          </Section>

        </div>{/* end editor */}

        <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
          <button onClick={() => setContent('')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-semibold text-sm hover:bg-gray-400 transition">
            Clear Body
          </button>
          <button onClick={() => handleSave('published')} disabled={saving}
            className="px-6 py-2 bg-teal-500 text-white rounded font-semibold text-sm hover:bg-teal-600 transition disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}
