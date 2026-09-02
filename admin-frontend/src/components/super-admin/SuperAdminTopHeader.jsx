"use client";

import { Search, Bell, LogOut, Settings, Shield, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProfileSettingsModal from './ProfileSettingsModal';
import api from '../../api/axios';
import LogoutConfirmation from './LogoutConfirmation';

const PAGE_LABELS = {
  '/super-admin/dashboard':     { title: 'Panchayat Verification', sub: 'Review and manage registration requests' },
  '/super-admin/subscriptions': { title: 'Subscription Plans',     sub: 'Manage plan tiers and active subscriptions' },
  '/super-admin/payments':      { title: 'Payment Monitoring',     sub: 'Track transactions and payment status' },
  '/super-admin/support':       { title: 'Support & Queries',      sub: 'Handle tickets and resolve panchayat issues' },
};

export default function SuperAdminTopHeader({ onMenuClick }) {
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const page = PAGE_LABELS[pathname] || { title: 'EcoSyz Super Admin', sub: '' };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutConfirm = async () => {
    try { await api.post("/auth/logout"); } catch (err) { /* ignore network error on logout */ }
    if (typeof window !== "undefined") {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      router.push('/');
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 md:px-7 flex items-center h-[68px] shrink-0 gap-3 md:gap-5">
      
      {/* Mobile Menu Toggle */}
      {onMenuClick && (
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] md:text-[17px] font-bold text-slate-900 leading-[1.2] truncate">{page.title}</div>
        <div className="hidden md:block text-[12px] text-slate-400 mt-[1px] truncate">{page.sub}</div>
      </div>

      {/* Search */}
      <div className="relative hidden md:block w-[280px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search panchayats, tickets…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 border-[1.5px] border-slate-200 rounded-xl text-[13px] text-slate-700 outline-none bg-slate-50 font-sans focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Avatar dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2.5 p-1.5 md:pr-2.5 rounded-xl border-[1.5px] border-slate-200 cursor-pointer transition-colors ${isDropdownOpen ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px] text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>S</div>
          <div className="text-left hidden md:block">
            <div className="text-[13px] font-semibold text-slate-900 leading-tight">Super Admin</div>
            <div className="text-[11px] text-slate-400 leading-tight">ecosyz.in</div>
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50">
            {/* User info */}
            <div className="p-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center font-extrabold text-[16px] text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>S</div>
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Super Admin</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield size={10} className="text-indigo-500" />
                    <span className="text-[11px] text-indigo-500 font-semibold">Full Access</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <button
                onClick={() => { setIsDropdownOpen(false); setOpenProfile(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-none bg-transparent cursor-pointer text-[13px] font-medium text-slate-700 font-sans hover:bg-slate-50 transition-colors"
              >
                <Settings size={16} className="text-slate-500" />
                Profile Settings
              </button>
              <button
                onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-none bg-transparent cursor-pointer text-[13px] font-medium text-red-500 font-sans hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileSettingsModal open={openProfile} onClose={() => setOpenProfile(false)} />
      <LogoutConfirmation isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onLogout={handleLogoutConfirm} />
    </div>
  );
}
