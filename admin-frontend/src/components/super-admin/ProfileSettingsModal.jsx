"use client";

import { useEffect, useState } from "react";
import api from "../../api/axios";
import { X, Building2, Phone, Mail, MapPin, Calendar, Shield } from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
        <Icon size={16} color="#6366f1" />
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function ProfileSettingsModal({ open, onClose }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get("/company/profile")
      .then(r => setCompany(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 25px 80px rgba(0,0,0,0.2)", width:"100%", maxWidth:480, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow:"hidden", fontFamily:"Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"24px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:20, color:"white" }}>S</div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"white" }}>Super Admin</div>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                <Shield size={11} color="#818cf8" />
                <span style={{ fontSize:11, color:"#818cf8", fontWeight:600 }}>Full Access</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <X size={17} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"8px 24px 24px", overflowY: "auto", flexGrow: 1 }}>
          <div style={{ padding:"12px 0", fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.8px" }}>Company Details</div>

          {loading ? (
            <div>
              {Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#f1f5f9" }} />
                  <div style={{ flex:1 }}>
                    <div style={{ height:10, background:"#f1f5f9", borderRadius:4, width:"30%", marginBottom:8 }} />
                    <div style={{ height:14, background:"#f1f5f9", borderRadius:4, width:"60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <InfoRow icon={Building2} label="Company Name"  value={company?.name} />
              <InfoRow icon={Mail}      label="Email"         value={company?.email} />
              <InfoRow icon={Phone}     label="Phone"         value={company?.phone} />
              <InfoRow icon={MapPin}    label="Address"       value={company?.address} />
              <InfoRow icon={Calendar}  label="Registered On" value={company?.createdAt ? new Date(company.createdAt).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : "—"} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end", flexShrink: 0, background: "white" }}>
          <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
            onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background="white"}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
