"use client";

import { useState } from "react";
import { X, Building2, User, MapPin, Home, Users, Phone, Mail, Globe, Upload, FileText, Plus } from "lucide-react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const SECTIONS = [
  { id: "general",  label: "General Info",        icon: Building2 },
  { id: "capacity", label: "Capacity & Estimates", icon: Users     },
  { id: "contact",  label: "Contact Details",      icon: Phone     },
];

function FieldLabel({ children, required }) {
  return (
    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.4px" }}>
      {children}{required && <span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
    </label>
  );
}

function Input({ icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      {Icon && <Icon size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color: focused ? "#6366f1" : "#94a3b8", transition:"color 0.15s" }} />}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{ width:"100%", paddingLeft: Icon ? 38 : 14, paddingRight:14, paddingTop:10, paddingBottom:10, border:`1.5px solid ${focused ? "#6366f1" : "#e2e8f0"}`, borderRadius:10, fontSize:13, color:"#0f172a", fontFamily:"inherit", outline:"none", transition:"border-color 0.15s", background:"white", ...props.style }}
      />
    </div>
  );
}

function TextArea({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${focused ? "#6366f1" : "#e2e8f0"}`, borderRadius:10, fontSize:13, color:"#0f172a", fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:80, transition:"border-color 0.15s", ...props.style }}
    />
  );
}

function Select({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${focused ? "#6366f1" : "#e2e8f0"}`, borderRadius:10, fontSize:13, color: props.value ? "#0f172a" : "#94a3b8", fontFamily:"inherit", outline:"none", background:"white", transition:"border-color 0.15s", cursor:"pointer" }}
    />
  );
}

function FileUpload({ id, label, value, onChange, accept }) {
  return (
    <div>
      <input type="file" id={id} onChange={onChange} accept={accept} style={{ display:"none" }} />
      <label htmlFor={id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", border:"1.5px dashed #e2e8f0", borderRadius:10, cursor:"pointer", background:"#f8fafc", transition:"all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor="#6366f1"; e.currentTarget.style.background="rgba(99,102,241,0.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}>
        {value ? (
          <>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(99,102,241,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FileText size={15} color="#6366f1" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value.name}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{(value.size / 1024).toFixed(1)} KB — click to change</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Upload size={15} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#6366f1" }}>{label}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>PDF, JPG, PNG up to 5 MB</div>
            </div>
          </>
        )}
      </label>
    </div>
  );
}

const EMPTY = { panchayatName:"", location:"", inchargePerson:"", inchargeIdProof:null, registrationLetter:null, estHouseholds:"", estLabours:"", phoneNumber:"", emailAddress:"", website:"" };

export default function AddPanchayatModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (name, value) => { setFormData(p => ({ ...p, [name]: value })); setErrors(prev => ({ ...prev, [name]: '' })); };
  const handleInput = e => set(e.target.name, e.target.value);
  const handleFile = (e, field) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowedDocTypes = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedDocTypes.includes(f.type)) {
      toast.error('Only PDF, JPG, PNG, DOC or DOCX files are accepted.');
      e.target.value = '';
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB.');
      e.target.value = '';
      return;
    }
    set(field, f);
  };

  const handleAddSave = async () => {
    if (loading) return;
    // Validate all required fields
    const newErrors = {};
    if (!formData.panchayatName.trim()) {
      newErrors.panchayatName = 'Panchayat name is required.';
    } else if (formData.panchayatName.trim().length < 3) {
      newErrors.panchayatName = 'Name must be at least 3 characters.';
    }
    if (!formData.inchargePerson.trim()) {
      newErrors.inchargePerson = 'Incharge person name is required.';
    } else if (!/^[a-zA-Z\s.'`-]+$/.test(formData.inchargePerson.trim())) {
      newErrors.inchargePerson = 'Name can only contain letters and spaces.';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location/address is required.';
    } else if (formData.location.trim().length < 10) {
      newErrors.location = 'Please enter a full address (min 10 characters).';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid 10-digit Indian phone number.';
    }
    if (formData.emailAddress.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      newErrors.emailAddress = 'Enter a valid email address.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Navigate to the first tab with errors
      if (newErrors.panchayatName || newErrors.inchargePerson || newErrors.location) {
        setActiveSection('general');
      } else if (newErrors.phoneNumber || newErrors.emailAddress) {
        setActiveSection('contact');
      }
      toast.error('Please fix the errors in the form');
      return;
    }
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("name", formData.panchayatName);
      payload.append("address", formData.location);
      payload.append("inchargeName", formData.inchargePerson);
      payload.append("phone", formData.phoneNumber);
      payload.append("email", formData.emailAddress);
      payload.append("website", formData.website);
      payload.append("estHouseholds", formData.estHouseholds);
      payload.append("estLabours", formData.estLabours);
      if (formData.inchargeIdProof) payload.append("inchargeIdProof", formData.inchargeIdProof);
      if (formData.registrationLetter) payload.append("registrationLetter", formData.registrationLetter);
      await api.post("/panchayat/register", payload);
      toast.success("Panchayat submitted for approval ✓");
      setFormData(EMPTY); setActiveSection("general");
      onSuccess?.(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add panchayat");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 25px 80px rgba(0,0,0,0.22)", width:"100%", maxWidth:680, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", fontFamily:"Inter, sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"22px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 15px rgba(99,102,241,0.4)" }}>
              <Plus size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:"white" }}>Add New Panchayat</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Register and submit for approval</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <X size={17} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* ── Section tabs ── */}
        <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", background:"#f8fafc", flexShrink:0 }}>
          {SECTIONS.map(s => {
            const active = activeSection === s.id;
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"13px 8px", border:"none", background:"none", cursor:"pointer", borderBottom:`2px solid ${active ? "#6366f1" : "transparent"}`, color: active ? "#6366f1" : "#94a3b8", fontWeight: active ? 700 : 500, fontSize:12, transition:"all 0.15s", fontFamily:"inherit" }}>
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Form body ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {activeSection === "general" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <FieldLabel required>Panchayat Name</FieldLabel>
                  <Input icon={Building2} name="panchayatName" placeholder="e.g. Navelim Panchayat" value={formData.panchayatName} onChange={handleInput} style={errors.panchayatName ? {borderColor:'#ef4444'} : {}} />
                  {errors.panchayatName && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>{errors.panchayatName}</p>}
                </div>
                <div>
                  <FieldLabel required>Incharge Person</FieldLabel>
                  <Input icon={User} name="inchargePerson" placeholder="Full name" value={formData.inchargePerson} onChange={handleInput} style={errors.inchargePerson ? {borderColor:'#ef4444'} : {}} />
                  {errors.inchargePerson && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>{errors.inchargePerson}</p>}
                </div>
              </div>
              <div>
                <FieldLabel required>Location / Address</FieldLabel>
                <TextArea name="location" placeholder="Full address of the panchayat…" rows={3} value={formData.location} onChange={handleInput} style={errors.location ? {borderColor:'#ef4444'} : {}} />
                {errors.location && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>{errors.location}</p>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <FieldLabel>Incharge ID Proof</FieldLabel>
                  <FileUpload id="idProofInput" label="Upload ID Proof" value={formData.inchargeIdProof} onChange={e => handleFile(e, "inchargeIdProof")} accept="image/*,.pdf,.doc,.docx" />
                </div>
                <div>
                  <FieldLabel>Registration Letter</FieldLabel>
                  <FileUpload id="registrationInput" label="Upload Letter" value={formData.registrationLetter} onChange={e => handleFile(e, "registrationLetter")} accept="image/*,.pdf,.doc,.docx" />
                </div>
              </div>
            </div>
          )}

          {activeSection === "capacity" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
              <div>
                <FieldLabel>Est. Households</FieldLabel>
                <select name="estHouseholds" value={formData.estHouseholds} onChange={handleInput}
                  style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color: formData.estHouseholds ? "#0f172a":"#94a3b8", fontFamily:"inherit", outline:"none", background:"white", cursor:"pointer" }}>
                  <option value="">Select range</option>
                  <option value="0-100">0 – 100</option>
                  <option value="100-500">100 – 500</option>
                  <option value="500-1000">500 – 1,000</option>
                  <option value="1000+">1,000+</option>
                </select>
              </div>
              <div>
                <FieldLabel>Est. Labourers</FieldLabel>
                <select name="estLabours" value={formData.estLabours} onChange={handleInput}
                  style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color: formData.estLabours ? "#0f172a":"#94a3b8", fontFamily:"inherit", outline:"none", background:"white", cursor:"pointer" }}>
                  <option value="">Select range</option>
                  <option value="1-5">1 – 5</option>
                  <option value="5-10">5 – 10</option>
                  <option value="10-20">10 – 20</option>
                  <option value="20+">20+</option>
                </select>
              </div>
              {/* Capacity info card */}
              <div style={{ gridColumn:"1/-1", padding:"16px", background:"rgba(99,102,241,0.05)", border:"1.5px solid rgba(99,102,241,0.15)", borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", marginBottom:6 }}>ℹ️ Plan Recommendation</div>
                <div style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>
                  Based on household count, we recommend: {formData.estHouseholds === "0-100" ? <b>Basic</b> : formData.estHouseholds === "100-500" || formData.estHouseholds === "500-1000" ? <b>Standard</b> : formData.estHouseholds === "1000+" ? <b>Premium</b> : "select a range above"}.
                </div>
              </div>
            </div>
          )}

          {activeSection === "contact" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <Input icon={Phone} type="tel" name="phoneNumber" placeholder="+91 XXXXX XXXXX" value={formData.phoneNumber} onChange={handleInput} style={errors.phoneNumber ? {borderColor:'#ef4444'} : {}} />
                  {errors.phoneNumber && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>{errors.phoneNumber}</p>}
                </div>
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input icon={Mail} type="email" name="emailAddress" placeholder="name@gov.in" value={formData.emailAddress} onChange={handleInput} style={errors.emailAddress ? {borderColor:'#ef4444'} : {}} />
                  {errors.emailAddress && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>{errors.emailAddress}</p>}
                </div>
              </div>
              <div>
                <FieldLabel>Website <span style={{ color:"#94a3b8", fontWeight:400, textTransform:"none" }}>(optional)</span></FieldLabel>
                <Input icon={Globe} type="url" name="website" placeholder="https://panchayat.gov.in" value={formData.website} onChange={handleInput} />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          {/* Step dots */}
          <div style={{ display:"flex", gap:6 }}>
            {SECTIONS.map(s => (
              <div key={s.id} style={{ width: activeSection===s.id ? 20 : 8, height:8, borderRadius:4, background: activeSection===s.id ? "#6366f1" : "#e2e8f0", transition:"all 0.2s" }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} disabled={loading}
              style={{ padding:"11px 22px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", opacity: loading ? 0.5 : 1 }}>
              Cancel
            </button>
            {activeSection !== "general" && (
              <button onClick={() => setActiveSection(activeSection === "contact" ? "capacity" : "general")}
                style={{ padding:"11px 22px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                ← Back
              </button>
            )}
            {activeSection !== "contact" ? (
              <button onClick={() => setActiveSection(activeSection === "general" ? "capacity" : "contact")}
                style={{ padding:"11px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleAddSave} disabled={loading}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:10, border:"none", background: loading ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", fontWeight:700, fontSize:13, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: loading ? "none" : "0 4px 12px rgba(99,102,241,0.3)" }}>
                {loading ? (
                  <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%" }} className="spinner" /> Saving…</>
                ) : <><Plus size={15} /> Add & Submit</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
