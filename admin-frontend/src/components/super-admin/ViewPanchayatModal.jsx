"use client";

import { X, Check, XCircle, User, MapPin, Phone, Mail, Home, Users, FileText, ExternalLink } from "lucide-react";

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{value || "—"}</div>
    </div>
  );
}

function DocCard({ title, file, baseURL }) {
  if (!file) return (
    <div style={{ padding:"16px", borderRadius:12, border:"1.5px dashed #e2e8f0", textAlign:"center", color:"#94a3b8", fontSize:13 }}>
      <FileText size={22} style={{ margin:"0 auto 8px", color:"#cbd5e1" }} />
      Not uploaded
    </div>
  );
  const url = `${baseURL}/uploads/${file}`;
  if (file.endsWith(".pdf")) {
    return <iframe src={url} title={title} style={{ width:"100%", height:200, border:"1px solid #e2e8f0", borderRadius:10 }} />;
  }
  return (
    <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", position:"relative" }}>
      <img src={url} alt={title} style={{ width:"100%", maxHeight:200, objectFit:"contain", background:"#f8fafc" }} />
      <a href={url} target="_blank" rel="noreferrer"
        style={{ position:"absolute", top:8, right:8, width:32, height:32, borderRadius:8, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <ExternalLink size={14} color="white" />
      </a>
    </div>
  );
}

export default function ViewPanchayatModal({ isOpen, onClose, data, onApprove, onReject }) {
  if (!isOpen || !data) return null;
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:8000";
  const isPending = data.status === "pending";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 25px 80px rgba(0,0,0,0.22)", width:"100%", maxWidth:720, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", fontFamily:"Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"22px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"white" }}>{data.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>
              Submitted on {data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" }) : "—"}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Status badge */}
            <div style={{ padding:"5px 14px", borderRadius:20, background: isPending ? "rgba(245,158,11,0.15)" : data.status==="active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border:`1px solid ${isPending ? "rgba(245,158,11,0.35)" : data.status==="active" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}` }}>
              <span style={{ fontSize:12, fontWeight:700, color: isPending ? "#fbbf24" : data.status==="active" ? "#34d399" : "#f87171" }}>
                {isPending ? "Pending" : data.status==="active" ? "Verified" : "Rejected"}
              </span>
            </div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <X size={17} color="rgba(255,255,255,0.7)" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {/* Info grid */}
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14 }}>Panchayat Information</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"16px 24px", padding:"20px", background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", marginBottom:20 }}>
            <InfoItem label="Panchayat Name" value={data.name} />
            <InfoItem label="Incharge Person" value={data.inchargeName} />
            <div style={{ gridColumn:"1/-1" }}><InfoItem label="Address" value={data.address} /></div>
            <InfoItem label="Phone" value={data.contactPhone} />
            <InfoItem label="Email" value={data.contactEmail} />
            <InfoItem label="Est. Households" value={data.estHouseholds} />
            <InfoItem label="Est. Labourers" value={data.estLabours} />
          </div>

          {/* Documents */}
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14 }}>Submitted Documents</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 }}>Incharge ID Proof</div>
              <DocCard title="Incharge ID Proof" file={data.documents?.inchargeIdProof} baseURL={baseURL} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 }}>Registration Letter</div>
              <DocCard title="Registration Letter" file={data.documents?.registrationLetter} baseURL={baseURL} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0, background:"white" }}>
          <button onClick={onClose}
            style={{ padding:"11px 22px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Close
          </button>
          {isPending && (
            <>
              <button onClick={() => onReject(data._id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:10, background:"#fef2f2", color:"#dc2626", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", border:"1.5px solid #fecaca" }}>
                <XCircle size={15} /> Reject
              </button>
              <button onClick={() => onApprove(data._id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>
                <Check size={15} /> Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
