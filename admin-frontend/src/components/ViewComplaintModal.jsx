"use client";

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Phone, Calendar, FileText } from 'lucide-react'
import { toast } from 'react-toastify'


export default function ViewComplaintModal({ isOpen, onClose, complaint, onStatusUpdate, employees }) {
  const [selectedStatus, setSelectedStatus] = useState(complaint?.status || 'Received')
  const [selectedEmployee, setSelectedEmployee] = useState(complaint?.assignedEmployee?._id || '')
  const [resolutionTime, setResolutionTime] = useState('')
  const [errors, setErrors] = useState({})

  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (modalRef.current) {
        modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isOpen]);

  if (!isOpen || !complaint) return null

  const validate = () => {
    const newErrors = {}
    if (selectedStatus === 'In Progress' && !selectedEmployee) {
      newErrors.employee = 'Required for In Progress'
    }
    if (selectedStatus === 'Resolved' && !resolutionTime?.trim()) {
      newErrors.resolutionTime = 'Required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateStatus = () => {
    if (!validate()) {
      toast.error("Please fill in required fields")
      return;
    }
    onStatusUpdate(complaint.originalId || complaint.id, {
      status: selectedStatus,
      assignedTo: selectedEmployee,
      resolutionTime: resolutionTime
    })
    onClose()
  }

  return (
    <>
 <div className="fixed inset-0 modal-overlay bg-black/50 backdrop-blur-sm z-[9999]" onClick={onClose} /> 
 <div className="fixed inset-0 modal-overlay flex items-center justify-center z-[9999] p-4 pointer-events-none"> 
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-100 animate-fade-in-up overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto">

          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1f9e9a, #16847f)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Feedback Details</p>
                <h2 className="text-white font-bold text-sm">{complaint.id}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT COLUMN - Basic Information */}
              <div className="lg:col-span-2 space-y-6">

                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Feedback ID</label>
                        <input
                          type="text"
                          value={complaint.id}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Date Submitted</label>
                        <input
                          type="text"
                          value={complaint.dateSubmitted}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Submitted By</label>
                      <input
                        type="text"
                        value={complaint.name}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Contact Number</label>
                      <input
                        type="text"
                        value={complaint.mobile || 'N/A'}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
                      <input
                        type="text"
                        value={complaint.category}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Message</label>
                      <textarea
                        value={complaint.description || ''}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm resize-none h-20"
                      />
                    </div>

                    {/* Images Section */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Images</label>
                      <div className="flex gap-3">
                        {complaint.photo ? (
                          <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center border border-gray-300 overflow-hidden">
                            <img
                              src={complaint.photo.startsWith('http') ? complaint.photo : `${(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smartgarbageserver.kamsoft.co.in/api').replace(/\/api\/?$/, '')}/${complaint.photo.replace(/^\//, '')}`}
                              alt="Feedback"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerText = '📷'; }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center border border-gray-300">
                            <span className="text-2xl">📷</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Ward & Location & Status */}
              <div className="lg:col-span-1 space-y-6">

                {/* Ward & Location Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Ward & Location</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Ward</label>
                      <input
                        type="text"
                        value={complaint.ward}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Location</label>
                      <div className="w-full h-40 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl">📍</span>
                          <p className="text-xs text-gray-600 mt-2">Map will be displayed here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned To & Status Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned To & Status</h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-600">Assigned To</label>
                        {errors.employee && <span className="text-[10px] text-red-500 font-bold">{errors.employee}</span>}
                      </div>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => {
                          setSelectedEmployee(e.target.value)
                          if (errors.employee) setErrors(prev => ({ ...prev, employee: '' }))
                        }}
                        className={`w-full px-3 py-2 border rounded text-gray-700 text-sm focus:outline-none transition-all ${errors.employee ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'
                          }`}
                      >
                        <option value="">Search a employee</option>
                        {employees && employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.name} - {emp.role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Status</label>
                      <div className="space-y-2">
                        {['Received', 'In Progress', 'Resolved'].map((status) => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              value={status}
                              checked={selectedStatus === status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setSelectedStatus(newStatus);
                                if (newStatus === 'Resolved' && complaint.createdAt) {
                                  const created = new Date(complaint.createdAt);
                                  const now = new Date();
                                  const diffMs = now - created;
                                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  const diffDays = Math.floor(diffHrs / 24);

                                  let duration = "";
                                  if (diffDays > 0) duration += `${diffDays} days `;
                                  if (diffHrs % 24 > 0) duration += `${diffHrs % 24} hours `;
                                  if (diffMins > 0) duration += `${diffMins} minutes`;
                                  setResolutionTime(duration.trim() || "< 1 minute");
                                }
                              }}
                              className="w-4 h-4 text-teal-500"
                            />
                            <span className="text-sm text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {selectedStatus === 'Resolved' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-600">Resolution Time</label>
                          {errors.resolutionTime && <span className="text-[10px] text-red-500 font-bold">{errors.resolutionTime}</span>}
                        </div>
                        <input
                          type="text"
                          placeholder="time taken from received to resolved"
                          value={resolutionTime}
                          onChange={(e) => {
                            setResolutionTime(e.target.value)
                            if (errors.resolutionTime) setErrors(prev => ({ ...prev, resolutionTime: '' }))
                          }}
                          className={`w-full px-3 py-2 border rounded text-gray-700 text-sm focus:outline-none transition-all ${errors.resolutionTime ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex justify-end gap-3 flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleUpdateStatus}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #1f9e9a, #16847f)' }}>
              Update & Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
