
import React, { useEffect, useState } from 'react';
import { getEmployeeRoster } from '../lib/dataFetcher';
import { Employee } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  ArrowUp,
  AlertCircle,
  Database,
  Pencil,
  Trash2,
  Ban,
  MoreHorizontal
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('All Programs');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeRoster();
        if (mounted) {
          // Sort by Last Name by default
          const sorted = sortEmployees(data);
          setEmployees(sorted);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Employee Load Error:", err);
          setError(err.message || "Failed to load employee roster.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  // Helpers to safely extract First/Last Name
  const getFirstName = (emp: Employee): string => {
    if (emp.first_name) return emp.first_name;
    const fullName = emp.employee_name || emp.full_name || emp.name || '';
    if (!fullName) return '-';
    return fullName.trim().split(' ')[0];
  };

  const getLastName = (emp: Employee): string => {
    if (emp.last_name) return emp.last_name;
    const fullName = emp.employee_name || emp.full_name || emp.name || '';
    if (!fullName) return '-';
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  };

  const sortEmployees = (list: Employee[]) => {
    return [...list].sort((a, b) => {
      const nameA = getLastName(a).toLowerCase();
      const nameB = getLastName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Filter Logic
  const filteredEmployees = employees.filter(emp => {
    const allValues = Object.values(emp).join(' ').toLowerCase();
    const matchesSearch = allValues.includes(searchTerm.toLowerCase());
    
    // Broad program match
    const program = emp.program || emp.program_name || emp.Program || 'Unassigned';
    const matchesFilter = filterProgram === 'All Programs' || program === filterProgram;
    
    return matchesSearch && matchesFilter;
  });

  // Unique programs for dropdown
  const programs = ['All Programs', ...Array.from(new Set(
    employees.map(e => e.program || e.program_name || e.Program).filter(Boolean)
  ))];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-16 bg-gray-200 rounded-lg w-full"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-sm border border-red-100 max-w-3xl mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-boon-red mb-4" />
        <h3 className="text-xl font-bold text-gray-800">Unable to load Roster</h3>
        <p className="text-gray-500 mt-2">{error}</p>
        <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-boon-dark tracking-tight uppercase">Employee Manager</h1>
        <p className="text-gray-500 font-medium">
          Manage roster, coaching programs, and employment status.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Find by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-boon-blue transition text-sm text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div className="relative w-full md:w-48">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
             <select 
              className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-boon-blue cursor-pointer text-sm appearance-none text-gray-700"
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
            >
              {programs.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full md:w-auto">
           <button 
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Inspect Raw Data"
          >
            <Database className="w-4 h-4" />
          </button>
          
          <button className="flex items-center justify-center gap-2 px-6 py-2 bg-boon-blue text-white text-sm font-bold rounded-lg hover:bg-boon-darkBlue transition shadow-sm w-full md:w-auto uppercase tracking-wide">
            <Plus className="w-4 h-4" />
            ADD EMPLOYEE
          </button>
        </div>
      </div>

      {/* Debug View */}
      {showDebug && (
        <div className="bg-boon-dark rounded-xl p-4 shadow-xl border border-gray-700 overflow-hidden text-left">
           <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Raw Data Inspector (First Record)</h3>
           <pre className="text-xs text-boon-lightBlue font-mono overflow-auto max-h-40">
             {JSON.stringify(employees[0] || {}, null, 2)}
           </pre>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">FIRST NAME</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-1">
                    LAST NAME
                    <ArrowUp className="w-3 h-3 text-boon-blue" />
                  </div>
                </th>
                <th className="px-6 py-4">COMPANY EMAIL</th>
                <th className="px-6 py-4">PROGRAM</th>
                <th className="px-6 py-4">DEPARTMENT</th>
                <th className="px-6 py-4">JOB TITLE</th>
                <th className="px-6 py-4">COMPANY ROLE</th>
                <th className="px-6 py-4">START DATE</th>
                <th className="px-6 py-4">END DATE</th>
                <th className="px-6 py-4">NOTES</th>
                <th className="px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const firstName = getFirstName(emp);
                  const lastName = getLastName(emp);
                  
                  // Aggressive Email mapping
                  const email = emp.company_email || emp.email || emp.email_address || emp.contact_email || emp.Email || '-';
                  
                  // Aggressive Program mapping
                  const program = emp.program || emp.program_name || emp.Program || emp.Program_Name;
                  
                  const department = emp.department || emp.account_name || '-';
                  const title = emp.job_title || emp.title || '-';
                  const role = emp.company_role || '-';
                  const startDate = emp.start_date || '-';
                  const endDate = emp.end_date || '-';
                  const notes = emp.notes || '-';

                  return (
                    <tr key={emp.id} className="hover:bg-boon-blue/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {firstName}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {email}
                      </td>
                      <td className="px-6 py-4">
                        {program ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-boon-blue/10 text-boon-blue border border-boon-blue/20 uppercase tracking-wide whitespace-nowrap">
                            {program}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {department}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {title}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                         {role}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                         {startDate}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                         {endDate}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={notes}>
                         {notes}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button className="text-gray-400 hover:text-boon-blue transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-orange-500 transition-colors" title="Deactivate/Cancel">
                            <Ban className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-boon-red transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-gray-500 bg-white">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No employees found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or adding a new employee.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer (Static for now) */}
        {filteredEmployees.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
             <span>Showing {filteredEmployees.length} records</span>
             <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 w-1/3"></div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;