
export interface Employee {
  id: number | string;
  
  // Name variations
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  employee_name?: string; // Added from new schema
  display_name?: string;
  
  program?: string;
  program_name?: string; // Added from new schema
  Program?: string; // Case sensitive catch
  
  // Common variations for Company/Department info
  company_details?: string;
  company?: string;
  department?: string;
  organization?: string;
  title?: string;
  job_title?: string;
  account_name?: string; // Added from new schema
  company_role?: string; // Added for new UI requirements

  // Dates & Notes
  start_date?: string;
  end_date?: string;
  notes?: string;

  // Common variations for Email
  email?: string;
  email_address?: string;
  contact_email?: string;
  company_email?: string; // Specific request

  // Common variations for Phone
  phone?: string;
  phone_number?: string;
  mobile?: string;

  avatar_url?: string;

  // Index signature allows accessing any property returned by Supabase
  [key: string]: any;
}

export interface Session {
  id: number | string;
  created_at: string;
  session_date: string;
  
  // New columns from user schema
  record_id?: string;
  employee_name?: string;
  status?: string;
  program_name?: string;
  program?: string;
  account_name?: string;

  // Legacy/Standard columns (made optional as they might be missing in new schema)
  duration_minutes?: number;
  notes?: string;
  employee_id?: number | string;
}

// Joined Type
export interface SessionWithEmployee extends Session {
  employee_manager: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    program?: string;
    avatar_url?: string;
  } | null;
}