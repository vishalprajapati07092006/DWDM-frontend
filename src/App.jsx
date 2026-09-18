import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, Database, Cpu, Target, Zap, Award, RefreshCw, Heart, AlertTriangle, Info, Compass, MapPin
} from 'lucide-react';
import OlapView from './OlapView';

const API_BASE = 'http://localhost:8000/api';

const CLUSTER_PALETTE = ['#2563eb', '#059669', '#d97706', '#9333ea', '#dc2626', '#0891b2'];

// ---------- Design tokens (premium dashboard) ----------
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
  blueDark: '#1d4ed8',
  green: '#059669',
  red: '#dc2626',
  amber: '#d97706',
  purple: '#9333ea',
  radius: 16,
  radiusSm: 10,
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
  shadowHover: '0 2px 4px rgba(15,23,42,0.05), 0 16px 40px -12px rgba(15,23,42,0.14)',
  font: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('mining');
  
  const [olapData, setOlapData] = useState([]);
  const [regionFilter, setRegionFilter] = useState('All');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');

  const [classificationData, setClassificationData] = useState(null);
  const [featureChartData, setFeatureChartData] = useState([]);
  const [clusteringData, setClusteringData] = useState([]);
  const [multicollinearityCheck, setMulticollinearityCheck] = useState(null);
  const [clusterCaveat, setClusterCaveat] = useState(null);
  const [selectedK, setSelectedK] = useState(4);
  const [associationData, setAssociationData] = useState([]);
  const [prCurveData, setPrCurveData] = useState(null);
  const [prCurveLoading, setPrCurveLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [predForm, setPredForm] = useState({
    age: 38,
    bmi: 24.5,
    donation_count_last_12m: 3,
    years_since_first_donation: 4,
    lifetime_donation_count: 14,
    recency_days: 42,
    is_regular_donor: 1,
    eligible_to_donate: 1,
  });
  const [predictedRisk, setPredictedRisk] = useState(null);
  const [willReturn, setWillReturn] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [clusterForm, setClusterForm] = useState({
    age: 35,
    bmi: 24.0,
    recency_days: 90,
    donation_count_last_12m: 2,
    lifetime_donation_count: 8,
    donation_propensity_score: 45,
  });
  const [clusterPrediction, setClusterPrediction] = useState(null);
  const [isClusterPredicting, setIsClusterPredicting] = useState(false);

  const fetchOlap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/olap/pivot`, {
        params: { region: regionFilter, blood_type: bloodTypeFilter }
      });
      setOlapData(res.data || []);
    } catch (err) {
      console.error("OLAP Fetch Error:", err);
    }
  };

  useEffect(() => { 
    if (activeTab === 'olap') fetchOlap(); 
  }, [activeTab, regionFilter, bloodTypeFilter]);

  const assignClusterArchetype = (cluster) => {
    const hasPropensity = cluster.donation_propensity_score !== undefined;

    if (hasPropensity && cluster.donation_propensity_score >= 50) {
      return { name: "Loyal Regular Donors", badge: "CORE SUPPLY BASE", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
    }
    if (cluster.recency_days > 1500) {
      return { name: "Long-Lapsed Donors", badge: "REACTIVATION NEEDED", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    }
    if (hasPropensity && cluster.age !== undefined && cluster.age < 45) {
      return { name: "New / Occasional Donors", badge: "BUILDING HISTORY", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
    }
    if (hasPropensity) {
      return { name: "Aging Occasional Donors", badge: "RE-ENGAGE SOON", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    }
    return cluster.lifetime_donation_count > 15 || cluster.donation_count_last_12m > 3
      ? { name: "Core Champion Donors", badge: "HIGH RETENTION", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" }
      : { name: "Casual / Occasional Donors", badge: "MODERATE POTENTIAL", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  };

  const fetchPrCurve = async () => {
    setPrCurveLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/mining/pr-curve`);
      const { thresholds, precisions, recalls, chosen_threshold, chosen_precision, chosen_recall } = res.data;
      const points = thresholds.map((t, i) => ({
        threshold: t,
        precision: +(precisions[i] * 100).toFixed(1),
        recall: +(recalls[i] * 100).toFixed(1),
      }));
      setPrCurveData({ points, chosen_threshold, chosen_precision, chosen_recall });
    } catch (err) {
      console.error("PR Curve Fetch Error:", err);
      setPrCurveData(null);
    }
    setPrCurveLoading(false);
  };

  const fetchMiningData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [classRes, clusterRes, assocRes] = await Promise.all([
        axios.get(`${API_BASE}/mining/classification`),
        axios.get(`${API_BASE}/mining/clustering?clusters=${selectedK}`),
        axios.get(`${API_BASE}/mining/association`)
      ]);
      
      setClassificationData(classRes.data);

      if (classRes.data?.feature_importances) {
        const formattedImp = Object.entries(classRes.data.feature_importances).map(([key, val]) => ({
          feature: key.replace(/_/g, ' ').toUpperCase(),
          importance: +(val * 100).toFixed(1)
        })).sort((a, b) => b.importance - a.importance);
        setFeatureChartData(formattedImp);
      }
      
      const clusterPayload = clusterRes.data;
      if (Array.isArray(clusterPayload?.clusters)) {
        setClusteringData(clusterPayload.clusters.map(c => ({ ...c, archetype: assignClusterArchetype(c) })));
        setMulticollinearityCheck(clusterPayload.multicollinearity_check ?? null);
        setClusterCaveat(clusterPayload.caveat ?? null);
      } else if (Array.isArray(clusterPayload)) {
        setClusteringData(clusterPayload.map(c => ({ ...c, archetype: assignClusterArchetype(c) })));
        setMulticollinearityCheck(null);
        setClusterCaveat(null);
      } else {
        setClusteringData([]);
        setMulticollinearityCheck(null);
        setClusterCaveat(null);
      }

      setAssociationData(Array.isArray(assocRes.data) ? assocRes.data : []);
      setClusterPrediction(null);
    } catch (err) {
      console.error("Mining Fetch Error:", err);
      setApiError("Unable to load model metrics. Ensure backend API is operational on port 8000.");
    }
    setLoading(false);
    fetchPrCurve();
  };

  useEffect(() => {
    if (activeTab === 'mining') fetchMiningData();
  }, [activeTab, selectedK]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await axios.post(`${API_BASE}/mining/predict`, predForm);
      const probValue = res.data?.risk_probability;
      setPredictedRisk(probValue <= 1 ? probValue * 100 : probValue);
      setWillReturn(res.data?.will_return ?? null);
    } catch (err) {
      console.error("Prediction Error:", err);
      setApiError("Inference request failed. Please check endpoint status.");
    }
    setIsSimulating(false);
  };

  const updateForm = (key) => (e) => setPredForm({ ...predForm, [key]: Number(e.target.value) });

  const handleClusterPredict = async (e) => {
    e.preventDefault();
    setIsClusterPredicting(true);
    try {
      const res = await axios.post(`${API_BASE}/mining/cluster-predict`, {
        ...clusterForm,
        n_clusters: selectedK,
      });
      const profile = res.data?.cluster_profile;
      setClusterPrediction({
        ...res.data,
        archetype: profile ? assignClusterArchetype(profile) : null,
      });
    } catch (err) {
      console.error("Cluster Prediction Error:", err);
      setApiError("Cluster assignment request failed. Please check endpoint status.");
    }
    setIsClusterPredicting(false);
  };

  const updateClusterForm = (key) => (e) => setClusterForm({ ...clusterForm, [key]: Number(e.target.value) });

  const clusterSizeChartData = clusteringData.map((c, idx) => ({
    name: c.archetype?.name || `Segment ${idx + 1}`,
    value: c.pct_of_total ?? 0,
    color: CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length],
  }));

  const CLUSTER_FEATURE_KEYS = ['age', 'bmi', 'recency_days', 'donation_count_last_12m', 'lifetime_donation_count', 'donation_propensity_score'];
  const clusterFeatureChartData = CLUSTER_FEATURE_KEYS
    .filter((key) => clusteringData.some((c) => c[key] !== undefined))
    .map((key) => {
      const row = { feature: key.replace(/_/g, ' ').toUpperCase() };
      clusteringData.forEach((c, idx) => {
        row[`Segment ${idx + 1}`] = c[key];
      });
      return row;
    });

  const clusterDistanceChartData = clusterPrediction?.distances_to_centroids?.map((d, idx) => ({
    segment: `Segment ${idx + 1}`,
    distance: +d.toFixed(2),
    isAssigned: idx === clusterPrediction.assigned_cluster,
  })) || [];

  return (
    <div style={{ background: T.bgApp, color: T.text, minHeight: '100vh', fontFamily: T.font }}>
      
      {/* Navigation Header - frosted glass */}
            <header style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 55%, #e0e7ff 100%)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderBottom: '1px solid #bfdbfe', 
        padding: '16px 36px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        boxShadow: '0 4px 20px -8px rgba(37,99,235,0.18), 0 1px 0 rgba(255,255,255,0.5) inset',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
            padding: '10px', borderRadius: '12px', color: '#ef4444', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px -4px rgba(239,68,68,0.45)',
          }}>
            <Heart size={22} fill="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: T.text, letterSpacing: '-0.5px' }}>
                PULSE<span style={{ color: T.blue }}>.AI</span>
              </h1>
              <span style={{ 
                background: 'rgba(255,255,255,0.75)', 
                color: T.blue, border: '1px solid #bfdbfe', 
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(37,99,235,0.08)',
              }}>
                LIVE DECISION SYSTEM
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Blood Supply Chain Intelligence & Retentive Decision Support System</p>
          </div>
        </div>

        {/* Tab Switcher - pill with inset shadow */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.65)', padding: '4px', borderRadius: '12px', 
          display: 'flex', gap: '4px', border: '1px solid rgba(191,219,254,0.9)',
          boxShadow: 'inset 0 1px 2px rgba(37,99,235,0.06), 0 1px 2px rgba(255,255,255,0.6)',
        }}>
          <button 
            onClick={() => setActiveTab('mining')} 
            style={{ 
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', 
              fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'mining' ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : 'transparent', 
              color: activeTab === 'mining' ? T.blue : '#475569',
              boxShadow: activeTab === 'mining' ? '0 1px 3px rgba(15,23,42,0.08), 0 4px 12px -4px rgba(37,99,235,0.25)' : 'none', 
              transition: 'all 0.2s ease',
            }}
          >
            <Activity size={15} /> Predictive AI Engine
          </button>
          <button 
            onClick={() => setActiveTab('olap')} 
            style={{ 
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', 
              fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'olap' ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : 'transparent', 
              color: activeTab === 'olap' ? T.blue : '#475569',
              boxShadow: activeTab === 'olap' ? '0 1px 3px rgba(15,23,42,0.08), 0 4px 12px -4px rgba(37,99,235,0.25)' : 'none', 
              transition: 'all 0.2s ease',
            }}
          >
            <Database size={15} /> OLAP Analytics Cube
          </button>
        </div>
      </header>

      <main style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {apiError && (
          <div style={{ 
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
            border: '1px solid #fecaca', color: '#991b1b', 
            padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', 
            display: 'flex', alignItems: 'center', gap: '10px', 
            fontSize: '13px', fontWeight: '600',
            boxShadow: '0 4px 16px -8px rgba(220,38,38,0.25)',
          }}>
            <AlertTriangle size={18} /> {apiError}
          </div>
        )}

        {/* VIEW 1: PREDICTIVE DATA MINING ENGINE */}
        {activeTab === 'mining' && (
          <div>
            {/* Dataset Caveat Banner */}
            {classificationData?.dataset_caveat && (
              <div style={{ 
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
                border: '1px solid #fde68a', color: '#92400e', 
                padding: '14px 16px', borderRadius: '14px', marginBottom: '20px', 
                display: 'flex', alignItems: 'flex-start', gap: '10px', 
                fontSize: '13px', lineHeight: '1.5',
                boxShadow: '0 4px 16px -8px rgba(217,119,6,0.25)',
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong style={{ fontWeight: '800' }}>Dataset caveat: </strong>
                  {classificationData.dataset_caveat}
                </div>
              </div>
            )}

            {/* Top KPI Deck */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
              <MetricCard 
                title="CLASSIFICATION ACCURACY" 
                value={classificationData?.accuracy !== undefined ? `${(classificationData.accuracy * 100).toFixed(1)}%` : "--"} 
                sub="Random Forest Ensemble" 
                icon={<Cpu color="#2563eb" size={20} />} 
                accent="#2563eb"
                bg="#eff6ff" 
              />
              <MetricCard 
                title="ROC-AUC SCORE" 
                value={classificationData?.metrics?.roc_auc !== undefined ? classificationData.metrics.roc_auc.toFixed(3) : "--"} 
                sub="Model Discrimination Power" 
                icon={<Target color="#059669" size={20} />} 
                accent="#059669"
                bg="#ecfdf5" 
              />
              <MetricCard 
                title="MODEL RECALL" 
                value={classificationData?.metrics?.recall !== undefined ? `${(classificationData.metrics.recall * 100).toFixed(1)}%` : "--"} 
                sub="At-risk donor capture rate" 
                icon={<Zap color="#d97706" size={20} />} 
                accent="#d97706"
                bg="#fef3c7" 
              />
              <MetricCard 
                title="ACTIVE CLUSTERS" 
                value={clusteringData.length > 0 ? clusteringData.length : selectedK} 
                sub="Behavioral segments mapped" 
                icon={<Award color="#9333ea" size={20} />} 
                accent="#9333ea"
                bg="#faf5ff" 
              />
            </div>

            {/* Interactive Predictor & Feature Chart Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
              
              {/* Simulator Card */}
              <SectionCard accent="#2563eb">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconBadge color="#2563eb" bg="#eff6ff">
                      <Activity color="#2563eb" size={20} />
                    </IconBadge>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: T.text }}>Live Donor Return Simulator</h2>
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>Run real-time inference on donor retention probability</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <InputField label="AGE" value={predForm.age} onChange={updateForm('age')} />
                  <InputField label="BMI" value={predForm.bmi} onChange={updateForm('bmi')} step="0.1" />
                  <InputField label="DONATIONS (LAST 12M)" value={predForm.donation_count_last_12m} onChange={updateForm('donation_count_last_12m')} />
                  <InputField label="RECENCY (DAYS)" value={predForm.recency_days} onChange={updateForm('recency_days')} />
                  <InputField label="YEARS SINCE 1ST DONATION" value={predForm.years_since_first_donation} onChange={updateForm('years_since_first_donation')} />
                  <InputField label="LIFETIME DONATIONS" value={predForm.lifetime_donation_count} onChange={updateForm('lifetime_donation_count')} />
                  
                  <SelectField label="REGULAR DONOR STATUS" value={predForm.is_regular_donor} onChange={updateForm('is_regular_donor')} options={[{v: 1, l: 'Yes (Regular)'}, {v: 0, l: 'No (Irregular)'}]} />
                  <SelectField label="ELIGIBILITY STATUS" value={predForm.eligible_to_donate} onChange={updateForm('eligible_to_donate')} options={[{v: 1, l: 'Eligible'}, {v: 0, l: 'Deferred'}]} />

                  <button 
                    type="submit" 
                    disabled={isSimulating}
                    style={{ 
                      gridColumn: 'span 2', marginTop: '10px', padding: '13px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                      color: '#fff', fontWeight: '700', fontSize: '14px',
                      cursor: isSimulating ? 'wait' : 'pointer', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      boxShadow: '0 8px 20px -8px rgba(37,99,235,0.55)', 
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.3px',
                    }}
                    onMouseEnter={(e) => { if (!isSimulating) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(37,99,235,0.65)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(37,99,235,0.55)'; }}
                  >
                    {isSimulating ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                    RUN AI INFERENCE
                  </button>
                </form>

                {predictedRisk !== null && (
                  <div style={{ 
                    marginTop: '20px', padding: '16px', borderRadius: '14px', 
                    background: willReturn 
                      ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                      : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                    border: `1px solid ${willReturn ? '#bbf7d0' : '#fecaca'}`, 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: willReturn 
                      ? '0 8px 24px -12px rgba(22,163,74,0.35)' 
                      : '0 8px 24px -12px rgba(220,38,38,0.35)',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: willReturn ? '#166534' : '#991b1b', letterSpacing: '0.5px' }}>
                        {willReturn ? 'LIKELY TO RETURN' : 'AT RISK OF LAPSING'}
                      </span>
                      <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>
                        6-month return probability
                        {prCurveData?.chosen_threshold != null && (
                          <> &middot; decision threshold {(prCurveData.chosen_threshold * 100).toFixed(1)}%</>
                        )}
                      </p>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: willReturn ? '#16a34a' : '#dc2626', letterSpacing: '-1px' }}>
                      {predictedRisk.toFixed(1)}%
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Feature Importance Chart */}
              <SectionCard accent="#059669">
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: T.text }}>Predictive Feature Weights (%)</h2>
                <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 20px 0' }}>Gini Importance ranking derived from Random Forest model</p>
                
                {featureChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={featureChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barBlue" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" unit="%" stroke={T.textFaint} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="feature" type="category" stroke="#475569" tick={{ fontSize: 10, fontWeight: 600 }} width={140} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', borderColor: T.border, borderRadius: '10px', color: T.text,
                          boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)',
                        }} 
                        formatter={(val) => [`${val}%`, 'Importance']} 
                      />
                      <Bar dataKey="importance" fill="url(#barBlue)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: T.textFaint, fontSize: '13px' }}>
                    {loading ? "Loading feature weights..." : "No feature importance data returned from API."}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Precision/Recall vs Threshold Curve */}
            <SectionCard accent="#9333ea" style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: T.text }}>Precision-Recall vs Decision Threshold</h2>
                  <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>F-beta sweep showing where the chosen operating threshold sits</p>
                </div>
                {prCurveData && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted }}>CHOSEN THRESHOLD</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: T.text }}>{prCurveData.chosen_threshold.toFixed(4)}</div>
                  </div>
                )}
              </div>

              {prCurveData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prCurveData.points} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="threshold" 
                      type="number" 
                      domain={[0, 1]} 
                      stroke={T.textFaint} 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => v.toFixed(2)}
                      label={{ value: 'Threshold', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textFaint }} 
                    />
                    <YAxis unit="%" stroke={T.textFaint} tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', borderColor: T.border, borderRadius: '10px', color: T.text,
                        boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)',
                      }} 
                      formatter={(val, name) => [`${val}%`, name]} 
                      labelFormatter={(v) => `Threshold: ${v.toFixed(3)}`} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <ReferenceLine 
                      x={prCurveData.chosen_threshold} 
                      stroke="#9333ea" strokeDasharray="4 4" strokeWidth={2} 
                      label={{ value: `Chosen (${prCurveData.chosen_threshold.toFixed(3)})`, position: 'top', fontSize: 11, fill: '#9333ea', fontWeight: 700 }} 
                    />
                    <Line type="monotone" dataKey="precision" name="Precision" stroke="#2563eb" dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="recall" name="Recall" stroke="#059669" dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: T.textFaint, fontSize: '13px' }}>
                  {prCurveLoading ? "Loading precision/recall curve..." : "No PR curve data returned from API."}
                </div>
              )}
            </SectionCard>

            {/* K-Means Clustering */}
            <SectionCard accent="#d97706" style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: T.text }}>K-Means Behavioral Segments</h2>
                  <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>Unsupervised clustering mapping donor behavior patterns</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: T.textMuted }}>Clusters (K):</span>
                  <select 
                    value={selectedK} 
                    onChange={(e) => setSelectedK(Number(e.target.value))} 
                    style={{ 
                      backgroundColor: '#ffffff', color: T.text, 
                      border: `1px solid #cbd5e1`, borderRadius: '8px', 
                      padding: '6px 12px', fontSize: '13px', fontWeight: '600',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04)', cursor: 'pointer',
                    }}
                  >
                    <option value={2}>2 Clusters</option>
                    <option value={3}>3 Clusters</option>
                    <option value={4}>4 Clusters</option>
                  </select>
                </div>
              </div>

              {clusterCaveat && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
                  border: '1px solid #fde68a', color: '#92400e', 
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', 
                  display: 'flex', alignItems: 'flex-start', gap: '10px', 
                  fontSize: '12.5px', lineHeight: '1.5',
                }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div><strong style={{ fontWeight: '800' }}>Cluster caveat: </strong>{clusterCaveat}</div>
                </div>
              )}

              {multicollinearityCheck?.flagged_pairs?.length > 0 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                  border: '1px solid #fecaca', color: '#991b1b', 
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', 
                  display: 'flex', alignItems: 'flex-start', gap: '10px', 
                  fontSize: '12.5px', lineHeight: '1.5',
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <strong style={{ fontWeight: '800' }}>Multicollinearity flagged (|r| &ge; {multicollinearityCheck.threshold}): </strong>
                    {multicollinearityCheck.flagged_pairs.map((p, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        <code>{p.feature_a}</code> &harr; <code>{p.feature_b}</code> (r = {p.correlation})
                      </span>
                    ))}
                    . Consider whether both features add independent signal before treating the segmentation as final.
                  </div>
                </div>
              )}

              {clusteringData.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${clusteringData.length}, 1fr)`, gap: '16px' }}>
                  {clusteringData.map((c, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: c.archetype?.bg || T.surfaceAlt, 
                        border: `1px solid ${c.archetype?.border || '#cbd5e1'}`, 
                        borderRadius: '14px', padding: '20px',
                        boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px -12px rgba(15,23,42,0.18)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px -8px rgba(15,23,42,0.08)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          backgroundColor: '#ffffff', 
                          color: c.archetype?.color || T.text, 
                          border: `1px solid ${c.archetype?.border || '#cbd5e1'}`, 
                          fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px',
                        }}>
                          {c.archetype?.badge || "CLUSTER"}
                        </span>
                        {c.pct_of_total !== undefined && (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted }}>{c.pct_of_total}% of donors</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '12px 0 16px 0', color: T.text }}>{c.archetype?.name || `Segment ${idx + 1}`}</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <ClusterMetric label="Avg Age" value={c.age?.toFixed(1) ?? '--'} />
                        <ClusterMetric label="Avg Recency" value={`${c.recency_days?.toFixed(0) ?? '--'} Days`} />
                        <ClusterMetric label="Lifetime Contributions" value={c.lifetime_donation_count?.toFixed(1) ?? '--'} />
                        <ClusterMetric label="Donations (Last 12M)" value={c.donation_count_last_12m?.toFixed(1) ?? '--'} />
                        <ClusterMetric label="Propensity Score" value={c.donation_propensity_score?.toFixed(1) ?? '--'} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: T.textFaint, fontSize: '13px' }}>
                  {loading ? "Fetching cluster profiles..." : "No cluster data available."}
                </div>
              )}

              {clusteringData.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px', marginTop: '24px' }}>
                  <div style={{ border: `1px solid ${T.borderSoft}`, borderRadius: '14px', padding: '18px', background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: T.text }}>Segment Size Distribution</h3>
                    <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 8px 0' }}>Share of donor base per behavioral segment</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={clusterSizeChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {clusterSizeChartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val, name) => [`${val}%`, name]} 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: T.border, borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ border: `1px solid ${T.borderSoft}`, borderRadius: '14px', padding: '18px', background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: T.text }}>Feature Comparison Across Segments</h3>
                    <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 8px 0' }}>Average value per feature, grouped by segment</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={clusterFeatureChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="feature" stroke={T.textFaint} tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis stroke={T.textFaint} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: T.border, borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {clusteringData.map((_, idx) => (
                          <Bar key={idx} dataKey={`Segment ${idx + 1}`} fill={CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Cluster Assignment Simulator */}
            <SectionCard accent="#9333ea" style={{ marginBottom: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <IconBadge color="#9333ea" bg="#faf5ff">
                      <Compass color="#9333ea" size={20} />
                    </IconBadge>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: T.text }}>Cluster Assignment Simulator</h2>
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>Score a new/hypothetical donor against the current K={selectedK} segmentation</p>
                    </div>
                  </div>

                  <form onSubmit={handleClusterPredict} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <InputField label="AGE" value={clusterForm.age} onChange={updateClusterForm('age')} />
                    <InputField label="BMI" value={clusterForm.bmi} onChange={updateClusterForm('bmi')} step="0.1" />
                    <InputField label="RECENCY (DAYS)" value={clusterForm.recency_days} onChange={updateClusterForm('recency_days')} />
                    <InputField label="DONATIONS (LAST 12M)" value={clusterForm.donation_count_last_12m} onChange={updateClusterForm('donation_count_last_12m')} />
                    <InputField label="LIFETIME DONATIONS" value={clusterForm.lifetime_donation_count} onChange={updateClusterForm('lifetime_donation_count')} />
                    <InputField label="PROPENSITY SCORE" value={clusterForm.donation_propensity_score} onChange={updateClusterForm('donation_propensity_score')} />

                    <button 
                      type="submit" 
                      disabled={isClusterPredicting}
                      style={{ 
                        gridColumn: 'span 2', marginTop: '10px', padding: '13px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)', 
                        color: '#fff', fontWeight: '700', fontSize: '14px',
                        cursor: isClusterPredicting ? 'wait' : 'pointer', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                        boxShadow: '0 8px 20px -8px rgba(147,51,234,0.55)', 
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.3px',
                      }}
                      onMouseEnter={(e) => { if (!isClusterPredicting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(147,51,234,0.65)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(147,51,234,0.55)'; }}
                    >
                      {isClusterPredicting ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={16} />}
                      ASSIGN TO SEGMENT
                    </button>
                  </form>
                  <p style={{ fontSize: '11px', color: T.textFaint, marginTop: '10px', lineHeight: '1.5' }}>
                    Note: propensity score is a modeled composite normally computed by your existing warehouse pipeline for each donor. For a brand-new donor, estimate it (or wire this field up to your scoring formula) before submitting.
                  </p>
                </div>

                <div>
                  {clusterPrediction ? (
                    <div>
                      <div style={{ 
                        padding: '16px', borderRadius: '14px', 
                        background: clusterPrediction.archetype?.bg || '#faf5ff', 
                        border: `1px solid ${clusterPrediction.archetype?.border || '#e9d5ff'}`, 
                        marginBottom: '16px',
                        boxShadow: '0 8px 24px -12px rgba(147,51,234,0.25)',
                      }}>
                        <span style={{ 
                          backgroundColor: '#ffffff', 
                          color: clusterPrediction.archetype?.color || '#9333ea', 
                          border: `1px solid ${clusterPrediction.archetype?.border || '#e9d5ff'}`, 
                          fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px',
                        }}>
                          {clusterPrediction.archetype?.badge || `SEGMENT ${clusterPrediction.assigned_cluster + 1}`}
                        </span>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '10px 0 4px 0', color: T.text }}>
                          {clusterPrediction.archetype?.name || `Segment ${clusterPrediction.assigned_cluster + 1}`}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>
                          Nearest centroid in scaled feature space &middot; Segment {clusterPrediction.assigned_cluster + 1} of {selectedK}
                        </p>
                      </div>

                      <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.textMuted, margin: '0 0 8px 0' }}>DISTANCE TO EACH SEGMENT CENTROID</h4>
                      <p style={{ fontSize: '11px', color: T.textFaint, margin: '0 0 8px 0' }}>Shorter bar = closer match. The highlighted bar is the assigned segment.</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={clusterDistanceChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="segment" stroke={T.textFaint} tick={{ fontSize: 10 }} />
                          <YAxis stroke={T.textFaint} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: T.border, borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }} formatter={(val) => [val, 'Distance']} />
                          <Bar dataKey="distance" radius={[6, 6, 0, 0]}>
                            {clusterDistanceChartData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.isAssigned ? '#9333ea' : '#e2e8f0'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ 
                      height: '100%', minHeight: '260px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', 
                      color: T.textFaint, fontSize: '13px', 
                      border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '20px',
                      background: 'linear-gradient(135deg, #fbfdff 0%, #f8fafc 100%)',
                    }}>
                      Fill in the donor profile and click "Assign to Segment" to see which behavioral cluster they fall into.
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Association Rules */}
            <SectionCard accent="#0ea5e9">
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: T.text }}>Top 7 High-Impact Association Rules</h2>
              <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 16px 0' }}>
                FP-Growth mining on live warehouse data, curated to the 7 multi-concept rules selected for business action (sorted by Lift, descending)
              </p>

              <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${T.borderSoft}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ 
                      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', 
                      borderBottom: `2px solid ${T.border}`, color: '#475569',
                    }}>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>IF (Antecedent Condition)</th>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>THEN (Consequent Outcome)</th>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>Support</th>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>Confidence</th>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>Lift</th>
                      <th style={{ padding: '14px 12px', fontWeight: '700', letterSpacing: '0.3px' }}>Actionable Business Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associationData.map((rule, idx) => {
                      const consequentText = Array.isArray(rule.consequents) ? rule.consequents.join(' AND ') : rule.consequents;
                      const isYes = typeof consequentText === 'string' && consequentText.includes('Yes');
                      const isNo = typeof consequentText === 'string' && consequentText.includes('No');
                      const outcomeColor = isYes ? '#059669' : isNo ? '#dc2626' : '#2563eb';
                      const antecedentText = Array.isArray(rule.antecedents) ? rule.antecedents.join(' AND ') : rule.antecedents;

                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: idx === associationData.length - 1 ? 'none' : `1px solid ${T.borderSoft}`,
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fbfdff',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fbfdff'; }}
                        >
                          <td style={{ padding: '14px 12px', color: T.text, fontWeight: '500' }}>{antecedentText}</td>
                          <td style={{ padding: '14px 12px', color: outcomeColor, fontWeight: '600' }}>{consequentText}</td>
                          <td style={{ padding: '14px 12px', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{(rule.support * 100).toFixed(2)}%</td>
                          <td style={{ padding: '14px 12px', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{(rule.confidence * 100).toFixed(2)}%</td>
                          <td style={{ padding: '14px 12px', color: '#059669', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{rule.lift?.toFixed(4)}x</td>
                          <td style={{ padding: '14px 12px', color: '#475569', fontSize: '12.5px', lineHeight: '1.4' }}>
                            {rule.strategy || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* VIEW 2: OLAP DATA CUBE */}
        {activeTab === 'olap' && <OlapView />}
          
      </main>
    </div>
  );
}

// ---------- Subcomponents ----------

// Premium section wrapper: white card, soft shadow, colored top accent stripe,
// optional hover lift. Used for every major panel on the page.
function SectionCard({ children, accent = '#2563eb', style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
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
      {/* Top accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${accent} 0%, ${accent}88 60%, transparent 100%)`,
        opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function IconBadge({ children, color = '#2563eb', bg = '#eff6ff' }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${bg} 0%, ${color}18 100%)`,
      padding: '10px',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${color}22`,
      boxShadow: `0 4px 12px -6px ${color}55`,
    }}>
      {children}
    </div>
  );
}

function MetricCard({ title, value, sub, icon, bg, accent = '#2563eb' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        position: 'relative',
        backgroundColor: T.surface, 
        borderRadius: '16px', 
        padding: '20px', 
        border: `1px solid ${T.border}`, 
        boxShadow: hovered ? T.shadowHover : T.shadow, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
        background: `linear-gradient(180deg, ${accent} 0%, ${accent}33 100%)`,
      }} />
      <div style={{ paddingLeft: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted, letterSpacing: '0.5px' }}>{title}</span>
        <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 4px 0', color: T.text, letterSpacing: '-0.5px' }}>{value}</h3>
        <span style={{ fontSize: '12px', color: T.textMuted }}>{sub}</span>
      </div>
      <IconBadge color={accent} bg={bg}>
        {icon}
      </IconBadge>
    </div>
  );
}

function InputField({ label, value, onChange, step = "1" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: T.textMuted, marginBottom: '5px', letterSpacing: '0.4px' }}>{label}</label>
      <input 
        type="number" 
        step={step} 
        value={value} 
        onChange={onChange} 
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ 
          width: '100%', 
          backgroundColor: focused ? '#ffffff' : T.surfaceAlt, 
          color: T.text, 
          border: `1px solid ${focused ? T.blue : '#cbd5e1'}`, 
          borderRadius: '8px', 
          padding: '9px 11px', 
          fontSize: '13px', fontWeight: '500', 
          boxSizing: 'border-box',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 2px rgba(15,23,42,0.03)',
        }} 
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: T.textMuted, marginBottom: '5px', letterSpacing: '0.4px' }}>{label}</label>
      <select 
        value={value} 
        onChange={onChange} 
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ 
          width: '100%', 
          backgroundColor: focused ? '#ffffff' : T.surfaceAlt, 
          color: T.text, 
          border: `1px solid ${focused ? T.blue : '#cbd5e1'}`, 
          borderRadius: '8px', 
          padding: '9px 11px', 
          fontSize: '13px', fontWeight: '500', 
          boxSizing: 'border-box',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 2px rgba(15,23,42,0.03)',
        }}
      >
        {options.map((o, idx) => <option key={idx} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function ClusterMetric({ label, value }) {
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', color: '#475569',
      paddingBottom: '6px', borderBottom: '1px dashed rgba(148,163,184,0.35)',
    }}>
      <span>{label}:</span>
      <span style={{ color: T.text, fontWeight: '700' }}>{value}</span>
    </div>
  );
}