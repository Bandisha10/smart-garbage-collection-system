"use client";

import { useEffect, useRef } from "react"
import { X, User, UserX } from "lucide-react"

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "https://smartgarbageserver.kamsoft.co.in/api"
const STATIC_BASE = RAW_API_BASE.replace(/\/api$/, "")
const isImage = (path = "") => /\.(jpg|jpeg|png|webp)$/i.test(path)

export default function DeactivateEmployeeModal({ isOpen, onClose, employee, onConfirm }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isOpen])

  if (!isOpen || !employee) return null

  const handleDeactivate = () => { onConfirm(employee._id); onClose() }
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : "-"

  return (
    <>
      <div className="fixed inset-0 modal-overlay bg-black/50 backdrop-blur-sm z-[9999]" onClick={onClose} />
      <div className="fixed inset-0 modal-overlay flex items-center justify-center z-[9999] p-4">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-fade-in-up overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <UserX size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Confirm Action</p>
                <h2 className="text-white font-bold text-sm">Deactivate Employee</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500 text-center">
              This employee will <span className="font-bold text-gray-700">lose system access</span> immediately.
            </p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {employee.documents?.photo && isImage(employee.documents.photo)
                  ? <img src={`${STATIC_BASE}/${employee.documents.photo}`} className="w-full h-full object-cover" alt="Employee" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    {employee.name?.charAt(0)}
                  </div>
                }
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{employee.name}</p>
                <p className="text-xs text-gray-500 font-mono">{employee.employeeCode}</p>
                <p className="text-xs text-gray-500">Joined {formatDate(employee.joiningDate)}</p>
              </div>
            </div>

            <p className="text-center text-[10px] font-bold text-red-500 uppercase tracking-wider">⚠ This action cannot be undone</p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleDeactivate}
              className="flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <UserX size={14} /> Deactivate
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
