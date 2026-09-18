// Computes a short, factual insight sentence directly from the cube result
// that's already on screen (top/bottom category, spread vs average, and a
// trend read for time dimensions). This is NOT a live LLM call - it's a
// deterministic read of the same numbers already in the chart, so it's
// instant, free, and can never say something the data doesn't support.

const isRatioMeasure = (measure) => measure.startsWith('avg_') || measure.endsWith('_pct');

function aggregateByRow(records, measure) {
  const ratio = isRatioMeasure(measure);
  const groups = {};
  records.forEach((r) => {
    const key = String(r.row_value);
    if (!groups[key]) groups[key] = [];
    if (r[measure] !== null && r[measure] !== undefined) groups[key].push(r[measure]);
  });
  return Object.entries(groups)
    .filter(([, vals]) => vals.length > 0)
    .map(([row_value, vals]) => ({
      row_value,
      value: ratio ? vals.reduce((a, b) => a + b, 0) / vals.length : vals.reduce((a, b) => a + b, 0),
    }));
}

function formatValue(value, measure) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  if (measure.endsWith('_pct')) return `${rounded}%`;
  if (measure === 'avg_recency_days') return `${rounded} days`;
  return rounded.toLocaleString();
}

export function generateInsight(data, meta, measure) {
  if (!data || !data.records || data.records.length === 0) return null;

  const rowLabel = meta?.dimensions?.[data.row_dimension]?.label || data.row_dimension;
  const measureLabel = meta?.measures?.[measure] || measure;
  const isTimeDim = data.row_hierarchy?.name === 'time';

  const rows = aggregateByRow(data.records, measure);
  if (rows.length === 0) return null;

  if (rows.length === 1) {
    return `${rowLabel} "${rows[0].row_value}" shows ${measureLabel.toLowerCase()} of ${formatValue(rows[0].value, measure)}. Add more ${rowLabel.toLowerCase()} values or clear filters to compare.`;
  }

  const sortedByValue = [...rows].sort((a, b) => b.value - a.value);
  const top = sortedByValue[0];
  const bottom = sortedByValue[sortedByValue.length - 1];
  const avg = rows.reduce((sum, r) => sum + r.value, 0) / rows.length;
  const topDeltaPct = avg !== 0 ? Math.round(((top.value - avg) / Math.abs(avg)) * 100) : null;

  let sentence = `"${top.row_value}" leads on ${measureLabel.toLowerCase()} at ${formatValue(top.value, measure)}`;
  if (topDeltaPct !== null && Math.abs(topDeltaPct) >= 1) {
    sentence += `, ${Math.abs(topDeltaPct)}% ${topDeltaPct >= 0 ? 'above' : 'below'} the ${rowLabel.toLowerCase()} average`;
  }
  sentence += `. "${bottom.row_value}" trails at ${formatValue(bottom.value, measure)}.`;

  // For a time dimension, also read the trend across the natural
  // chronological order the query already returns (it's ORDER BY row_value,
  // and year/quarter/month strings sort chronologically as text).
  if (isTimeDim && rows.length >= 2) {
    const chronological = data.records
      .filter((r) => r[measure] !== null && r[measure] !== undefined)
      .reduce((acc, r) => {
        const key = String(r.row_value);
        if (!acc.find((x) => x.row_value === key)) acc.push({ row_value: key, value: r[measure] });
        return acc;
      }, [])
      .sort((a, b) => (a.row_value > b.row_value ? 1 : -1));

    if (chronological.length >= 2) {
      const first = chronological[0];
      const last = chronological[chronological.length - 1];
      if (first.value !== 0) {
        const changePct = Math.round(((last.value - first.value) / Math.abs(first.value)) * 100);
        if (Math.abs(changePct) >= 1) {
          sentence += ` ${measureLabel} has ${changePct >= 0 ? 'risen' : 'fallen'} ${Math.abs(changePct)}% from ${first.row_value} to ${last.row_value}.`;
        }
      }
    }
  }

  return sentence;
}
