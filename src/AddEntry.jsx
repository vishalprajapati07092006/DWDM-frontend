import React, { useState } from 'react';
import axios from 'axios';
import {
  Plus, CheckCircle2, AlertTriangle, ArrowLeft, Database, User,
  ShieldCheck, Droplet, Brain, RotateCcw, Send, Activity,
  MapPin, Heart, Calendar, Sparkles
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://dwdm-backend-oavt.onrender.com') + '/api';

/* ================= Design tokens (identical to App.jsx) ================= */
const T = {
  bgApp: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e2e8f0',
  borderSoft: '#eef2f7',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  blue: '#2563eb',
  green: '#059669',
  red: '#dc2626',
  amber: '#d97706',
  purple: '#9333ea',
  cyan: '#0ea5e9',
  radius: 16,
  radiusSm: 10,
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
  shadowHover: '0 2px 4px rgba(15,23,42,0.05), 0 16px 40px -12px rgba(15,23,42,0.14)',
  font: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

/* ================= Options ================= */
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const REGIONS = ['Americas', 'Europe', 'Asia', 'Africa', 'MENA', 'Oceania'];
const SITES = ['hospital', 'mobile_unit', 'community_camp'];
const SEXES = ['M', 'F'];
const ELIGIBILITY_STATUSES = ['eligible', 'temporary_deferral', 'permanent_deferral'];

const initialForm = {
  donor_id: '',
  age: '',
  sex: 'M',
  country_code: '',
  region: 'Asia',
  blood_type: 'A+',
  is_rare_type: 0,
  smoker: 0,
  bmi: '',
  chronic_condition_flag: 0,
  eligible_to_donate: 1,
  deferral_reason: '',
  eligibility_status: 'eligible',
  preferred_site: 'hospital',
  donation_count_last_12m: 0,
  is_regular_donor: 0,
  years_since_first_donation: 0,
  lifetime_donation_count: 1,
  first_donation_year: new Date().getFullYear(),
  last_donation_date: new Date().toISOString().slice(0, 10),
  recency_days: 0,
  donor_age_at_first_donation: 18,
  blood_type_country_prevalence: 0,
  donation_propensity_score: 0,
  donated_next_6m: 0,
  next_6m_donation_count: 0,
};

/* ================= Reusable UI components (same style as App.jsx) ================= */
function SectionCard({ children, accent = T.blue, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: T.surface,
        borderRadius: T.radius,
        padding: '24px',
        border: `1px solid ${T.border}`,
        boxShadow: hovered ? T.shadowHover : T.shadow,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${accent} 0%, ${accent}88 60%, transparent 100%)`,
        opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function IconBadge({ children, color = T.blue, bg = '#eff6ff' }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${bg} 0%, ${color}18 100%)`,
      padding: '10px',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${color}22`,
      boxShadow: `0 4px 12px -6px ${color}55`,
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, color, bg, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <IconBadge color={color} bg={bg}>{icon}</IconBadge>
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: T.text, letterSpacing: '-0.2px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '10px', fontWeight: 800,
        color: T.textMuted, marginBottom: '5px',
        letterSpacing: '0.5px', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: '10.5px', color: T.textFaint, marginTop: '4px' }}>{hint}</div>}
    </div>
  );
}

function Input({ focused, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        backgroundColor: focused ? '#ffffff' : T.surfaceAlt,
        color: T.text,
        border: `1px solid ${focused ? T.blue : '#cbd5e1'}`,
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '13px',
        fontWeight: 500,
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'all 0.15s ease',
        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 2px rgba(15,23,42,0.03)',
        ...props.style,
      }}
    />
  );
}

function Select({ focused, children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        backgroundColor: focused ? '#ffffff' : T.surfaceAlt,
        color: T.text,
        border: `1px solid ${focused ? T.blue : '#cbd5e1'}`,
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '13px',
        fontWeight: 500,
        boxSizing: 'border-box',
        outline: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 2px rgba(15,23,42,0.03)',
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

function Checkbox({ label, checked, onChange, color = T.blue }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      cursor: 'pointer', padding: '9px 12px',
      background: checked ? `${color}10` : T.surfaceAlt,
      border: `1px solid ${checked ? color + '55' : '#cbd5e1'}`,
      borderRadius: '8px',
      fontSize: '12.5px', fontWeight: 600, color: checked ? color : T.textMuted,
      transition: 'all 0.15s ease',
      userSelect: 'none',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: '14px', height: '14px', accentColor: color, cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}

/* ================= Main Component ================= */
export default function AddEntry({ onBack }) {
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const f = (name) => ({
    value: form[name],
    onChange: update(name),
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
    focused: focused === name,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);

    const numericFields = [
      'donor_id', 'age', 'bmi', 'is_rare_type', 'smoker', 'chronic_condition_flag',
      'eligible_to_donate', 'donation_count_last_12m', 'is_regular_donor',
      'years_since_first_donation', 'lifetime_donation_count', 'first_donation_year',
      'recency_days', 'donor_age_at_first_donation', 'blood_type_country_prevalence',
      'donation_propensity_score', 'donated_next_6m', 'next_6m_donation_count',
    ];
    const payload = { ...form };
    numericFields.forEach((k) => { payload[k] = Number(payload[k] || 0); });
    if (!payload.deferral_reason) payload.deferral_reason = null;

    try {
      const res = await axios.post(`${API_BASE}/donors`, payload,{
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
      setMsg({
        type: 'success',
        text: `Donor ${res.data.donor_id} added to warehouse · eligibility_id = ${res.data.eligibility_id}`,
      });
      setForm({ ...initialForm, donor_id: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const text = Array.isArray(detail)
        ? detail.map((d) => `${d.loc?.join('.')} — ${d.msg}`).join(' · ')
        : detail || err.message || 'Insert failed';
      setMsg({ type: 'error', text });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const filledFields = Object.values(form).filter((v) => v !== '' && v !== null).length;
  const totalFields = Object.keys(form).length;
  const progressPct = Math.round((filledFields / totalFields) * 100);

  return (
    <div style={{ background: T.bgApp, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      <main style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto' }}>

        {/* ============ Page header ============ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onBack}
              style={{
                background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: '10px',
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: T.text, fontSize: '13px', fontWeight: 700, boxShadow: T.shadow,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IconBadge color={T.red} bg="#fee2e2">
                <Heart size={22} fill={T.red} />
              </IconBadge>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                    Add Donor Entry
                  </h1>
                  <span style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    color: T.blue, border: '1px solid #bfdbfe',
                    fontSize: '10px', fontWeight: 800, padding: '3px 9px', borderRadius: '12px',
                    letterSpacing: '0.4px',
                  }}>
                    WAREHOUSE INSERT
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>
                  Writes to <code>dim_donor</code> · <code>dim_eligibility</code> · <code>fact_donations</code>
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid #bfdbfe', color: T.blue,
            padding: '8px 14px', borderRadius: '10px',
            fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
            boxShadow: T.shadow,
          }}>
            <Database size={14} /> POST /api/donors
          </div>
        </div>

        {/* ============ Alert banner ============ */}
        {msg.text && (
          <div style={{
            background: msg.type === 'success'
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', fontWeight: 600, lineHeight: 1.5,
            boxShadow: msg.type === 'success'
              ? '0 8px 24px -12px rgba(22,163,74,0.35)'
              : '0 8px 24px -12px rgba(220,38,38,0.35)',
            animation: 'slideDown 0.3s ease',
          }}>
            {msg.type === 'success'
              ? <CheckCircle2 size={20} />
              : <AlertTriangle size={20} />}
            <div>
              <div style={{ fontWeight: 800, letterSpacing: '0.2px' }}>
                {msg.type === 'success' ? 'Entry committed' : 'Save failed'}
              </div>
              <div style={{ fontWeight: 500, fontSize: '12.5px', opacity: 0.9 }}>{msg.text}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>

            {/* ============ LEFT COLUMN — form sections ============ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Section 1: Identity */}
              <SectionCard accent={T.blue}>
                <SectionHeader
                  icon={<User size={20} color={T.blue} />}
                  color={T.blue} bg="#eff6ff"
                  title="Donor Identity"
                  subtitle="Basic demographics stored in dim_donor"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Field label="Donor ID *">
                    <Input type="number" required {...f('donor_id')} placeholder="30001" />
                  </Field>
                  <Field label="Age *">
                    <Input type="number" min="18" max="100" required {...f('age')} placeholder="33" />
                  </Field>
                  <Field label="Sex *">
                    <Select {...f('sex')}>{SEXES.map(s => <option key={s}>{s}</option>)}</Select>
                  </Field>
                  <Field label="Country Code *" hint="ISO-2 (e.g. IN, US)">
                    <Input type="text" required {...f('country_code')} placeholder="IN" maxLength={3} />
                  </Field>
                  <Field label="Region *">
                    <Select {...f('region')}>{REGIONS.map(r => <option key={r}>{r}</option>)}</Select>
                  </Field>
                  <Field label="Blood Type *">
                    <Select {...f('blood_type')}>{BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}</Select>
                  </Field>
                  <Field label="BMI *">
                    <Input type="number" step="0.1" required {...f('bmi')} placeholder="24.9" />
                  </Field>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'flex-end', paddingTop: '20px' }}>
                    <Checkbox label="Rare blood type" checked={form.is_rare_type === 1} onChange={update('is_rare_type')} color={T.purple} />
                    <Checkbox label="Smoker" checked={form.smoker === 1} onChange={update('smoker')} color={T.red} />
                  </div>
                </div>
              </SectionCard>

              {/* Section 2: Eligibility */}
              <SectionCard accent={T.green}>
                <SectionHeader
                  icon={<ShieldCheck size={20} color={T.green} />}
                  color={T.green} bg="#ecfdf5"
                  title="Eligibility Assessment"
                  subtitle="Stored in dim_eligibility (deduplicated by status)"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Field label="Eligibility Status *">
                    <Select {...f('eligibility_status')}>
                      {ELIGIBILITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="Eligible to Donate *">
                    <Select value={form.eligible_to_donate} onChange={update('eligible_to_donate')}
                      onFocus={() => setFocused('eligible_to_donate')} onBlur={() => setFocused(null)}
                      focused={focused === 'eligible_to_donate'}>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </Select>
                  </Field>
                  <Field label="Deferral Reason" hint="Leave blank if eligible">
                    <Input type="text" {...f('deferral_reason')} placeholder="chronic_condition, bmi_out_of_range…" />
                  </Field>
                  <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Checkbox label="Chronic condition" checked={form.chronic_condition_flag === 1}
                      onChange={update('chronic_condition_flag')} color={T.red} />
                  </div>
                </div>
              </SectionCard>

              {/* Section 3: Donation History */}
              <SectionCard accent={T.amber}>
                <SectionHeader
                  icon={<Droplet size={20} color={T.amber} />}
                  color={T.amber} bg="#fffbeb"
                  title="Donation History & Site"
                  subtitle="Recency, loyalty, and site preference"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Field label="Preferred Site *">
                    <Select {...f('preferred_site')}>{SITES.map(s => <option key={s}>{s}</option>)}</Select>
                  </Field>
                  <Field label="First Donation Year *">
                    <Input type="number" min="1900" max="2100" required {...f('first_donation_year')} />
                  </Field>
                  <Field label="Last Donation Date *">
                    <Input type="date" required {...f('last_donation_date')} />
                  </Field>
                  <Field label="Recency Days *">
                    <Input type="number" min="0" required {...f('recency_days')} placeholder="90" />
                  </Field>
                  <Field label="Lifetime Donations *">
                    <Input type="number" min="1" required {...f('lifetime_donation_count')} placeholder="5" />
                  </Field>
                  <Field label="Donations (last 12m)">
                    <Input type="number" min="0" {...f('donation_count_last_12m')} />
                  </Field>
                  <Field label="Years Since 1st Donation">
                    <Input type="number" min="0" {...f('years_since_first_donation')} />
                  </Field>
                  <Field label="Age at 1st Donation *">
                    <Input type="number" min="0" required {...f('donor_age_at_first_donation')} />
                  </Field>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <Checkbox label="Regular donor" checked={form.is_regular_donor === 1}
                      onChange={update('is_regular_donor')} color={T.green} />
                  </div>
                </div>
              </SectionCard>

              {/* Section 4: ML & Warehouse */}
              <SectionCard accent={T.purple}>
                <SectionHeader
                  icon={<Brain size={20} color={T.purple} />}
                  color={T.purple} bg="#faf5ff"
                  title="Analytics & ML Inputs"
                  subtitle="Used by the clustering + classification models"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Field label="Blood-Type Prevalence" hint="0 – 1 (country frequency)">
                    <Input type="number" step="0.0001" min="0" max="1" {...f('blood_type_country_prevalence')} />
                  </Field>
                  <Field label="Propensity Score" hint="0 – 100 (composite from pipeline)">
                    <Input type="number" step="0.1" min="0" {...f('donation_propensity_score')} placeholder="45.0" />
                  </Field>
                  <Field label="Next-6m Donation Count">
                    <Input type="number" min="0" {...f('next_6m_donation_count')} />
                  </Field>
                  <div style={{ gridColumn: 'span 3' }}>
                    <Checkbox label="Donated in the next 6 months" checked={form.donated_next_6m === 1}
                      onChange={update('donated_next_6m')} color={T.purple} />
                  </div>
                </div>
              </SectionCard>

              {/* Action bar */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '12px',
                padding: '20px 24px',
                background: T.surface, borderRadius: T.radius,
                border: `1px solid ${T.border}`, boxShadow: T.shadow,
              }}>
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  style={{
                    padding: '12px 24px', borderRadius: '10px',
                    border: `1px solid ${T.border}`, background: '#ffffff',
                    color: T.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <RotateCcw size={15} /> Reset Form
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 28px', borderRadius: '10px', border: 'none',
                    background: loading
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 8px 20px -8px rgba(37,99,235,0.55)',
                    letterSpacing: '0.3px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(37,99,235,0.65)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(37,99,235,0.55)';
                  }}
                >
                  {loading ? <Activity size={16} /> : <Send size={16} />}
                  {loading ? 'Committing…' : 'Add Donor to Warehouse'}
                </button>
              </div>
            </div>

            {/* ============ RIGHT COLUMN — sticky preview ============ */}
            <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Progress card */}
              <SectionCard accent={T.cyan}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <IconBadge color={T.cyan} bg="#ecfeff">
                    <Sparkles size={18} color={T.cyan} />
                  </IconBadge>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: T.textMuted, letterSpacing: '0.5px' }}>
                      FORM COMPLETION
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: T.text }}>
                      {progressPct}%
                    </div>
                  </div>
                </div>
                <div style={{
                  height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${T.cyan} 0%, ${T.blue} 100%)`,
                    borderRadius: '99px',
                    transition: 'width 0.35s ease',
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: T.textMuted, margin: '10px 0 0' }}>
                  {filledFields} of {totalFields} fields filled
                </p>
              </SectionCard>

              {/* Live record preview */}
              <SectionCard accent={T.blue}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 4px 0', color: T.text, letterSpacing: '0.3px' }}>
                  RECORD PREVIEW
                </h3>
                <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 16px' }}>
                  What will be inserted
                </p>

                {[
                  { icon: <User size={14} color={T.blue} />, label: 'Donor ID', value: form.donor_id || '—' },
                  { icon: <Calendar size={14} color={T.blue} />, label: 'Age / Sex', value: form.age ? `${form.age} · ${form.sex}` : '—' },
                  { icon: <MapPin size={14} color={T.green} />, label: 'Region', value: `${form.region} · ${form.country_code || '—'}` },
                  { icon: <Droplet size={14} color={T.red} />, label: 'Blood', value: `${form.blood_type}${form.is_rare_type ? ' · RARE' : ''}` },
                  { icon: <Activity size={14} color={T.amber} />, label: 'BMI', value: form.bmi || '—' },
                  { icon: <ShieldCheck size={14} color={T.green} />, label: 'Status', value: form.eligibility_status },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 0',
                    borderBottom: i < 5 ? `1px dashed ${T.borderSoft}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px' }}>
                      {row.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', color: T.textFaint, fontWeight: 700, letterSpacing: '0.3px' }}>
                        {row.label.toUpperCase()}
                      </div>
                      <div style={{
                        fontSize: '13px', color: T.text, fontWeight: 700,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {row.value}
                      </div>
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* Help card */}
              <SectionCard accent={T.amber}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flexShrink: 0, color: T.amber, marginTop: '2px' }}>
                    <AlertTriangle size={16} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 800, marginBottom: '4px', letterSpacing: '0.2px' }}>
                      Things to know
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      <li><strong>Donor ID</strong> must be unique</li>
                      <li>Eligibility rows are <strong>deduplicated</strong> by status</li>
                      <li>Propensity score must match your pipeline's scale (0–100)</li>
                      <li>Refresh OLAP tab after adding to see the new donor</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}