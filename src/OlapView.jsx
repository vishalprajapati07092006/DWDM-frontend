import React, { useState, useEffect, useCallback } from 'react';
import { Database, Layers } from 'lucide-react';
import { fetchOlapMeta, fetchOlapCube, fetchOlapKpis } from './olapApi';
import KpiCards from './KpiCards';
import OlapControls from './OlapControls';
import OlapChart from './OlapChart';
import OlapCrossTab from './OlapCrossTab';

export default function OlapView() {
  const [meta, setMeta] = useState(null);
  const [rowDim, setRowDim] = useState('region');
  const [colDim, setColDim] = useState('blood_type');
  const [filters, setFilters] = useState({});
  const [measure, setMeasure] = useState('donor_count');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastOp, setLastOp] = useState('Initial cube load');

  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  useEffect(() => {
    fetchOlapMeta()
      .then((m) => {
        setMeta(m);
        if (m.default_measures?.length) setMeasure(m.default_measures[0]);
      })
      .catch(() => setError('Could not load OLAP dimension metadata. Ensure the backend is running and olap.py is registered in main.py.'));
  }, []);

  // KPI cards respond only to filters (slice/dice) - independent of
  // whichever row/col/measure the person is currently exploring below.
  useEffect(() => {
    if (!meta) return;
    setKpisLoading(true);
    fetchOlapKpis(filters)
      .then(setKpis)
      .catch(() => setKpis(null))
      .finally(() => setKpisLoading(false));
  }, [meta, filters]);

  const runQuery = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchOlapCube({ rowDim, colDim, filters, measure })
      .then((res) => setData(res))
      .catch((err) => {
        console.error('OLAP Cube Error:', err);
        setError('Failed to load cube data. Check backend connection and dimension selection.');
      })
      .finally(() => setLoading(false));
  }, [rowDim, colDim, filters, measure]);

  useEffect(() => {
    if (meta) runQuery();
  }, [meta, rowDim, colDim, filters, measure, runQuery]);

  const rowHierarchy = data?.row_hierarchy;

  const handleRollUp = () => {
    if (!rowHierarchy?.parent_dim) return;
    setLastOp(`Roll-up: ${meta.dimensions[rowDim].label} → ${meta.dimensions[rowHierarchy.parent_dim].label}`);
    setRowDim(rowHierarchy.parent_dim);
  };

  const handleDrillDown = () => {
    if (!rowHierarchy?.child_dim) return;
    setLastOp(`Drill-down: ${meta.dimensions[rowDim].label} → ${meta.dimensions[rowHierarchy.child_dim].label}`);
    setRowDim(rowHierarchy.child_dim);
  };

  const handlePivot = () => {
    setLastOp('Pivot: rotated axes (rows ↔ columns)');
    const newRow = colDim || rowDim;
    const newCol = colDim ? rowDim : null;
    setRowDim(newRow);
    setColDim(newCol);
  };

  const handleFilterAdd = (dim, values) => {
    const isFirstSingleFilter = Object.keys(filters).length === 0 && values.length === 1;
    setLastOp(
      isFirstSingleFilter
        ? `Slice: ${meta.dimensions[dim].label} = ${values[0]}`
        : `Dice: filtered on ${meta.dimensions[dim].label}`
    );
    setFilters((prev) => ({ ...prev, [dim]: values }));
  };

  const handleFilterRemove = (dim) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[dim];
      return next;
    });
  };

  const handleMeasureChange = (key) => {
    setLastOp(`Measure changed to ${meta.measures[key]}`);
    setMeasure(key);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
          <Database color="#2563eb" size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#0f172a' }}>OLAP Analytics Cube</h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Roll-up, drill-down, slice, dice &amp; pivot across the donor data warehouse</p>
        </div>
      </div>

      <div style={{ margin: '14px 0 16px' }}>
        <KpiCards kpis={kpis} loading={kpisLoading} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '7px 14px', marginBottom: '16px', fontSize: '11.5px', color: '#475569' }}>
        <Layers size={12} /> <strong>Last operation:</strong> {lastOp}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          {error}
        </div>
      )}

      {meta && (
        <OlapControls
          meta={meta}
          rowDim={rowDim}
          colDim={colDim}
          filters={filters}
          measure={measure}
          rowHierarchy={rowHierarchy}
          onRowDimChange={(d) => { setLastOp(`Changed row dimension to ${meta.dimensions[d].label}`); setRowDim(d); }}
          onColDimChange={(d) => { setLastOp(d ? `Changed column dimension to ${meta.dimensions[d].label}` : 'Removed column dimension'); setColDim(d); }}
          onFilterAdd={handleFilterAdd}
          onFilterRemove={handleFilterRemove}
          onMeasureChange={handleMeasureChange}
          onRollUp={handleRollUp}
          onDrillDown={handleDrillDown}
          onPivot={handlePivot}
        />
      )}

      {loading && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px solid #e2e8f0' }}>
          Loading cube...
        </div>
      )}

      {!loading && data && <OlapChart data={data} meta={meta} measure={measure} />}

      {!loading && data && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)' }}>
          <OlapCrossTab data={data} meta={meta} measure={measure} />
        </div>
      )}
    </div>
  );
}