"use client";

import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import TicketOverviewCard from '../../components/super-admin/TicketOverviewCard';
import TicketsTable from '../../components/super-admin/TicketsTable';
import api from '../../api/axios';

export default function SupportQueries() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/company/tickets');
      if (res.data) {
        setStats(res.data.stats || { open: 0, inProgress: 0, resolved: 0 });
        setTicketData(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const overviewStats = [
    { id: 1, title: 'Open Tickets',  count: String(stats.open ?? 0),       description: 'Needs immediate attention', icon: 'open'     },
    { id: 2, title: 'In Progress',   count: String(stats.inProgress ?? 0), description: 'Currently being handled',   icon: 'progress' },
    { id: 3, title: 'Solved',        count: String(stats.resolved ?? 0),   description: 'Successfully closed',        icon: 'solved'   },
  ];

  return (
    <SuperAdminLayout>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {overviewStats.map(s => <TicketOverviewCard key={s.id} stat={s} />)}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100">
          <div className="text-[16px] font-bold text-slate-900">Support Tickets</div>
          <div className="text-[13px] text-slate-400 mt-1">Manage queries raised by panchayats</div>
        </div>
        <div className="p-0 md:px-6 md:pb-6 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading support tickets…</div>
          ) : (
            <TicketsTable ticketData={ticketData} selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
