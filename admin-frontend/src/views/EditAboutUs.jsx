"use client";

import { useState, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Link, Image, X, Plus, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'react-toastify'
import api from '../api/axios'

// Helper to construct full URL for images if needed
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

/* ─── DEFAULT FALLBACKS (match current user-frontend hardcoded values) ─── */
const DEFAULT_STATS = [
  { value: '2,500+', label: 'Households Served' },
  { value: '5',      label: 'Active Wards' },
  { value: '92%',    label: 'Satisfaction Rate' },
  { value: '100%',   label: 'Government Backed' },
];

const DEFAULT_ACCORDION = [
  { id: 'mission',    title: 'Our Mission',          content: 'Our mission is to create a cleaner, zero-waste community by providing every household with a simple, transparent, and efficient system for waste segregation and collection.', list: [] },
  { id: 'objectives', title: 'Key Objectives',        content: '', list: ['Achieve 100% household registration.', 'Maintain segregation compliance above 95%.', 'Use technology for efficient monitoring.', 'Promote recycling and composting.'] },
  { id: 'works',      title: 'How the Program Works', content: 'The program follows four steps: Segregation, Collection, Processing, and Reporting. Color-coded bins ensure proper waste separation, and transparent reporting keeps citizens informed.', list: [] },
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

/* ─── SECTION WRAPPER (must be at module scope to avoid remount on re-render) ─── */
const Section = ({ title, children }) => (
  <div className="space-y-4 pt-4 border-t border-gray-200">
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    {children}
  </div>
)

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function EditAboutUs() {
  const [content,      setContent]      = useState('')
  const [bannerImage,  setBannerImage]  = useState(null)
  const [cards,        setCards]        = useState([
    { title: "Our Mission", content: "", icon: "01" },
    { title: "The Problem", content: "", icon: "02" },
    { title: "The Solution",content: "", icon: "03" }
  ])
  const [stats,         setStats]        = useState(DEFAULT_STATS)
  const [accordionItems,setAccordionItems] = useState(DEFAULT_ACCORDION)
  const [principles,   setPrinciples]   = useState(DEFAULT_PRINCIPLES)
  const [ctaHeading,   setCtaHeading]   = useState('Ready to Join the Movement?')
  const [ctaSubtext,   setCtaSubtext]   = useState('Log in today and be part of a cleaner, greener future.')
  const [activeTab,    setActiveTab]    = useState('write')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)

  /* ─── FETCH ─── */
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/content?type=about-us')
        if (res.data) {
          setContent(res.data.body || '')
          const banner = res.data.media?.find(m => m.caption === 'Banner')
          if (banner) setBannerImage(banner.url)
          if (res.data.cards?.length)          setCards(res.data.cards)
          if (res.data.stats?.length)          setStats(res.data.stats)
          if (res.data.accordionItems?.length) setAccordionItems(res.data.accordionItems)
          if (res.data.principles?.length)     setPrinciples(res.data.principles)
          if (res.data.ctaHeading)             setCtaHeading(res.data.ctaHeading)
          if (res.data.ctaSubtext)             setCtaSubtext(res.data.ctaSubtext)
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

  /* ─── SAVE ─── */
  const handleSave = async (status) => {
    try {
      setSaving(true)
      const media = []
      if (bannerImage && !bannerImage.startsWith('data:')) {
        media.push({ url: bannerImage, type: 'image', caption: 'Banner' })
      }
      await api.post('/content', {
        type: 'about-us',
        title: 'About Us',
        body: content,
        status,
        media,
        cards,
        stats,
        accordionItems,
        principles,
        ctaHeading,
        ctaSubtext,
      })
      if (status === 'draft')     toast.success("Draft saved successfully")
      if (status === 'published') toast.success("About Us page published successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  /* ─── IMAGE UPLOAD ─── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/content/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setBannerImage(res.data.url)
      toast.success("Image uploaded")
    } catch (err) {
      console.error(err)
      toast.error("Image upload failed")
    }
  }

  const insertFormatting = (before, after = '') => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return
    const start = textarea.selectionStart
    const end   = textarea.selectionEnd
    const sel   = content.substring(start, end)
    setContent(content.substring(0, start) + before + (sel || 'text') + after + content.substring(end))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + (sel || 'text').length)
    }, 0)
  }

  /* ─── STAT HELPERS ─── */
  const handleStatChange = (i, field, value) => {
    const next = [...stats]; next[i][field] = value; setStats(next)
  }
  const addStat    = () => setStats([...stats, { value: '', label: '' }])
  const removeStat = (i) => setStats(stats.filter((_, idx) => idx !== i))

  /* ─── ACCORDION HELPERS ─── */
  const handleAccordionChange = (i, field, value) => {
    const next = [...accordionItems]; next[i][field] = value; setAccordionItems(next)
  }
  const handleListItemChange = (ai, li, value) => {
    const next = [...accordionItems]
    next[ai].list[li] = value
    setAccordionItems(next)
  }
  const addListItem = (ai) => {
    const next = [...accordionItems]
    next[ai].list = [...(next[ai].list || []), '']
    setAccordionItems(next)
  }
  const removeListItem = (ai, li) => {
    const next = [...accordionItems]
    next[ai].list = next[ai].list.filter((_, idx) => idx !== li)
    setAccordionItems(next)
  }
  const addAccordionItem    = () => setAccordionItems([...accordionItems, { id: `item-${Date.now()}`, title: '', content: '', list: [] }])
  const removeAccordionItem = (i) => setAccordionItems(accordionItems.filter((_, idx) => idx !== i))

  /* ─── PRINCIPLE HELPERS ─── */
  const handlePrincipleChange = (i, field, value) => {
    const next = [...principles]; next[i][field] = value; setPrinciples(next)
  }
  const addPrinciple    = () => setPrinciples([...principles, { emoji: '✨', title: '', desc: '' }])
  const removePrinciple = (i) => setPrinciples(principles.filter((_, idx) => idx !== i))

  /* ─── CARD HELPERS ─── */
  const handleCardChange = (index, field, value) => {
    const newCards = [...cards]; newCards[index][field] = value; setCards(newCards)
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">Public Website CMS › Edit About Us</p>
        <h1 className="text-xl font-black text-gray-800">Edit About Us</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">ABOUT US CONTENT MANAGEMENT</h1>
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

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">About Us Editor</h2>

          {/* ── BANNER IMAGE ── */}
          <div className="space-y-3 border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-700">Banner Image</label>
            {bannerImage ? (
              <div className="relative w-full">
                <img src={getImageUrl(bannerImage)} alt="Banner" className="w-full h-48 object-cover rounded-lg" />
                <button onClick={() => setBannerImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                <div className="text-4xl mb-3">🖼️</div>
                <label className="cursor-pointer">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* ── BODY CONTENT ── */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold text-gray-800">Content Editor (Main Description)</h3>
              <div className="flex bg-gray-200 rounded p-1 gap-1">
                <button onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${activeTab === 'write' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>
                  Write
                </button>
                <button onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${activeTab === 'preview' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>
                  Preview
                </button>
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
                  <button onClick={() => insertFormatting('# ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="Heading 1"><Heading1 size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('## ', '')} className="p-2 hover:bg-gray-200 rounded transition" title="Heading 2"><Heading2 size={18} className="text-gray-700" /></button>
                  <div className="h-6 border-l border-gray-300" />
                  <button onClick={() => insertFormatting('[', '](https://example.com)')} className="p-2 hover:bg-gray-200 rounded transition" title="Link"><Link size={18} className="text-gray-700" /></button>
                  <button onClick={() => insertFormatting('![', '](image-url)')} className="p-2 hover:bg-gray-200 rounded transition" title="Image"><Image size={18} className="text-gray-700" /></button>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-64 font-mono text-sm"
                  placeholder="Enter your about us content here... (Markdown supported)" />
              </>
            ) : (
              <div className="w-full px-6 py-6 border border-gray-300 rounded-lg h-64 overflow-y-auto prose prose-sm bg-white">
                <ReactMarkdown components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                  p:  ({node, ...props}) => <p className="mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                }}>
                  {content || '*No content to preview*'}
                </ReactMarkdown>
              </div>
            )}
            <div className="text-right text-xs text-gray-500 font-medium">
              {content.length} characters | {content.split(/\s+/).filter(w => w.length > 0).length} words
            </div>
          </div>

          {/* ── INFOGRAPHIC CARDS ── */}
          <Section title="Infographic Cards (Our Mission / The Problem / The Solution)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Card {index + 1}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Icon: {card.icon}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                    <input type="text" value={card.title} onChange={(e) => handleCardChange(index, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Content</label>
                    <textarea value={card.content} onChange={(e) => handleCardChange(index, "content", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 h-24 text-sm resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── STATS ── */}
          <Section title="Stats Banner (Households Served, Wards, etc.)">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="border border-gray-300 rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600">Stat {i + 1}</span>
                    <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">Value</label>
                    <input type="text" value={stat.value} onChange={(e) => handleStatChange(i, 'value', e.target.value)}
                      placeholder="e.g. 2,500+"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">Label</label>
                    <input type="text" value={stat.label} onChange={(e) => handleStatChange(i, 'label', e.target.value)}
                      placeholder="e.g. Households Served"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addStat}
              className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition mt-1">
              <Plus size={16} /> Add Stat
            </button>
          </Section>

          {/* ── ACCORDION ITEMS ── */}
          <Section title="Accordion Sections (Mission, Objectives, How It Works, Legal)">
            <div className="space-y-4">
              {accordionItems.map((item, ai) => (
                <div key={ai} className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-sm">Section {ai + 1}</span>
                    <button onClick={() => removeAccordionItem(ai)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">ID (slug)</label>
                      <input type="text" value={item.id}
                        onChange={(e) => handleAccordionChange(ai, 'id', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="e.g. mission" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                      <input type="text" value={item.title}
                        onChange={(e) => handleAccordionChange(ai, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="e.g. Our Mission" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Content (paragraph)</label>
                    <textarea value={item.content}
                      onChange={(e) => handleAccordionChange(ai, 'content', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 h-20 resize-none"
                      placeholder="Optional paragraph text..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">List Items (optional)</label>
                    <div className="space-y-2">
                      {(item.list || []).map((li, liIdx) => (
                        <div key={liIdx} className="flex gap-2">
                          <input type="text" value={li}
                            onChange={(e) => handleListItemChange(ai, liIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder={`List item ${liIdx + 1}`} />
                          <button onClick={() => removeListItem(ai, liIdx)} className="text-red-400 hover:text-red-600 transition"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addListItem(ai)}
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium transition mt-2">
                      <Plus size={13} /> Add list item
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addAccordionItem}
              className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition mt-1">
              <Plus size={16} /> Add Section
            </button>
          </Section>

          {/* ── GUIDING PRINCIPLES ── */}
          <Section title="Guiding Principles Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {principles.map((p, i) => (
                <div key={i} className="border border-gray-300 rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600">Principle {i + 1}</span>
                    <button onClick={() => removePrinciple(i)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 flex-shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Emoji</label>
                      <input type="text" value={p.emoji} onChange={(e) => handlePrincipleChange(i, 'emoji', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-center" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Title</label>
                      <input type="text" value={p.title} onChange={(e) => handlePrincipleChange(i, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">Description</label>
                    <textarea value={p.desc} onChange={(e) => handlePrincipleChange(i, 'desc', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 h-16 resize-none" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addPrinciple}
              className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition mt-1">
              <Plus size={16} /> Add Principle
            </button>
          </Section>

          {/* ── CTA ── */}
          <Section title="Call to Action (CTA) Section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Heading</label>
                <input type="text" value={ctaHeading} onChange={(e) => setCtaHeading(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Ready to Join the Movement?" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subtext</label>
                <input type="text" value={ctaSubtext} onChange={(e) => setCtaSubtext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Log in today and be part of a cleaner, greener future." />
              </div>
            </div>
          </Section>

        </div>{/* end space-y-4 */}

        {/* Footer buttons */}
        <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
          <button onClick={() => { setContent(''); toast.info("Content cleared") }}
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
