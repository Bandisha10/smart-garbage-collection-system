"use client";

import { X, Eye, FileText, Check, XCircle, ChevronRight } from 'lucide-react';

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{value || "—"}</div>
    </div>
  );
}

export default function ViewRequestModal({ isOpen, onClose, requestData, onApprove, onReject }) {
  if (!isOpen) return null;

  const data = requestData || {
    panchayatName: 'Varca Panchayat',
    submittedDate: 'Jan 02, 2026',
    inchargePerson: 'Mr. Suresh Kamat',
    location: 'Village Panchayat Varca, Fatrade, Varca, Goa 403721',
    estHouseholds: '10,200',
    estLabours: '50',
    phoneNumber: '9876543224',
    emailAddress: 'varca@gov.com',
    website: '-',
    documents: [
      { id: 1, name: 'Incharge Person ID Proof', type: 'pdf' },
      { id: 2, name: 'Panchayat Registration Letter', type: 'pdf' },
    ],
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 25px 80px rgba(0,0,0,0.22)", width:"100%", maxWidth:860, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", fontFamily:"Inter, sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"22px 28px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"white" }}>{data.panchayatName}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>
              Registration request · Submitted {data.submittedDate}
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <X size={17} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>

            {/* Left — Details */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* General Info */}
              <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #6366f1", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>General Information</div>
                </div>
                <div style={{ padding:"18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 24px" }}>
                  <InfoBlock label="Panchayat Name" value={data.panchayatName} />
                  <InfoBlock label="Incharge Person" value={data.inchargePerson} />
                  <div style={{ gridColumn:"1/-1" }}><InfoBlock label="Location / Address" value={data.location} /></div>
                </div>
              </div>

              {/* Capacity */}
              <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #10b981" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Capacity & Estimates</div>
                </div>
                <div style={{ padding:"18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 24px" }}>
                  <InfoBlock label="Est. Households"   value={data.estHouseholds} />
                  <InfoBlock label="Est. Labourers"    value={data.estLabours} />
                </div>
              </div>

              {/* Contact */}
              <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #f59e0b" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Contact Details</div>
                </div>
                <div style={{ padding:"18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 24px" }}>
                  <InfoBlock label="Phone Number"  value={data.phoneNumber} />
                  <InfoBlock label="Email Address" value={data.emailAddress} />
                  <div style={{ gridColumn:"1/-1" }}><InfoBlock label="Website" value={data.website} /></div>
                </div>
              </div>

              {/* Documents */}
              <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #8b5cf6" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Submitted Documents</div>
                </div>
                <div style={{ padding:"12px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                  {data.documents.map(doc => (
                    <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"white", borderRadius:10, border:"1px solid #f1f5f9" }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:"rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <FileText size={16} color="#6366f1" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{doc.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.4px", marginTop:2 }}>{doc.type} file</div>
                      </div>
                      <button style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, color:"#6366f1", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        <Eye size={13} /> View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Decision Panel */}
            <div>
              <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden", position:"sticky", top:0 }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #0f172a" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Admin Decision</div>
                  <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Approve or reject this request</div>
                </div>
                <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:10 }}>
                  <button onClick={() => { onReject?.(data._id); onClose(); }}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", borderRadius:10, background:"#fef2f2", color:"#dc2626", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", border:"1.5px solid #fecaca" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fee2e2"}
                    onMouseLeave={e => e.currentTarget.style.background="#fef2f2"}>
                    <XCircle size={18} /> Reject
                  </button>
                  <button onClick={() => { onApprove?.(data._id); onClose(); }}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", border:"none", borderRadius:10, background:"linear-gradient(135deg,#10b981,#059669)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}
                    onMouseEnter={e => e.currentTarget.style.opacity="0.9"}
                    onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                    <Check size={18} /> Approve
                  </button>
                  <div style={{ padding:"12px 14px", background:"rgba(99,102,241,0.05)", borderRadius:10, border:"1px solid rgba(99,102,241,0.12)", marginTop:4 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#6366f1", marginBottom:5 }}>REVIEW CHECKLIST</div>
                    {["Verify ID proof authenticity", "Confirm address is valid", "Check registration letter seal"].map((item, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                        <div style={{ width:16, height:16, borderRadius:4, border:"1.5px solid #d1d5db", flexShrink:0 }} />
                        <span style={{ fontSize:12, color:"#374151" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:"14px 28px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onClose}
            style={{ padding:"10px 22px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
