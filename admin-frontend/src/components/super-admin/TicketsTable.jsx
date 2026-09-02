"use client";

import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import TicketDetailsModal from './TicketDetailsModal';

const statusConfig = {
  Open:        { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
  'In Progress':{ bg:"#fffbeb", color:"#d97706", border:"#fde68a" },
  Resolved:    { bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
};

const TH = ({ children }) => (
  <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", background:"#f8fafc", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved'];

export default function TicketsTable({ ticketData, selectedFilter, onFilterChange }) {
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const filtered = (ticketData || []).filter(r =>
    (r.ticketId?.toLowerCase().includes(search.toLowerCase()) || r.panchayatName?.toLowerCase().includes(search.toLowerCase())) &&
    (selectedFilter === 'All' || r.status === selectedFilter)
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, paddingTop:16, paddingBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input type="text" placeholder="Search ticket ID or panchayat…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", background:"#f8fafc" }}
            onFocus={e => e.target.style.borderColor="#6366f1"} onBlur={e => e.target.style.borderColor="#e2e8f0"}
          />
        </div>
        {FILTERS.map(f => {
          const isActive = selectedFilter === f;
          const s = statusConfig[f] || {};
          return (
            <button key={f} onClick={() => onFilterChange(f)}
              style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid", borderColor: isActive ? (s.border || "#6366f1") : "#e2e8f0", background: isActive ? (s.bg || "rgba(99,102,241,0.08)") : "white", color: isActive ? (s.color || "#6366f1") : "#374151", fontSize:13, fontWeight: isActive ? 700 : 500, cursor:"pointer", fontFamily:"inherit" }}>
              {f}
            </button>
          );
        })}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              <TH>Ticket ID</TH><TH>Panchayat</TH><TH>Issue Type</TH><TH>Created</TH><TH>Status</TH><TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ padding:"40px 16px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No tickets found</td></tr>
            ) : filtered.map(row => {
              const st = statusConfig[row.status] || statusConfig.Open;
              return (
                <tr key={row.id || row.ticketId} style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"14px 16px", fontSize:13, fontWeight:700, color:"#6366f1", fontFamily:"monospace" }}>{row.ticketId}</td>
                  <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, color:"#0f172a" }}>{row.panchayatName}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#64748b" }}>{row.issueType}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#64748b" }}>{row.createdDate}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{row.status}</span>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <button 
                      onClick={() => setSelectedTicket(row)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                      onMouseEnter={e => { e.currentTarget.style.background="#6366f1"; e.currentTarget.style.color="white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#64748b"; }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TicketDetailsModal 
        open={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        ticket={selectedTicket} 
      />
    </div>
  );
}
