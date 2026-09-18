import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Sparkles } from 'lucide-react';
import { generateInsight } from './olapInsights';

const CHART_PALETTE = ['#2563eb', '#059669', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#65a30d', '#db2777'];

export default function OlapChart({ data, meta, measure }) {
  const [chartType, setChartType] = useState(null); // null = auto-pick based on dimension

  if (!data || !data.records || data.records.length === 0) return null;

  const measureLabel = meta?.measures?.[measure] || measure;
  const rowLabel = meta?.dimensions?.[data.row_dimension]?.label || data.row_dimension;
  const isTimeDim = data.row_hierarchy?.name === 'time';
  const effectiveType = chartType || (isTimeDim ? 'line' : 'bar');

  const { chartData, seriesKeys } = useMemo(() => {
    if (!data.col_dimension) {
      return {
        chartData: data.records.map((r) => ({ name: String(r.row_value), value: r[measure] })),
        seriesKeys: ['value'],
      };
    }
    const cols = [...new Set(data.records.map((r) => String(r.col_value)))];
    const byRow = {};
    data.records.forEach((r) => {
      const key = String(r.row_value);
      if (!byRow[key]) byRow[key] = { name: key };
      byRow[key][String(r.col_value)] = r[measure];
    });
    return { chartData: Object.values(byRow), seriesKeys: cols };
  }, [data, measure]);

  const insight = useMemo(() => generateInsight(data, meta, measure), [data, meta, measure]);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
          {measureLabel} by {rowLabel}
          {data.col_dimension && (
            <span style={{ fontWeight: '500', color: '#64748b' }}>
              {' '}split by {meta?.dimensions?.[data.col_dimension]?.label || data.col_dimension}
            </span>
          )}
        </h3>

        <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
          <button onClick={() => setChartType('bar')} title="Bar chart" style={toggleBtnStyle(effectiveType === 'bar')}>
            <BarChart3 size={14} />
          </button>
          <button onClick={() => setChartType('line')} title="Line chart" style={toggleBtnStyle(effectiveType === 'line')}>
            <LineChartIcon size={14} />
          </button>
        </div>
      </div>

      {/* Chart is the visual focus: tall, minimal chrome around it */}
      <div style={{ width: '100%', height: '380px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {effectiveType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {seriesKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key === 'value' ? measureLabel : key}
                  stroke={CHART_PALETTE[idx % CHART_PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              {seriesKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key === 'value' ? measureLabel : key}
                  fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Dynamic insight - computed from the exact records rendered above,
          not a live model call. See olapInsights.js. */}
      {insight && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '14px',
          backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
          padding: '10px 14px', fontSize: '12.5px', color: '#334155', lineHeight: '1.5',
        }}>
          <Sparkles size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{insight}</span>
        </div>
      )}
    </div>
  );
}

const toggleBtnStyle = (active) => ({
  padding: '6px 10px', border: 'none', cursor: 'pointer',
  backgroundColor: active ? '#2563eb' : '#f8fafc',
  color: active ? '#ffffff' : '#64748b',
});