"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Check, X, Filter } from "lucide-react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import ViewPanchayatModal from "./ViewPanchayatModal";

function StatusBadge({ status }) {
  const map = {
    Verified: { bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
    Pending:  { bg:"#fffbeb", color:"#d97706", border:"#fde68a" },
    Rejected: { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>
      {status}
    </span>
  );
}

const TH = ({ children }) => (
  <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", background:"#f8fafc", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

export default function VerificationTable({ refreshKey, onChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => { fetchPanchayats(); }, [refreshKey]);

  const fetchPanchayats = async () => {
    setLoading(true);
    try {
      await api.get("/company/dashboard");
      const resList = await api.get("/panchayat?status=pending");
      setRows(resList.data);
    } catch {
      toast.error("Failed to load panchayats");
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (s) => ({ pending:"Pending", active:"Verified", rejected:"Rejected" }[s] || s);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/panchayat/${id}/approve`);
      toast.success("Panchayat approved ✓");
      setViewOpen(false); fetchPanchayats(); onChange?.();
    } catch (err) { toast.error("Approval failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/panchayat/${id}/reject`);
      toast.success("Panchayat rejected");
      setViewOpen(false); fetchPanchayats(); onChange?.();
    } catch (err) { toast.error("Rejection failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleViewClick = async (row) => {
    try {
      const res = await api.get(`/panchayat/${row._id}`);
      setViewData(res.data); setViewOpen(true);
    } catch { toast.error("Failed to load details"); }
  };

  const filtered = rows.filter(r =>
    r.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    r.address?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      {/* Search bar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, padding:"16px 0 12px" }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input
            type="text" placeholder="Search panchayat name or address…"
            value={searchValue} onChange={e => setSearchValue(e.target.value)}
            style={{ width:"100%", paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", background:"#f8fafc" }}
            onFocus={e => e.target.style.borderColor="#6366f1"}
            onBlur={e => e.target.style.borderColor="#e2e8f0"}
          />
        </div>
        <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"white", fontSize:13, color:"#374151", cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}>
          <Filter size={15} color="#94a3b8" /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              <TH>Panchayat Name</TH>
              <TH>Address</TH>
              <TH>Submitted</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length:4}).map((_,i) => (
                <tr key={i}>
                  {Array.from({length:5}).map((_,j) => (
                    <td key={j} style={{ padding:"14px 16px" }}>
                      <div style={{ height:14, background:"#f1f5f9", borderRadius:6, animation:"pulse 1.5s ease-in-out infinite", width: j===4?"100px":"100%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ padding:"40px 16px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No pending verification requests</td></tr>
            ) : filtered.map(row => {
              const uiStatus = normalizeStatus(row.status);
              return (
                <tr key={row._id} style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, color:"#0f172a" }}>{row.name}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#64748b" }}>{row.address || "—"}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#64748b" }}>{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding:"14px 16px" }}><StatusBadge status={uiStatus} /></td>
                  <td style={{ padding:"14px 16px" }}>
                    {uiStatus === "Pending" ? (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        <button onClick={() => handleViewClick(row)} title="View details"
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, color:"#6366f1", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => handleApprove(row._id)} title="Approve"
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, color:"#10b981", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          <Check size={13} /> Approve
                        </button>
                        <button onClick={() => handleReject(row._id)} title="Reject"
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          <X size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleViewClick(row)}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        <Eye size={13} /> Details
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ViewPanchayatModal isOpen={viewOpen} onClose={() => setViewOpen(false)} data={viewData} onApprove={handleApprove} onReject={handleReject} />
    </>
  );
}
