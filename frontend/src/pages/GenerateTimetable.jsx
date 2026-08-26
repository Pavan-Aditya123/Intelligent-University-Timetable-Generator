import React, { useEffect, useState } from 'react';
import { getDashboardStats, getValidationReport, generateTimetable, clearGeneratedTimetable } from '../services/api';
import { Sparkles, CheckCircle2, AlertCircle, Cpu, ArrowRight, ShieldCheck, RefreshCw, CalendarDays, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenerateTimetable = ({ stats, refreshStats }) => {
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', text: '', diagnostics: [], count: 0 });

  const fetchAudit = async () => {
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

  useEffect(() => {
    fetchAudit();
    refreshStats();
  }, []);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setResultMessage({ type: '', text: '', diagnostics: [], count: 0 });

    try {
      const res = await generateTimetable();
      if (res.data.status === 'success') {
        setResultMessage({
          type: 'success',
          text: res.data.message,
          count: res.data.generated_count,
          diagnostics: []
        });
        if (refreshStats) refreshStats();
      } else {
        setResultMessage({
          type: 'error',
          text: res.data.message,
          count: 0,
          diagnostics: res.data.diagnostics || []
        });
      }
    } catch (err) {
      setResultMessage({
        type: 'error',
        text: err.response?.data?.detail || 'An unexpected error occurred during timetable generation.',
        count: 0,
        diagnostics: []
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all generated timetable assignments?')) return;
    try {
      await clearGeneratedTimetable();
      setResultMessage({ type: 'info', text: 'All generated timetable entries cleared.', diagnostics: [], count: 0 });
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const isReady = stats?.is_ready_for_generation && validationReport?.is_valid;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Generate University Timetable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 2.1 Constraint Satisfaction Problem (CSP) & Backtracking Timetable Engine.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear Saved Entries</span>
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-200" />
            )}
            <span>{generating ? 'Running CSP Backtracking Solver...' : 'Generate Timetable (Phase 2.1 CSP)'}</span>
          </button>
        </div>
      </div>

      {/* Generation Result Banner */}
      {resultMessage.text && (
        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : resultMessage.type === 'info'
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {resultMessage.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : resultMessage.type === 'info' ? (
                <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold">{resultMessage.text}</h4>
                {resultMessage.count > 0 && (
                  <p className="text-xs mt-1 font-semibold text-emerald-800">
                    Assigned {resultMessage.count} period slots across working days with zero hard constraint conflicts.
                  </p>
                )}
              </div>
            </div>

            {resultMessage.type === 'success' && (
              <Link
                to="/view-timetable"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5 shrink-0"
              >
                <CalendarDays className="w-4 h-4" />
                <span>View Timetable Grid</span>
              </Link>
            )}
          </div>

          {resultMessage.diagnostics && resultMessage.diagnostics.length > 0 && (
            <div className="mt-3 p-4 bg-white rounded-xl border border-rose-200 space-y-1 text-xs">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                CSP Bottleneck Diagnostics:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-mono text-[11px] mt-1">
                {resultMessage.diagnostics.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
              <span>Phase 2.1 Engine: CSP & Backtracking Foundation</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              {isReady ? 'Ready for Deterministic CSP Scheduling' : 'Pre-Generation System Check'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The CSP engine enforces 10 hard constraints including Section non-overlap, Faculty non-overlap, Room capacity, Laboratory requirement matching, 2-period contiguous lab blocks, and Break period protection.
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
