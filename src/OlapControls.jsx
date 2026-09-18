import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, Filter, X, ChevronRight } from 'lucide-react';
import { fetchDimensionValues } from './olapApi';

export default function OlapControls({
  meta,
  rowDim,
  colDim,
  filters,
  measure,
  rowHierarchy,
  onRowDimChange,
  onColDimChange,
  onFilterAdd,
  onFilterRemove,
  onMeasureChange,
  onRollUp,
  onDrillDown,
  onPivot,
}) {
  const [filterDim, setFilterDim] = useState('');
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterSelected, setFilterSelected] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!filterDim) {
      setFilterOptions([]);
      return;
    }
    setLoadingOptions(true);
    fetchDimensionValues(filterDim)
      .then(setFilterOptions)
      .catch(() => setFilterOptions([]))
      .finally(() => setLoadingOptions(false));
    setFilterSelected([]);
  }, [filterDim]);

  const dimensionEntries = meta ? Object.entries(meta.dimensions) : [];

  const toggleFilterValue = (val) => {
    setFilterSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const applyFilter = () => {
    if (filterDim && filterSelected.length > 0) {
      onFilterAdd(filterDim, filterSelected);
      setFilterDim('');
      setFilterSelected([]);
      setFilterOptions([]);
    }
  };

  // Breadcrumb of the current dimension's hierarchy (e.g. Region > Country),
  // built generically from meta.hierarchies rather than hardcoded, so it
  // stays correct if the hierarchy config changes later.
  const hierarchyPath = rowHierarchy?.name ? meta?.hierarchies?.[rowHierarchy.name] : null;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px 18px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '0.2px' }}>
        Analysis Configuration
      </div>

      {/* Rows / Operations / Columns - the core cube controls in one row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div>
          <label style={labelStyle}>Rows</label>
          <select value={rowDim} onChange={(e) => onRowDimChange(e.target.value)} style={selectStyle}>
            {dimensionEntries.map(([key, d]) => (
              <option key={key} value={key}>{d.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
          <OpButton onClick={onPivot} enabled title="Swap rows and columns">
            <RotateCcw size={13} /> Pivot
          </OpButton>
          <OpButton onClick={onRollUp} enabled={!!rowHierarchy?.parent_dim} title={rowHierarchy?.parent_dim ? `Aggregate up to ${meta.dimensions[rowHierarchy.parent_dim]?.label}` : 'No higher level available'}>
            <ArrowUp size={13} /> Roll Up
          </OpButton>
          <OpButton onClick={onDrillDown} enabled={!!rowHierarchy?.child_dim} title={rowHierarchy?.child_dim ? `Go deeper to ${meta.dimensions[rowHierarchy.child_dim]?.label}` : 'No lower level available'}>
            <ArrowDown size={13} /> Drill Down
          </OpButton>
        </div>

        <div>
          <label style={labelStyle}>Columns</label>
          <select value={colDim || ''} onChange={(e) => onColDimChange(e.target.value || null)} style={selectStyle}>
            <option value="">None (flat table)</option>
            {dimensionEntries.map(([key, d]) => (
              <option key={key} value={key}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hierarchy breadcrumb - only shown when the current row dimension
          belongs to one (geography or time), otherwise omitted rather than
          showing an empty/misleading path. */}
      {hierarchyPath && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px', fontSize: '11px', color: '#94a3b8' }}>
          {hierarchyPath.map((dimKey, idx) => (
            <React.Fragment key={dimKey}>
              {idx > 0 && <ChevronRight size={11} />}
              <span style={{
                fontWeight: dimKey === rowDim ? '800' : '500',
                color: dimKey === rowDim ? '#2563eb' : '#94a3b8',
              }}>
                {meta.dimensions[dimKey].label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Measure - single-select pills, not checkboxes, since only one
          measure drives the chart/table at a time. */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Measure</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
          {meta && Object.entries(meta.measures).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onMeasureChange(key)}
              style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                border: '1px solid ' + (measure === key ? '#2563eb' : '#e2e8f0'),
                backgroundColor: measure === key ? '#2563eb' : '#f8fafc',
                color: measure === key ? '#ffffff' : '#64748b',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Slice & Dice filters */}
      <div>
        <label style={labelStyle}>
          <Filter size={10} style={{ verticalAlign: '-1px' }} /> Filters (Slice &amp; Dice)
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px', flexWrap: 'wrap' }}>
          <select value={filterDim} onChange={(e) => setFilterDim(e.target.value)} style={selectStyle}>
            <option value="">Add filter...</option>
            {dimensionEntries.map(([key, d]) => (
              <option key={key} value={key}>{d.label}</option>
            ))}
          </select>

          {filterDim && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', maxHeight: '100px', overflowY: 'auto', minWidth: '160px', backgroundColor: '#f8fafc' }}>
              {loadingOptions && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Loading...</span>}
              {!loadingOptions && filterOptions.map((val) => (
                <label key={val} style={{ display: 'block', fontSize: '11px', color: '#334155', padding: '2px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterSelected.includes(val)}
                    onChange={() => toggleFilterValue(val)}
                    style={{ marginRight: '5px' }}
                  />
                  {String(val)}
                </label>
              ))}
            </div>
          )}

          {filterDim && (
            <button onClick={applyFilter} disabled={filterSelected.length === 0} style={applyBtnStyle(filterSelected.length > 0)}>
              Apply
            </button>
          )}
        </div>

        {Object.keys(filters).length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            {Object.entries(filters).map(([dim, values]) => (
              <span key={dim} style={chipStyle}>
                {meta?.dimensions[dim]?.label || dim}: {values.join(', ')}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => onFilterRemove(dim)} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OpButton({ children, onClick, enabled, title }) {
  return (
    <button onClick={onClick} disabled={!enabled} title={title} style={{
      display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 11px', borderRadius: '7px',
      border: '1px solid ' + (enabled ? '#e2e8f0' : '#f1f5f9'),
      backgroundColor: enabled ? '#f8fafc' : '#fafbfc',
      color: enabled ? '#334155' : '#cbd5e1',
      fontSize: '11px', fontWeight: '700', cursor: enabled ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

const labelStyle = { display: 'block', fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.3px', textTransform: 'uppercase' };
const selectStyle = { backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '7px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: '500' };
const chipStyle = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '3px 9px', fontSize: '11px', fontWeight: '600' };
const applyBtnStyle = (enabled) => ({
  padding: '7px 12px', borderRadius: '7px', border: '1px solid ' + (enabled ? '#a7f3d0' : '#e2e8f0'),
  backgroundColor: enabled ? '#ecfdf5' : '#f8fafc', color: enabled ? '#059669' : '#94a3b8',
  fontSize: '11px', fontWeight: '700', cursor: enabled ? 'pointer' : 'not-allowed', alignSelf: 'flex-start',
});