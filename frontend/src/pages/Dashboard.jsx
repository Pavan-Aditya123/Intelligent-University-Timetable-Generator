import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import SetupProgressCard from '../components/SetupProgressCard';
import { getDashboardStats } from '../services/api';
import {
  Building2,
  GitFork,
  Users,
  BookOpen,
  DoorClosed,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = ({ stats, refreshStats }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-400/30 uppercase tracking-wide">
            Phase 1: Architecture & Data Layer
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight">
            Intelligent University-Wide Timetable Generator
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Welcome to the Administrator Dashboard. Enter university setup configuration, departments, sections, faculty availability, course requirements, and classroom capacities to build the dataset for the AI scheduling engine.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/university-setup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Configure University</span>
            </Link>
            <Link
              to="/validation-conflicts"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Run Validation Audit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Departments"
          value={stats?.departments_count || 0}
          icon={Building2}
          color="blue"
          subtitle="Academic divisions"
        />
        <StatCard
          title="Sections"
          value={stats?.sections_count || 0}
          icon={GitFork}
          color="indigo"
          subtitle="Max 70 students/sec"
        />
        <StatCard
          title="Faculty"
          value={stats?.faculty_count || 0}
          icon={Users}
          color="purple"
          subtitle="Professors & Instructors"
        />
        <StatCard
          title="Subjects"
          value={stats?.subjects_count || 0}
          icon={BookOpen}
          color="emerald"
          subtitle="Theory & Lab courses"
        />
        <StatCard
          title="Classrooms"
          value={stats?.classrooms_count || 0}
          icon={DoorClosed}
          color="teal"
          subtitle="Max 70 capacity"
        />
        <StatCard
          title="Laboratories"
          value={stats?.laboratories_count || 0}
          icon={FlaskConical}
          color="amber"
          subtitle="Practical rooms"
        />
      </div>

      {/* Progress Checklist */}
      <SetupProgressCard stats={stats} />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">
              <GitFork className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Departments & Auto-Sections</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add departments (e.g. CSE, ECE, EEE) and automatically suggest section names (e.g. CSE-A, CSE-B, CSE-C) with editable student counts.
            </p>
          </div>
          <Link
            to="/departments-sections"
            className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Manage Sections &rarr;</span>
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Fuzzy Preference Controls</h4>
            <p className="text-xs text-slate-500 mt-1">
              Define scheduling priorities using administrator dropdowns for faculty time slots, consecutive class limits, and gap minimization.
            </p>
          </div>
          <Link
            to="/preferences"
            className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>Set Preferences &rarr;</span>
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Timetable Grid Viewer</h4>
            <p className="text-xs text-slate-500 mt-1">
              Inspect the timetable structure by section, faculty member, or room once generated by the AI engine.
            </p>
          </div>
          <Link
            to="/view-timetable"
            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View Timetable &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
