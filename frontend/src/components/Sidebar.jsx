import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GitFork,
  Users,
  BookOpen,
  DoorClosed,
  Sliders,
  Sparkles,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/university-setup', label: 'University Setup', icon: Building2 },
    { path: '/departments-sections', label: 'Departments & Sections', icon: GitFork },
    { path: '/faculty', label: 'Faculty', icon: Users },
    { path: '/subjects-courses', label: 'Subjects / Courses', icon: BookOpen },
    { path: '/classrooms-labs', label: 'Classrooms & Labs', icon: DoorClosed },
    { path: '/preferences', label: 'Preferences', icon: Sliders },
    { path: '/generate-timetable', label: 'Generate Timetable', icon: Sparkles },
    { path: '/view-timetable', label: 'View Timetable', icon: CalendarDays },
    { path: '/validation-conflicts', label: 'Validation / Conflicts', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
          U
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-wide leading-tight">UniSchedule AI</h1>
          <p className="text-xs text-slate-400">Phase 1 Architecture</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 custom-scrollbar overflow-y-auto">
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Administrator Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-xs text-slate-400">
        <div className="font-semibold text-slate-300">FOAI Capstone Project</div>
        <p className="mt-0.5 text-slate-500">Knowledge Representation & Fuzzy Decision Systems</p>
      </div>
    </aside>
  );
};

export default Sidebar;
