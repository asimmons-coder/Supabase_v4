
import React, { useEffect, useState, useMemo } from 'react';
import { getDashboardSessions, getEmployeeRoster } from '../lib/dataFetcher';
import { SessionWithEmployee, Employee } from '../types';
import { 
  Users, 
  Calendar, 
  Activity, 
  Search, 
  Filter, 
  AlertCircle,
  Database,
  ArrowRight,
  Code,
  CheckCircle2,
  Copy,
  TrendingUp,
  Clock,
  ArrowUp
} from 'lucide-react';

const SessionDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('All');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        // Execute both fetches in parallel for performance
        const [sessionsData, rosterData] = await Promise.all([
          getDashboardSessions(),
          getEmployeeRoster()
        ]);
        
        if (mounted) {
          setSessions(sessionsData);
          setEmployees(rosterData);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Dashboard Load Error:", err);
          const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => { mounted = false; };
  }, []);

  // --- Aggregation Logic ---
  const aggregatedStats = useMemo(() => {
    const statsMap = new Map<string, {
      id: string | number;
      name: string;
      program: string;
      avatar_url?: string;
      completed: number;
      noshow: number;
      scheduled: number;
      total: number;
      latestSession: Date | null;
    }>();

    // 1. Initialize with Roster to ensure we show employees with 0 sessions
    employees.forEach(emp => {
      const name = emp.full_name || emp.employee_name || emp.name || 'Unknown';
      const key = name.toLowerCase();
      
      statsMap.set(key, {
        id: emp.id,
        name: name,
        program: emp.program || emp.program_name || 'Unassigned',
        avatar_url: emp.avatar_url,
        completed: 0,
        noshow: 0,
        scheduled: 0,
        total: 0,
        latestSession: null
      });
    });

    // 2. Process Sessions
    sessions.forEach(session => {
      // Determine Employee Name
      const emp = session.employee_manager;
      const name = emp?.full_name || emp?.first_name 
                   ? `${emp.first_name} ${emp.last_name || ''}`.trim()
                   : (session.employee_name || 'Unknown Employee');
      
      const key = name.toLowerCase();

      // If employee not in roster, add them now
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          id: session.employee_id || session.id, // Fallback ID
          name: name,
          program: session.program || session.program_name || 'Unassigned',
          avatar_url: emp?.avatar_url,
          completed: 0,
          noshow: 0,
          scheduled: 0,
          total: 0,
          latestSession: null
        });
      }

      const entry = statsMap.get(key)!;
      entry.total += 1;

      // Status Logic: Use 'status' column if available, else infer from date
      const statusRaw = (session.status || '').toLowerCase();
      const sessionDate = new Date(session.session_date);
      const isPast = sessionDate < new Date();

      // UPDATED LOGIC: Client No Show OR Late Cancel = No-Show
      if (statusRaw.includes('no show') || statusRaw.includes('noshow') || statusRaw.includes('late cancel')) {
        entry.noshow += 1;
      } else if (statusRaw.includes('completed') || (statusRaw === '' && isPast)) {
        entry.completed += 1;
      } else {
        entry.scheduled += 1;
      }

      // Track latest session for sorting/freshness
      if (!entry.latestSession || sessionDate > entry.latestSession) {
        entry.latestSession = sessionDate;
      }
    });

    return Array.from(statsMap.values());
  }, [sessions, employees]);


  // --- Filtering ---
  const filteredData = aggregatedStats.filter(stat => {
    const matchesSearch = stat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterProgram === 'All' || stat.program === filterProgram;
    return matchesSearch && matchesFilter;
  });

  // --- Derived KPIs ---
  const totalEmployees = filteredData.length;
  const totalSessions = filteredData.reduce((acc, curr) => acc + curr.total, 0);
  const totalCompleted = filteredData.reduce((acc, curr) => acc + curr.completed, 0);
  
  // Avg Sessions per Employee
  const avgSessions = totalEmployees > 0 
    ? (totalSessions / totalEmployees).toFixed(1) 
    : '0.0';

  // Utilization: Simple logic (Completed / Total) * 100
  // Or (Total Sessions / (Employees * Expected)). Let's use Completed/Total for now.
  const utilization = totalSessions > 0 
    ? Math.round((totalCompleted / totalSessions) * 100) 
    : 0;

  // Programs List
  const programs = ['All', ...Array.from(new Set(aggregatedStats.map(s => s.program).filter(p => p !== 'Unassigned')))];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-12 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl mt-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-boon-red/20 max-w-7xl mx-auto mt-8">
        <AlertCircle className="w-16 h-16 text-boon-red mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
        <p className="text-gray-600 mb-6 max-w-2xl font-mono text-sm bg-gray-50 p-4 rounded border border-gray-200 break-all">{error}</p>
        
        <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-boon-blue text-white font-bold rounded-lg hover:bg-boon-darkBlue transition shadow-sm"
            >
              Retry Connection
            </button>
            <button 
             onClick={() => setShowSetup(!showSetup)}
             className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
                <Database className="w-4 h-4" />
                {showSetup ? 'Hide Schema Helper' : 'View Schema Helper'}
            </button>
        </div>

        {showSetup && (
          <div className="mt-8 text-left w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2">
            <SetupGuide />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-boon-dark tracking-tight uppercase">Session Tracking</h1>
            {filterProgram !== 'All' && (
              <span className="bg-boon-blue/10 text-boon-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {filterProgram}
              </span>
            )}
          </div>
          <p className="text-gray-500 font-medium flex items-center gap-2 text-sm">
             Viewing {totalEmployees} employees in this program
             <span className="text-gray-300">|</span>
             <Clock className="w-3.5 h-3.5" />
             {totalSessions} total sessions
          </p>
        </div>
        
        {/* SQL Helper Toggle */}
        <button 
             onClick={() => setShowSetup(!showSetup)}
             className="text-xs font-bold text-gray-400 hover:text-boon-blue transition flex items-center gap-1 uppercase tracking-wide"
        >
             <Code className="w-3 h-3" />
             {showSetup ? 'Hide Schema Helper' : 'Schema Helper'}
        </button>
      </div>

      {showSetup && <SetupGuide />}

      {/* KPI Cards Row - Using Boon Brand Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          title="TOTAL EMPLOYEES" 
          value={totalEmployees} 
          color="bg-boon-blue" 
          icon={<Users className="w-6 h-6 text-white/50" />}
        />
        <KPICard 
          title="UTILIZATION" 
          value={`${utilization}%`} 
          color="bg-boon-purple" 
          icon={<Activity className="w-6 h-6 text-white/50" />}
        />
        <KPICard 
          title="TOTAL SESSIONS" 
          value={totalSessions} 
          color="bg-boon-red" 
          icon={<Calendar className="w-6 h-6 text-white/50" />}
        />
        <KPICard 
          title="COMPLETED" 
          value={totalCompleted} 
          color="bg-boon-green" 
          icon={<CheckCircle2 className="w-6 h-6 text-white/50" />}
        />
        <KPICard 
          title="AVG SESSIONS" 
          value={avgSessions} 
          color="bg-boon-yellow" 
          icon={<TrendingUp className="w-6 h-6 text-white/50" />}
          textColor="text-boon-dark" // Yellow needs dark text for contrast
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-boon-blue" />
          Completed Sessions Trend
        </h3>
        {/* Custom SVG Chart */}
        <div className="h-48 w-full">
           <SimpleTrendChart sessions={sessions} />
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 bg-boon-bg rounded-lg group focus-within:ring-2 ring-boon-blue/30 transition">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-boon-blue" />
          <input 
            type="text" 
            placeholder="Search name..." 
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto px-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filter:</span>
          <div className="flex gap-1">
             {programs.slice(0, 4).map(prog => (
               <button 
                  key={prog}
                  onClick={() => setFilterProgram(prog)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition ${
                    filterProgram === prog 
                    ? 'bg-boon-blue/10 text-boon-blue' 
                    : 'text-gray-500 hover:bg-gray-50'
                  }`}
               >
                 {prog}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Employee Progress Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition">
                 <div className="flex items-center gap-1">
                   Employee Name
                   <ArrowUp className="w-3 h-3 text-boon-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Completed</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">No-Shows</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Scheduled</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((emp) => (
                <tr key={emp.id} className="hover:bg-boon-blue/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       {/* Avatar Logic */}
                       <div className="w-8 h-8 rounded-full bg-boon-lightBlue flex items-center justify-center text-xs font-bold text-boon-blue overflow-hidden">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt="" className="w-full h-full object-cover"/>
                          ) : (
                            emp.name.substring(0,2).toUpperCase()
                          )}
                       </div>
                       <span className="font-bold text-gray-800 text-sm">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-boon-blue/10 text-boon-blue border border-boon-blue/20 uppercase tracking-wide">
                      {emp.program}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-boon-green/20 text-boon-green font-bold text-sm">
                      {emp.completed}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.noshow > 0 ? (
                      <span className="text-boon-red font-bold text-sm">{emp.noshow}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                     {emp.scheduled > 0 ? (
                      <span className="text-gray-600 font-medium text-sm">{emp.scheduled}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-boon-dark text-base">{emp.total}</span>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No employees found matching your criteria.
                  </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Sub Components ---

const KPICard = ({ 
  title, 
  value, 
  color, 
  icon,
  textColor = "text-white" 
}: { 
  title: string, 
  value: string | number, 
  color: string, 
  icon: React.ReactNode,
  textColor?: string
}) => (
  <div className={`${color} ${textColor} rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-gray-200 transition-transform hover:-translate-y-1`}>
    {/* Background Shapes for Brand Styling */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute top-0 right-0 p-4 opacity-80">
      {icon}
    </div>
    
    <div className="relative z-10">
      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{title}</h4>
      <span className="text-4xl font-extrabold tracking-tight">{value}</span>
      {/* Decorative smile line */}
      <div className={`w-8 h-1 rounded-full mt-4 ${textColor === 'text-white' ? 'bg-white/30' : 'bg-black/10'}`}></div>
    </div>
  </div>
);

const SimpleTrendChart = ({ sessions }: { sessions: SessionWithEmployee[] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, value: number, label: string} | null>(null);

  // Process Real Data
  const chartData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    if (sessions.length === 0) return [];

    sessions.forEach(s => {
      const status = (s.status || '').toLowerCase();
      const sessionDate = new Date(s.session_date);
      const isPast = sessionDate < new Date();
      
      const isNoShow = status.includes('no show') || status.includes('noshow') || status.includes('late cancel');

      // Only count actual completed sessions
      if (!isNoShow && (status.includes('completed') || (status === '' && isPast))) {
         // YYYY-MM
         const key = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
         monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      }
    });

    // Sort chronologically
    const sortedKeys = Object.keys(monthlyCounts).sort();
    
    if (sortedKeys.length === 0) return [];

    return sortedKeys.map(key => {
       const [year, month] = key.split('-');
       const date = new Date(parseInt(year), parseInt(month)-1);
       return {
         label: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
         value: monthlyCounts[key]
       };
    });
  }, [sessions]);

  // Use mock data if no real data to keep the UI looking good for demo (or just show message)
  // For this request, we strictly want real data or empty state. 
  // If empty, we can just return a message.
  if (chartData.length === 0 && sessions.length > 0) {
     return <div className="flex items-center justify-center h-full text-gray-400 text-xs uppercase font-bold">No completed sessions found</div>;
  }
  // Fallback to empty if loading or strictly no sessions
  if (chartData.length === 0) return null;


  const width = 1000;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;
  
  // Calculate Scales
  const values = chartData.map(d => d.value);
  const maxVal = Math.max(...values, 5); // Minimum top of 5
  const minVal = 0;

  // Points generation
  const points = chartData.map((d, i) => {
    // If only 1 point, center it
    const xRatio = chartData.length > 1 ? i / (chartData.length - 1) : 0.5;
    const x = paddingX + xRatio * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Path generation
  const pathD = points.length > 1 
    ? `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')
    : points.length === 1 
      ? `M${paddingX},${points[0].y} L${width-paddingX},${points[0].y}` 
      : "";

  const areaD = points.length > 0 
    ? `${pathD} L${points[points.length-1].x},${height} L${points[0].x},${height} Z`
    : "";

  return (
    <div className="w-full h-full relative group">
      {/* Hover Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute z-20 bg-boon-dark text-white text-xs rounded-lg py-2 px-3 shadow-xl transform -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-75 border border-white/10"
          style={{ left: hoveredPoint.x, top: hoveredPoint.y - 12 }}
        >
           <div className="font-bold text-lg leading-none mb-1">{hoveredPoint.value}</div>
           <div className="text-boon-lightBlue text-[10px] uppercase font-bold tracking-wider">{hoveredPoint.label}</div>
           <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-boon-dark border-r border-b border-white/10 rotate-45"></div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
         <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#466FF6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#466FF6" stopOpacity="0"/>
            </linearGradient>
          </defs>

         {/* Grid Lines */}
         <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke="#f3f4f6" strokeWidth="1" />
         <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />

         {/* Area */}
         <path d={areaD} fill="url(#chartGradient)" />
         
         {/* Line */}
         <path d={pathD} fill="none" stroke="#466FF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

         {/* Interactive Points */}
         {points.map((p, i) => (
            <g key={i} 
               onMouseEnter={() => setHoveredPoint(p)}
               onMouseLeave={() => setHoveredPoint(null)}
               className="cursor-pointer"
            >
               {/* Invisible wide hit area for easier hovering */}
               <circle cx={p.x} cy={p.y} r="20" fill="transparent" />
               
               {/* Visible dot (Always visible or only on hover? Guidelines usually imply interaction reveals details, but dots look nice) */}
               <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint?.label === p.label ? 6 : 4} 
                  fill="white" 
                  stroke="#466FF6" 
                  strokeWidth={hoveredPoint?.label === p.label ? 3 : 2} 
                  className="transition-all duration-200"
               />
            </g>
         ))}
         
         {/* X Axis Labels */}
         {points.map((p, i) => {
             // Logic to avoid overcrowding labels if there are many months
             // Show label if it's the first, last, or every Nth point
             const showLabel = points.length <= 12 || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0;
             
             if (!showLabel) return null;
             
             return (
               <text 
                 key={i} 
                 x={p.x} 
                 y={height} 
                 dy="15" 
                 textAnchor="middle" 
                 className="text-[10px] fill-gray-400 font-bold uppercase"
                 style={{fontFamily: 'Barlow'}}
               >
                 {p.label}
               </text>
             )
         })}
      </svg>
    </div>
  );
}

const SetupGuide = () => {
  const sqlCode = `-- UPDATE SCHEMA to match new Denormalized Structure:
-- It seems you are using 'session_tracking' as the single source of truth now.

-- 1. Ensure columns exist
alter table session_tracking 
add column if not exists employee_name text,
add column if not exists program_name text,
add column if not exists account_name text;

-- 2. Index for performance (Optional but recommended)
create index if not exists idx_session_employee on session_tracking(employee_name);
`;

  return (
    <div className="bg-boon-dark text-white p-6 rounded-xl shadow-xl border border-gray-700 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-boon-blue/20 rounded-lg">
          <Code className="w-6 h-6 text-boon-blue" />
        </div>
        <div>
          <h3 className="text-lg font-bold">SQL Schema Assistant</h3>
          <p className="text-gray-400 text-sm">Run this if you are missing columns in Supabase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-boon-lightBlue mb-2">
              <CheckCircle2 className="w-4 h-4" /> 
              Single Table Mode
            </h4>
            <p className="text-sm text-gray-300">
               The dashboard is now reading directly from <code>session_tracking</code> columns:
               <br/>
               <span className="font-mono text-xs bg-gray-800 p-1 rounded">employee_name</span>, 
               <span className="font-mono text-xs bg-gray-800 p-1 rounded">program</span>, 
               <span className="font-mono text-xs bg-gray-800 p-1 rounded">account_name</span>.
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => navigator.clipboard.writeText(sqlCode)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="bg-black/50 p-4 rounded-lg border border-gray-700 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed h-64">
            {sqlCode}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default SessionDashboard;
