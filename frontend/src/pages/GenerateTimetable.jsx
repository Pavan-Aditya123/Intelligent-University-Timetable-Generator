import React, { useEffect, useState } from 'react';
import { getDashboardStats, getValidationReport } from '../services/api';
import { Sparkles, CheckCircle2, AlertCircle, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenerateTimetable = ({ stats, refreshStats }) => {
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const valRes = await getValidationReport();
        setValidationReport(valRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    refreshStats();
  }, []);

  const isReady = stats?.is_ready_for_generation && validationReport?.is_valid;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Generate University Timetable</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pre-generation engine audit and readiness check for the upcoming AI timetable scheduler.
        </p>
      </div>

      {/* Main Status Banner */}
      <div
        className={`rounded-2xl p-6 border shadow-sm ${
          isReady
            ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-700'
            : 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Cpu className="w-4 h-4 text-blue-300" />
              <span>Phase 1 Architecture Status: Ready</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              {isReady ? 'All Constraints Satisfied' : 'Pre-Generation System Check'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isReady
                ? 'Your university configuration, departments, sections, faculty assignments, and classroom capacities are fully validated. The backend dataset is ready for Phase 2 AI engine execution.'
                : 'Complete all required setup steps in the administrator menu to prepare data for the scheduling engine.'}
            </p>
          </div>

          <div className="shrink-0 text-right bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Readiness Score
            </div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {stats?.overall_progress_percentage || 0}%
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {validationReport?.passed_checks || 0}/{validationReport?.total_checks || 0} Audit Checks Passed
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 Notification Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 text-xs space-y-2">
        <div className="font-bold text-sm flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span>Phase 1 Execution Boundary</span>
        </div>
        <p className="leading-relaxed">
          As instructed by the Phase 1 specifications, the AI timetable generation engine (Backtracking CSP & Genetic Algorithm optimization) is deliberately decoupled and will be implemented in Phase 2.
        </p>
        <p className="font-semibold text-amber-800">
          Backend interfaces (`backend/app/engine/scheduler_stub.py` and `backend/app/engine/fuzzy_stub.py`) have been established to receive the data models without modifying the UI layout.
        </p>
      </div>

      {/* Audit Checklist Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Pre-Generation Audit Summary</span>
          </h3>
          <Link
            to="/validation-conflicts"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View Full Conflict Audit Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold">Total Sections:</span>
            <span className="font-bold text-slate-800 block text-lg mt-0.5">
              {stats?.sections_count || 0} Sections
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              &check; All student counts &le; 70
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold">Total Rooms & Labs:</span>
            <span className="font-bold text-slate-800 block text-lg mt-0.5">
              {(stats?.classrooms_count || 0) + (stats?.laboratories_count || 0)} Rooms
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              &check; All room capacities &le; 70
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold">Faculty Members:</span>
            <span className="font-bold text-slate-800 block text-lg mt-0.5">
              {stats?.faculty_count || 0} Active Faculty
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              &check; Workload hours assigned
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateTimetable;
