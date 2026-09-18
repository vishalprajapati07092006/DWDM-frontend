import React, { useMemo } from 'react';

export default function OlapCrossTab({ data, meta, measure }) {
  if (!data) return null;

  const measureLabel = meta?.measures?.[measure] || measure;
  const rowLabel = meta?.dimensions?.[data.row_dimension]?.label || data.row_dimension;
  const colLabel = data.col_dimension ? (meta?.dimensions?.[data.col_dimension]?.label || data.col_dimension) : null;

  const { rowValues, colValues, matrix } = useMemo(() => {
    if (!data.col_dimension) return { rowValues: [], colValues: [], matrix: {} };
    const rows = [...new Set(data.records.map((r) => r.row_value))];
    const cols = [...new Set(data.records.map((r) => r.col_value))];
    const m = {};
    data.records.forEach((r) => {
      m[`${r.row_value}||${r.col_value}`] = r;
    });
    return { rowValues: rows, colValues: cols, matrix: m };
  }, [data]);

  // FLAT TABLE - single measure column
  if (!data.col_dimension) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={headRowStyle}>
              <th style={thStyle}>{rowLabel}</th>
              <th style={thStyle}>{measureLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((row, idx) => (
              <tr key={idx} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: '700', color: '#0f172a' }}>{String(row.row_value)}</td>
                <td style={tdStyle}>{formatVal(row[measure])}</td>
              </tr>
            ))}
          </tbody>
          {data.totals && (
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '800' }}>
                <td style={tdStyle}>GRAND TOTAL</td>
                <td style={tdStyle}>{formatVal(data.totals[measure])}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  // CROSS-TAB - rows x columns pivot table for the single selected measure
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>{rowLabel} / {colLabel}</th>
            {colValues.map((c) => <th key={c} style={thStyle}>{String(c)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rowValues.map((r) => (
            <tr key={r} style={trStyle}>
              <td style={{ ...tdStyle, fontWeight: '700', color: '#0f172a' }}>{String(r)}</td>
              {colValues.map((c) => {
                const cell = matrix[`${r}||${c}`];
                return <td key={c} style={tdStyle}>{cell ? formatVal(cell[measure]) : '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatVal(v) {
  if (v === undefined || v === null) return '—';
  return typeof v === 'number' ? v.toLocaleString() : v;
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' };
const headRowStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' };
const thStyle = { padding: '12px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px', color: '#334155', whiteSpace: 'nowrap' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };