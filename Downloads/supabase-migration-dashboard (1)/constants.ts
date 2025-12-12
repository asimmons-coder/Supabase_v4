import { SessionWithEmployee, Employee } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 1, first_name: 'Alice', last_name: 'Johnson', program: 'Engineering', avatar_url: 'https://picsum.photos/seed/alice/100/100' },
  { id: 2, first_name: 'Bob', last_name: 'Smith', program: 'Design', avatar_url: 'https://picsum.photos/seed/bob/100/100' },
  { id: 3, first_name: 'Charlie', last_name: 'Davis', program: 'Marketing', avatar_url: 'https://picsum.photos/seed/charlie/100/100' },
  { id: 4, first_name: 'Diana', last_name: 'Prince', program: 'Executive', avatar_url: 'https://picsum.photos/seed/diana/100/100' },
  { id: 5, first_name: 'Evan', last_name: 'Wright', program: 'Engineering', avatar_url: 'https://picsum.photos/seed/evan/100/100' },
];

export const MOCK_SESSIONS: SessionWithEmployee[] = [
  {
    id: 101,
    created_at: '2023-10-25T10:00:00Z',
    session_date: '2023-10-25',
    duration_minutes: 45,
    notes: 'Quarterly review discussion.',
    employee_id: 1,
    employee_manager: {
      first_name: 'Alice',
      last_name: 'Johnson',
      program: 'Engineering',
      avatar_url: 'https://picsum.photos/seed/alice/100/100'
    }
  },
  {
    id: 102,
    created_at: '2023-10-26T14:00:00Z',
    session_date: '2023-10-26',
    duration_minutes: 30,
    notes: 'Sync on project Alpha.',
    employee_id: 2,
    employee_manager: {
      first_name: 'Bob',
      last_name: 'Smith',
      program: 'Design',
      avatar_url: 'https://picsum.photos/seed/bob/100/100'
    }
  },
  {
    id: 103,
    created_at: '2023-10-27T09:30:00Z',
    session_date: '2023-10-27',
    duration_minutes: 60,
    notes: 'Marketing strategy workshop.',
    employee_id: 3,
    employee_manager: {
      first_name: 'Charlie',
      last_name: 'Davis',
      program: 'Marketing',
      avatar_url: 'https://picsum.photos/seed/charlie/100/100'
    }
  },
  {
    id: 104,
    created_at: '2023-10-28T11:00:00Z',
    session_date: '2023-10-28',
    duration_minutes: 45,
    notes: 'Leadership coaching session.',
    employee_id: 4,
    employee_manager: {
      first_name: 'Diana',
      last_name: 'Prince',
      program: 'Executive',
      avatar_url: 'https://picsum.photos/seed/diana/100/100'
    }
  },
  {
    id: 105,
    created_at: '2023-10-29T15:15:00Z',
    session_date: '2023-10-29',
    duration_minutes: 25,
    notes: 'Quick standup regarding deployment.',
    employee_id: 5,
    employee_manager: {
      first_name: 'Evan',
      last_name: 'Wright',
      program: 'Engineering',
      avatar_url: 'https://picsum.photos/seed/evan/100/100'
    }
  },
   {
    id: 106,
    created_at: '2023-10-30T10:00:00Z',
    session_date: '2023-10-30',
    duration_minutes: 50,
    notes: 'Deep dive into architecture.',
    employee_id: 1,
    employee_manager: {
      first_name: 'Alice',
      last_name: 'Johnson',
      program: 'Engineering',
      avatar_url: 'https://picsum.photos/seed/alice/100/100'
    }
  },
];