import React from 'react';
import { Users, Repeat, Clock, TrendingUp } from 'lucide-react';

const CARDS = [
  {
    key: 'donor_count',
    label: 'Total Donors',
    icon: Users,
    color: '#2563eb',
    bg: '#eff6ff',
    format: (v) => (v === null || v === undefined ? '--' : v.toLocaleString()),
  },
  {
    key: 'regular_donor_pct',
    label: 'Regular Donor %',
    icon: Repeat,
    color: '#059669',
    bg: '#ecfdf5',
    format: (v) => (v === null || v === undefined ? '--' : `${v}%`),
  },
  {
    key: 'avg_recency_days',
    label: 'Avg Recency',
    icon: Clock,
    color: '#d97706',
    bg: '#fffbeb',
    format: (v) => (v === null || v === undefined ? '--' : `${v}d`),
  },
  {
    key: 'donated_next_6m_pct',
    label: 'Return Rate',
    icon: TrendingUp,
    color: '#9333ea',
    bg: '#faf5ff',
    format: (v) => (v === null || v === undefined ? '--' : `${v}%`),
  },
];

// Compact by design: small padding, small icon badge, single-line value -
// meant to sit as a quick-glance strip above the analysis controls, not
// compete with the chart for attention.
export default function KpiCards({ kpis, loading }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
      {CARDS.map(({ key, label, icon: Icon, color, bg, format }) => (
        <div
          key={key}
          style={{
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 14px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}
        >
          <div style={{ backgroundColor: bg, borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color={color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>
              {loading ? '…' : format(kpis?.[key])}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
