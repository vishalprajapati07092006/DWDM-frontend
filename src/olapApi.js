import axios from 'axios';

// Same base your App.jsx already uses.
const API_BASE = 'http://localhost:8000/api';

export async function fetchOlapMeta() {
  const res = await axios.get(`${API_BASE}/olap/meta`);
  return res.data;
}

export async function fetchOlapKpis(filters) {
  const params = {};
  if (filters && Object.keys(filters).length > 0) params.filters = JSON.stringify(filters);
  const res = await axios.get(`${API_BASE}/olap/kpis`, { params });
  return res.data;
}

export async function fetchDimensionValues(dimension) {
  const res = await axios.get(`${API_BASE}/olap/dimension-values`, {
    params: { dimension },
  });
  return res.data.values || [];
}

export async function fetchOlapCube({ rowDim, colDim, filters, measure }) {
  const params = { row_dim: rowDim, measures: measure };
  if (colDim) params.col_dim = colDim;
  if (filters && Object.keys(filters).length > 0) params.filters = JSON.stringify(filters);

  const res = await axios.get(`${API_BASE}/olap/cube`, { params });
  return res.data;
}