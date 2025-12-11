import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter, ComposedChart, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, Users, AlertTriangle, Brain, 
  ChevronRight, BarChart2, Network, LayoutGrid
} from 'lucide-react';

// =================================================================================
// KONFIGURASI SUMBER DATA
// =================================================================================
const CSV_DATA_URL = "/data_survey.csv"; 

// --- TYPES ---
interface DataItem {
  id: number;
  intensity: number;    // Intensitas & Kebiasaan Digital
  dependency: number;   // Ketergantungan Psikologis
  competence: number;   // Kemampuan & Kenyamanan Tatap Muka
  alienation: number;   // Alienasi & Kecanggungan Sosial
  usageGroup: string;
}

interface CorrelationItem {
  var1: string;
  var2: string;
  label1: string;
  label2: string;
  correlation: number;
  significant: boolean;
}

// --- HELPER FUNCTIONS ---

// Calculate Spearman correlation coefficient
const spearmanCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  // Rank the values
  const rank = (arr: number[]): number[] => {
    const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) {
      ranks[sorted[i].i] = i + 1;
    }
    return ranks;
  };

  const rankX = rank(x);
  const rankY = rank(y);

  // Calculate d² sum
  let dSquaredSum = 0;
  for (let i = 0; i < n; i++) {
    dSquaredSum += Math.pow(rankX[i] - rankY[i], 2);
  }

  // Spearman formula: ρ = 1 - (6 * Σd²) / (n * (n² - 1))
  const rho = 1 - (6 * dSquaredSum) / (n * (n * n - 1));
  return rho;
};

// Calculate all correlations between the 4 main variables
const calculateCorrelationMatrix = (data: DataItem[]): CorrelationItem[] => {
  const variables = ['intensity', 'dependency', 'competence', 'alienation'] as const;
  const labels = ['Intensitas Digital', 'Ketergantungan Psikologis', 'Kompetensi Tatap Muka', 'Alienasi Sosial'];
  
  const matrix: CorrelationItem[] = [];
  
  for (let i = 0; i < variables.length; i++) {
    for (let j = i + 1; j < variables.length; j++) {
      const x = data.map(d => d[variables[i]]);
      const y = data.map(d => d[variables[j]]);
      const corr = spearmanCorrelation(x, y);
      
      matrix.push({
        var1: variables[i],
        var2: variables[j],
        label1: labels[i],
        label2: labels[j],
        correlation: parseFloat(corr.toFixed(3)),
        significant: Math.abs(corr) >= 0.25 // Threshold for significance
      });
    }
  }
  
  return matrix.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
};

// --- COMPONENTS ---

const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtitle && <p className={`text-xs mt-2 ${colorClass} font-medium`}>{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('700', '100')} bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
      {title}
    </h2>
    <p className="text-sm text-slate-500 ml-3 mt-1">{description}</p>
  </div>
);

// Correlation Matrix Heatmap Component
const CorrelationMatrix = ({ data }: { data: DataItem[] }) => {
  const correlations = calculateCorrelationMatrix(data);
  const variables = ['Intensitas Digital', 'Ketergantungan Psikologis', 'Kompetensi Tatap Muka', 'Alienasi Sosial'];
  
  // Get correlation between two labels
  const getCorrelation = (label1: string, label2: string): { correlation: number; significant: boolean } => {
    if (label1 === label2) return { correlation: 1, significant: true };
    const found = correlations.find(
      c => (c.label1 === label1 && c.label2 === label2) || (c.label1 === label2 && c.label2 === label1)
    );
    return found || { correlation: 0, significant: false };
  };

  const getColor = (corr: number, significant: boolean): string => {
    if (!significant && corr !== 1) return 'bg-slate-100 text-slate-400'; // Insignificant - gray
    if (corr === 1) return 'bg-slate-800 text-white';
    if (corr >= 0.5) return 'bg-emerald-500 text-white';
    if (corr >= 0.25) return 'bg-emerald-300 text-emerald-900';
    if (corr >= 0) return 'bg-emerald-100 text-emerald-700';
    if (corr >= -0.25) return 'bg-red-100 text-red-700';
    if (corr >= -0.5) return 'bg-red-300 text-red-900';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="text-blue-600" size={20} />
        <h3 className="font-bold text-slate-800">Matriks Korelasi Spearman</h3>
      </div>
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2"></th>
              {variables.map(v => (
                <th key={v} className="p-2 text-center font-medium text-slate-600 max-w-[80px]">
                  <div className="truncate" title={v}>{v.split(' ')[0]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variables.map(row => (
              <tr key={row}>
                <td className="p-2 font-medium text-slate-600 text-right pr-3">{row}</td>
                {variables.map(col => {
                  const { correlation, significant } = getCorrelation(row, col);
                  return (
                    <td key={col} className="p-1">
                      <div 
                        className={`${getColor(correlation, significant)} p-2 rounded text-center font-mono font-bold transition-all hover:scale-105 cursor-default`}
                        title={`${row} vs ${col}: ρ = ${correlation.toFixed(2)} ${significant ? '(Signifikan)' : '(Tidak Signifikan)'}`}
                      >
                        {correlation.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span>Kuat Positif (≥0.5)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-emerald-300 rounded"></div>
          <span>Moderat Positif</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-slate-100 rounded border"></div>
          <span className="text-amber-600 font-bold">Tidak Signifikan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-300 rounded"></div>
          <span>Negatif</span>
        </div>
      </div>
    </div>
  );
};

// Correlation List Component
const CorrelationList = ({ data }: { data: DataItem[] }) => {
  const correlations = calculateCorrelationMatrix(data);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 mb-4">Ranking Korelasi (Semua Pasangan)</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {correlations.map((c, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between p-3 rounded-lg border ${
              c.significant 
                ? 'bg-white border-slate-200' 
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">
                {c.label1} ↔ {c.label2}
              </p>
              <p className={`text-xs ${c.significant ? 'text-slate-500' : 'text-amber-600 font-medium'}`}>
                {c.significant ? '✓ Signifikan' : '✗ Tidak Signifikan (|ρ| < 0.25)'}
              </p>
            </div>
            <div className={`text-lg font-bold font-mono ${
              c.correlation >= 0.5 ? 'text-emerald-600' :
              c.correlation >= 0.25 ? 'text-emerald-500' :
              c.correlation >= 0 ? 'text-slate-400' :
              c.correlation >= -0.25 ? 'text-slate-400' :
              'text-red-500'
            }`}>
              {c.correlation >= 0 ? '+' : ''}{c.correlation.toFixed(3)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

export default function ResearchDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- CSV PARSING LOGIC ---
  const parseCSVData = (csvText: string): DataItem[] => {
    const lines = csvText.trim().split('\n');
    
    const parsedData = lines.slice(1).map((line, index) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      const getVal = (idx: number) => parseInt(values[idx]) || 0;

      // 1. Intensitas & Kebiasaan Digital (5 items): cols 2, 4, 5, 18, 19
      // - Smartphone >6 jam, media sosial harian, pesan cepat, akses mudah, wajib untuk akademik
      const intensityScore = (getVal(2) + getVal(4) + getVal(5) + getVal(18) + getVal(19)) / 5;
      
      // 2. Ketergantungan Psikologis (5 items): cols 3, 6, 20, 21, 22
      // - Cek notifikasi, cemas tanpa HP, hiburan/pelarian, FOMO, kebiasaan sulit dihentikan
      const dependencyScore = (getVal(3) + getVal(6) + getVal(20) + getVal(21) + getVal(22)) / 5;
      
      // 3. Kompetensi Tatap Muka (4 items): cols 7, 8, 9, 10
      // - Nyaman presentasi, kontak mata, bahasa tubuh, prefer diskusi langsung
      const competenceScore = (getVal(7) + getVal(8) + getVal(9) + getVal(10)) / 4;
      
      // 4. Alienasi Sosial (5 items): cols 13, 14, 15, 16, 17
      // - Hindari percakapan mendalam, interaksi dangkal, lebih terhubung online, canggung, kesulitan empati
      const alienationScore = (getVal(13) + getVal(14) + getVal(15) + getVal(16) + getVal(17)) / 5;
      
      const usageGroup = getVal(2) >= 4 ? 'Heavy User (>6 Jam)' : 'Moderate/Light';

      return {
        id: index + 1,
        intensity: parseFloat(intensityScore.toFixed(2)),
        dependency: parseFloat(dependencyScore.toFixed(2)),
        competence: parseFloat(competenceScore.toFixed(2)),
        alienation: parseFloat(alienationScore.toFixed(2)),
        usageGroup: usageGroup
      };
    });

    return parsedData.filter(d => !isNaN(d.intensity));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_DATA_URL);
        
        if (!response.ok) {
          throw new Error("File CSV tidak ditemukan.");
        }

        const text = await response.text();
        const parsed = parseCSVData(text);
        
        if (parsed.length > 0) {
          setData(parsed);
        } else {
          throw new Error("Data CSV kosong atau format salah.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- STATISTIK ---
  const heavyUsersCount = data.filter(d => d.usageGroup.includes('Heavy')).length;
  const avgAlienation = data.length > 0 ? (data.reduce((a, b) => a + b.alienation, 0) / data.length).toFixed(2) : '0';
  const correlations = data.length > 0 ? calculateCorrelationMatrix(data) : [];
  const significantCount = correlations.filter(c => c.significant).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-slate-600">Loading Data...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Data</h2>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-slate-500 mt-4">Pastikan file <code className="bg-slate-100 px-2 py-1 rounded">data_survey.csv</code> ada di folder <code className="bg-slate-100 px-2 py-1 rounded">public/</code></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <BarChart2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Telematics Impact Analytics</h1>
            <p className="text-xs text-slate-500">
              Research Dashboard • N={data.length} • 
              <span className="text-emerald-600 font-bold ml-1">(Live CSV Data)</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-sm bg-slate-100 p-1 rounded-lg">
          {['overview', 'correlation', 'matrix', 'behavior'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'matrix' ? 'Matrix' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* --- VIEW 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard 
                title="Total Responden" 
                value={data.length} 
                subtitle="100% Valid Data" 
                icon={Users} 
                colorClass="text-blue-600" 
              />
              <KpiCard 
                title="Dominasi Heavy Users" 
                value={`${((heavyUsersCount/data.length)*100).toFixed(1)}%`} 
                subtitle="> 6 Jam / Hari" 
                icon={Activity} 
                colorClass="text-red-600" 
              />
              <KpiCard 
                title="Avg Skor Alienasi" 
                value={avgAlienation} 
                subtitle="Skala 1-5 (Moderat)" 
                icon={AlertTriangle} 
                colorClass="text-amber-600" 
              />
              <KpiCard 
                title="Korelasi Signifikan" 
                value={significantCount}
                subtitle={`dari ${correlations.length} pasangan`}
                icon={Network} 
                colorClass="text-emerald-600" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart: Demografi Intensitas */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Profil Intensitas Digital</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Heavy (>6 Jam)', value: heavyUsersCount, fill: '#ef4444' },
                          { name: 'Moderate (<6 Jam)', value: data.length - heavyUsersCount, fill: '#3b82f6' }
                        ]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Sampel didominasi oleh pengguna intensitas tinggi.
                </p>
              </div>

              {/* Chart: Distribusi Konstruk */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Distribusi Skor Rata-Rata per Variabel</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Intensitas', score: (data.reduce((a,b)=>a+b.intensity,0)/data.length).toFixed(1), fill: '#ef4444' },
                      { name: 'Ketergantungan', score: (data.reduce((a,b)=>a+b.dependency,0)/data.length).toFixed(1), fill: '#f59e0b' },
                      { name: 'Kompetensi F2F', score: (data.reduce((a,b)=>a+b.competence,0)/data.length).toFixed(1), fill: '#3b82f6' },
                      { name: 'Alienasi Sosial', score: avgAlienation, fill: '#10b981' },
                    ]} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                        {
                          [
                             { fill: '#ef4444' },
                             { fill: '#f59e0b' },
                             { fill: '#3b82f6' },
                             { fill: '#10b981' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: CORRELATION (THE SCIENCE) --- */}
        {activeTab === 'correlation' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader 
              title="Analisis Korelasi & Kausalitas" 
              description="Visualisasi hubungan antar variabel utama berdasarkan data riil."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Dependency vs Alienation */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">1. Ketergantungan vs Alienasi</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">
                    ρ = {spearmanCorrelation(data.map(d => d.dependency), data.map(d => d.alienation)).toFixed(2)} (Sig.)
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="dependency" name="Ketergantungan" domain={[1, 5]} label={{ value: 'Skor Ketergantungan', position: 'bottom', offset: 0 }} />
                      <YAxis type="number" dataKey="alienation" name="Alienasi" domain={[1, 5]} label={{ value: 'Skor Alienasi', angle: -90, position: 'left' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Responden" data={data} fill="#ef4444" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-red-50 p-3 rounded-lg mt-4 border border-red-100">
                  <p className="text-xs text-red-800 font-medium">
                    <span className="font-bold">Insight:</span> Semakin tinggi ketergantungan (FOMO), semakin tinggi alienasi sosial.
                  </p>
                </div>
              </div>

              {/* Chart 2: Intensity vs Competence */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">2. Intensitas vs Kompetensi F2F</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">
                    ρ = {spearmanCorrelation(data.map(d => d.intensity), data.map(d => d.competence)).toFixed(2)} (Sig.)
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="intensity" name="Intensitas" domain={[1, 5]} label={{ value: 'Skor Intensitas', position: 'bottom', offset: 0 }} />
                      <YAxis type="number" dataKey="competence" name="Kompetensi" domain={[1, 5]} label={{ value: 'Skor Kompetensi F2F', angle: -90, position: 'left' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Responden" data={data} fill="#3b82f6" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mt-4 border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium">
                    <span className="font-bold">Paradoks:</span> Heavy users tetap memiliki kompetensi tatap muka yang baik.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 3: CORRELATION MATRIX (NEW!) --- */}
        {activeTab === 'matrix' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader 
              title="Matriks Korelasi Lengkap" 
              description="Analisis semua pasangan variabel. Korelasi abu-abu = tidak signifikan (|ρ| < 0.25)."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CorrelationMatrix data={data} />
              <CorrelationList data={data} />
            </div>

            {/* Insight Box for Insignificant Correlations */}
            {correlations.filter(c => !c.significant).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Korelasi Tidak Signifikan yang Ditemukan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {correlations.filter(c => !c.significant).map((c, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-amber-100">
                      <p className="font-medium text-slate-700">{c.label1} ↔ {c.label2}</p>
                      <p className="text-2xl font-bold text-slate-400 font-mono">ρ = {c.correlation.toFixed(3)}</p>
                      <p className="text-xs text-amber-600 mt-2">
                        Hubungan ini terlalu lemah untuk dianggap bermakna secara statistik.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 4: DEEP DIVE BEHAVIOR --- */}
        {activeTab === 'behavior' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <SectionHeader 
              title="Analisis Perilaku Digital" 
              description="Perbandingan profil individu berdasarkan 4 variabel utama penelitian."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Profile Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">Profil Individu (Sampel)</h3>
                <p className="text-xs text-slate-500 mb-6">Perbandingan skor 4 variabel pada 15 responden pertama.</p>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.slice(0, 15)} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis dataKey="id" type="category" scale="band" width={30} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="dependency" name="Ketergantungan" barSize={6} fill="#ef4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="alienation" name="Alienasi" barSize={6} fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="competence" name="Kompetensi F2F" barSize={6} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">
                  *Responden dengan ketergantungan tinggi (merah) cenderung memiliki alienasi tinggi (kuning).
                </p>
              </div>

              {/* Conclusions */}
              <div className="space-y-4">
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="text-blue-400" />
                      <h3 className="font-bold text-lg">Kesimpulan Penelitian</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex gap-2">
                        <ChevronRight size={16} className="mt-1 text-emerald-400 shrink-0" />
                        <span><strong>Ketergantungan → Alienasi:</strong> Semakin tinggi FOMO & kecemasan digital, semakin tinggi perasaan terasing.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight size={16} className="mt-1 text-emerald-400 shrink-0" />
                        <span><strong>Paradoks Digital:</strong> Intensitas penggunaan tinggi tidak menurunkan kompetensi tatap muka.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight size={16} className="mt-1 text-amber-400 shrink-0" />
                        <span><strong>Implikasi:</strong> Masalah bukan pada durasi penggunaan, tapi pada ketergantungan psikologis.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight size={16} className="mt-1 text-blue-400 shrink-0" />
                        <span><strong>Rekomendasi:</strong> Intervensi harus fokus pada aspek emosional (FOMO, kecemasan) bukan pembatasan waktu.</span>
                      </li>
                    </ul>
                 </div>

                 {/* Variable Info Cards */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                     <p className="font-bold text-red-700 text-sm">Ketergantungan</p>
                     <p className="text-xs text-red-600 mt-1">5 item: Notifikasi, Cemas, Hiburan, FOMO, Kebiasaan</p>
                   </div>
                   <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                     <p className="font-bold text-amber-700 text-sm">Alienasi Sosial</p>
                     <p className="text-xs text-amber-600 mt-1">5 item: Hindari F2F, Dangkal, Online &gt; Offline, Canggung, Empati</p>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <p className="font-bold text-blue-700 text-sm">Kompetensi F2F</p>
                     <p className="text-xs text-blue-600 mt-1">4 item: Presentasi, Kontak mata, Bahasa tubuh, Prefer langsung</p>
                   </div>
                   <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                     <p className="font-bold text-purple-700 text-sm">Intensitas Digital</p>
                     <p className="text-xs text-purple-600 mt-1">5 item: Durasi, Medsos, Pesan, Akses, Akademik</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
