
import { supabase } from './supabaseClient';
import { Employee, SessionWithEmployee } from '../types';

/**
 * Helper to fetch all rows from a Supabase query by paginating automatically.
 * @param queryCallback Function that returns a Supabase query builder with range applied
 * @param silent If true, suppresses console.error logs for this fetch (useful for fallback attempts)
 */
const fetchAllPages = async <T>(
  tableName: string, 
  selectQuery: string, 
  filters: (query: any) => any = (q) => q,
  orderBy: string | null = null,
  silent: boolean = false
): Promise<T[]> => {
  let allData: T[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  if (!silent) {
    console.log(`📡 Starting paginated fetch for '${tableName}'...`);
  }

  try {
    while (hasMore) {
      const from = page * pageSize;
      const to = (page + 1) * pageSize - 1;

      // Build Query
      let query = supabase
        .from(tableName)
        .select(selectQuery);

      // Apply filters (like .not null)
      query = filters(query);

      // Apply Order (Optional)
      if (orderBy) {
        query = query.order(orderBy, { ascending: false });
      }

      // Apply Range
      const { data, error } = await query.range(from, to);

      if (error) {
        // CRITICAL FIX: Throw the raw error object so property 'code' is preserved for error handling logic.
        throw error;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data] as T[];
        if (!silent) {
          console.log(`   - Page ${page + 1}: Fetched ${data.length} rows.`);
        }
        
        // If we got fewer rows than requested, we've reached the end
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      page++;
      
      // Safety break for very large datasets
      if (page > 50) {
        console.warn('⚠️ Safety limit reached (50k rows). Stopping fetch.');
        break;
      }
    }
  } catch (err: any) {
    // CRITICAL FIX: Handle standard Error objects vs Supabase Error objects
    const errorDetails = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
    
    // Only log error if not in silent mode
    if (!silent) {
      console.error(`Error fetching pages for ${tableName}:`, errorDetails);
    }
    throw err;
  }

  if (!silent) {
    console.log(`✅ Finished fetching '${tableName}'. Total rows: ${allData.length}`);
  }
  return allData;
};

/**
 * Fetches employees. 
 * STRATEGY: 
 * 1. Try 'employee_manager'. 
 * 2. If empty/error, extract unique employees from 'session_tracking' (User's new schema).
 */
export const getEmployeeRoster = async (): Promise<Employee[]> => {
  // 1. Try standard roster table with pagination (Silent mode enabled to avoid noise if table missing)
  let rosterData: Employee[] = [];
  try {
    rosterData = await fetchAllPages<Employee>('employee_manager', '*', (q) => q, null, true);
  } catch (e) {
    console.warn("Could not fetch employee_manager (might not exist or be empty).");
  }

  // If we have roster data, return it
  if (rosterData && rosterData.length > 0) {
    return rosterData;
  }

  // 2. Fallback: Extract employees from session_tracking if roster is empty
  console.log("⚠️ [Roster Fallback] 'employee_manager' returned no data. Extracting unique employees from 'session_tracking'...");
  
  // We allow this to throw errors now instead of returning MOCK data, 
  // ensuring we are truly connecting to Supabase or failing visibly.
  const sessionData = await fetchAllPages(
    'session_tracking', 
    '*', 
    (q) => q.not('employee_name', 'is', null),
    'created_at' // Add sort for stability
  );

  // Deduplicate employees from session data
  const uniqueEmployees = new Map<string, Employee>();
  
  if (sessionData) {
    sessionData.forEach((s: any) => {
      const name = s.employee_name;
      if (!name) return;
      
      // Use employee_id as key if available, otherwise use name
      const key = s.employee_id || name;
      
      // We only set the employee once, but we want to grab the most "complete" record
      const existing = uniqueEmployees.get(key);
      const hasMoreInfo = !existing?.program && (s.program || s.program_name);

      if (!existing || hasMoreInfo) {
        uniqueEmployees.set(key, {
          id: s.employee_id || `gen-${Math.random().toString(36).substr(2, 9)}`,
          full_name: name,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          
          // Map Program aggressively
          program: s.program || s.program_name || s.Program || s.Program_Name,
          
          // Map Account/Department aggressively
          account_name: s.account_name || s.Account_Name, 
          company: s.account_name || s.Account_Name,
          department: s.department || s.Department || s.account_name, // Fallback to account name if dept missing
          
          // Map Email aggressively
          email: s.email || s.Email || s.email_address || s.company_email || s.Company_Email,
          company_email: s.company_email || s.Company_Email || s.email,

          created_at: s.created_at
        });
      }
    });
  }

  const extractedEmployees = Array.from(uniqueEmployees.values());
  
  if (extractedEmployees.length > 0) {
    console.log(`✅ Extracted ${extractedEmployees.length} unique employees from session logs.`);
    return extractedEmployees;
  }

  return [];
};

/**
 * Fetches sessions.
 * Handles both Joined (standard) and Flat (denormalized) schemas.
 */
export const getDashboardSessions = async (): Promise<SessionWithEmployee[]> => {
  // 1. Try fetching with Join first
  try {
    const joinData = await fetchAllPages<SessionWithEmployee>(
      'session_tracking',
      `
        *,
        employee_manager (
          first_name,
          last_name,
          avatar_url
        )
      `,
      (q) => q,
      'session_date',
      true // Silent mode: Don't log error if this fails, just fallback
    );
    return joinData;
  } catch (error: any) {
    console.warn(`[Supabase] Join fetch failed (likely schema mismatch). Attempting flat fetch...`);
  }

  // 2. Fallback: Fetch raw sessions and manually map
  // We allow this to throw errors to ensure we are connecting to Supabase.
  const rawData = await fetchAllPages<any>(
    'session_tracking',
    '*',
    (q) => q,
    'created_at' // Changed from 'session_date' to 'created_at' to be safer against sorting errors
  );
  
  // Transform flat data
  const adaptedData = (rawData || []).map((s: any) => {
    if (!s.employee_manager) {
      const name = s.employee_name || 'Unknown';
      return {
        ...s,
        employee_manager: {
          full_name: name,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          program: s.program || s.program_name || s.Program,
          avatar_url: null
        }
      };
    }
    return s;
  });

  return adaptedData as SessionWithEmployee[];
};
