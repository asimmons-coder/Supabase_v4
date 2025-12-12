import React, { useState } from 'react';
// IMPORT ROUTER AND NAVIGATION COMPONENTS
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient'; // Adjust path if necessary
// IMPORT NEW SECURITY COMPONENTS
import LoginPage from './components/LoginPage'; 
import ProtectedRoute from './components/ProtectedRoute'; 

import SessionDashboard from './components/SessionDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

// --- 1. The Dashboard Content (Now a separate component) ---
// This component contains all your sidebar and dashboard rendering logic
const MainPortalLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'employees'>('sessions');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Sign the user out of Supabase
    await supabase.auth.signOut();
    // Redirect them to the login page
    navigate('/login'); 
  };

  return (
    <div className="min-h-screen flex bg-boon-bg font-sans text-boon-dark">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-100 flex items-center justify-start">
          <img 
            src="https://res.cloudinary.com/djbo6r080/image/upload/v1764863780/Wordmark_Blue_16_aw7lvc.png" 
            alt="Boon Logo" 
            className="h-6 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem 
            active={activeTab === 'sessions'} 
            onClick={() => setActiveTab('sessions')}
            icon={<LayoutDashboard size={20} />} 
            label="Sessions" 
          />
          <NavItem 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')}
            icon={<Users size={20} />} 
            label="Employees" 
          />
          <div className="pt-4 mt-4 border-t border-gray-100">
             <NavItem icon={<Settings size={20} />} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleSignOut} // ADDED SIGN OUT LOGIC
            className="flex items-center gap-3 text-gray-500 hover:text-boon-red w-full px-4 py-3 rounded-lg hover:bg-red-50 transition font-medium"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
           {activeTab === 'sessions' ? <SessionDashboard /> : <EmployeeDashboard />}
        </div>
      </main>
    </div>
  );
};

// --- Your NavItem component (unchanged) ---
const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold
      ${active 
        ? 'bg-boon-blue/10 text-boon-blue' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-boon-dark'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);


// --- 2. The Root App Component with Security Routes ---
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTE: Login Page */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* PROTECTED ROUTE: Main Dashboard */}
        <Route 
          path="/*" // Matches the root path and everything else
          element={
            <ProtectedRoute>
              {/* This content only loads if the user is authenticated */}
              <MainPortalLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;