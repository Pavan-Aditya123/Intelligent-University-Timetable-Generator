import React, { useEffect, useState } from 'react';
import { getDashboardStats, getValidationReport, generateTimetable, clearGeneratedTimetable } from '../services/api';
import { Sparkles, CheckCircle2, AlertCircle, Cpu, ArrowRight, ShieldCheck, RefreshCw, CalendarDays, Trash2, TrendingUp, Award, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenerateTimetable = ({ stats, refreshStats }) => {
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resultData, setResultData] = useState(null);

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
    setResultData(null);

    try {
      const res = await generateTimetable();
      setResultData(res.data);
      if (res.data.status === 'success' && refreshStats) {
        refreshStats();
      }
    } catch (err) {
      setResultData({
        status: 'failed',
        message: err.response?.data?.detail || 'An unexpected error occurred during timetable optimization.',
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
      setResultData({ status: 'info', message: 'All generated timetable entries cleared.' });
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
          <h2 className="text-xl font-bold text-slate-800">Generate Optimized University Timetable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 2.2 Pipeline: CSP Feasibility Generator &rarr; Genetic Algorithm Multi-Objective Optimizer.
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
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{generating ? 'Running CSP + GA Optimization Pipeline...' : 'Generate Optimized Timetable (CSP + GA)'}</span>
          </button>
        </div>
      </div>

      {/* Optimization Performance Metrics Banner */}
      {resultData && resultData.status === 'success' && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Genetic Algorithm Optimization Metrics</h3>
            </div>
            <Link
              to="/view-timetable"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
            >
              <CalendarDays className="w-4 h-4" />
              <span>View Master Timetable Grid</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Initial CSP Fitness</span>
              <span className="text-xl font-extrabold text-slate-200 mt-1 block">{resultData.initial_fitness} / 100</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Baseline Feasible</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Optimized GA Fitness</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{resultData.optimized_fitness} / 100</span>
              <span className="text-[10px] text-emerald-300 font-semibold mt-0.5 block">Multi-Objective Score</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-amber-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Fitness Improvement</span>
              <span className="text-xl font-extrabold text-amber-400 mt-1 block flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-amber-400" />
                +{resultData.improvement_percent}%
              </span>
              <span className="text-[10px] text-amber-300 mt-0.5 block">Workload & Spreading</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Generations Run</span>
              <span className="text-xl font-extrabold text-indigo-300 mt-1 block">{resultData.generations}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Full GA Convergence</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Assigned Slots</span>
              <span className="text-xl font-extrabold text-blue-300 mt-1 block">{resultData.generated_count}</span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">0 Hard Conflicts</span>
            </div>
          </div>
        </div>
      )}

      {/* Error / Diagnostic Alert Banner */}
      {resultData && resultData.status === 'failed' && (
        <div className="p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">{resultData.message}</h4>
              <p className="text-xs text-rose-700 mt-1">
                Please resolve the data constraints listed in the audit report before running generation.
              </p>
            </div>
          </div>

          {resultData.diagnostics && resultData.diagnostics.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-rose-200 space-y-1 text-xs">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                Bottleneck Diagnostics:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-mono text-[11px] mt-1">
                {resultData.diagnostics.map((d, i) => (
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
            ? 'bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-950 text-white border-indigo-700'
            : 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Cpu className="w-4 h-4 text-blue-300" />
              <span>Phase 2.2 Pipeline: CSP + Genetic Algorithm</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              {isReady ? 'Feasibility + Soft-Constraint Optimization Ready' : 'Pre-Generation System Check'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              CSP Backtracking guarantees 100% hard-constraint feasibility. The Genetic Algorithm then optimizes class spreading across Monday–Friday, balances faculty teaching loads, minimizes student idle gaps, and respects faculty time preferences across 100 generations.
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
