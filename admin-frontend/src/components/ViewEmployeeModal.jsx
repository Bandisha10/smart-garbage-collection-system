"use client";

import { useEffect } from "react"
import { X, Download, Image as ImageIcon, Edit, UserX, CheckCircle } from "lucide-react"

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "https://smartgarbageserver.kamsoft.co.in/api"
const STATIC_BASE = RAW_API_BASE.replace(/\/api$/, "")
const isImage = (path = "") => /\.(jpg|jpeg|png|webp)$/i.test(path)

const InfoField = ({ label, value, mono }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono text-teal-600' : ''}`}>{value || '—'}</p>
  </div>
)

export default function ViewEmployeeModal({ isOpen, onClose, employee, onEdit, onDeactivate, onActivate }) {
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null

  const { name, employeeCode, phone, address, role, ward, wards = [], joiningDate, documents = {} } = employee
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : "-"

  const openFile = (path) => {
    if (!path) return
    window.open(`${STATIC_BASE}/${path}`, "_blank")
  }

  const isActive = employee?.status === "active"

  return (
    <>
      <div className="fixed inset-0 modal-overlay bg-black/50 backdrop-blur-sm z-[9999]" onClick={onClose} />
      <div className="fixed inset-0 modal-overlay z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 animate-fade-in-up overflow-hidden max-h-[92vh] flex flex-col">

          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1f9e9a, #16847f)' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg text-white flex-shrink-0">
                {name?.charAt(0)}
              </div>
              <div>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Employee Profile</p>
                <h2 className="text-white font-bold">{name}</h2>
                <p className="text-white/70 text-xs">{role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Information</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                    <InfoField label="Employee Code" value={employeeCode} mono />
                    <InfoField label="Contact" value={phone} />
                    <InfoField label="Joining Date" value={formatDate(joiningDate)} />
                    <InfoField label="Address" value={address} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Assignment</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                    <InfoField label="Role" value={role} />
                    <InfoField label="Ward(s)" value={wards.length > 0 ? wards.join(", ") : ward} />
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Photo & Documents</p>
                  <div className="h-44 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center mb-3">
                    {documents.photo && isImage(documents.photo) ? (
                      <img src={`${STATIC_BASE}/${documents.photo}`} className="w-full h-full object-cover" alt="Employee"
                        onError={(e) => { e.currentTarget.style.display = "none" }} />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <ImageIcon size={36} />
                        <span className="text-xs mt-2 font-medium">No photo</span>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  {[
                    { label: 'ID Proof', path: documents.idProof },
                    ...(role === 'Driver' ? [{ label: 'Driving License', path: documents.license }] : [])
                  ].map(({ label, path }) => (
                    <div key={label} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-2">
                      <span className="flex-1 text-xs font-semibold text-gray-600 truncate">
                        {label}: <span className="text-gray-400 font-normal">{path ? path.split("/").pop() : "Not uploaded"}</span>
                      </span>
                      {path && (
                        <button onClick={() => openFile(path)}
                          className="text-teal-500 hover:text-teal-700 transition-colors">
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex justify-end gap-3 flex-shrink-0">
            {isActive ? (
              <button onClick={onDeactivate}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                <UserX size={14} /> Deactivate
              </button>
            ) : (
              <button onClick={onActivate}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                <CheckCircle size={14} /> Activate
              </button>
            )}
            <button onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #1f9e9a, #16847f)' }}>
              <Edit size={14} /> Edit Employee
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
