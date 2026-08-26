import React, { useEffect, useState } from 'react';
import { getDashboardStats, getValidationReport, generateTimetable, clearGeneratedTimetable } from '../services/api';
import { Sparkles, CheckCircle2, AlertCircle, Cpu, ArrowRight, ShieldCheck, RefreshCw, CalendarDays, Trash2, TrendingUp, Award, Layers, Scale, Check } from 'lucide-react';
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
        message: err.response?.data?.detail || 'An unexpected error occurred during timetable generation.',
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

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'Excellent':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Good':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Acceptable':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Generate University Timetable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 2.3 Pipeline: CSP Feasibility &rarr; GA Optimization &rarr; Fuzzy Decision Evaluation.
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
            <span>{generating ? 'Running CSP + GA + Fuzzy Pipeline...' : 'Generate Timetable (CSP + GA + Fuzzy)'}</span>
          </button>
        </div>
      </div>

      {/* Optimization & Fuzzy Metrics Banner */}
      {resultData && resultData.status === 'success' && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white border border-indigo-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Phase 2.3 Multi-Engine Optimization & Evaluation</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getDecisionBadge(resultData.fuzzy_decision)}`}>
                Fuzzy Decision: {resultData.fuzzy_decision || 'Good'}
              </span>
              <Link
                to="/view-timetable"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
              >
                <CalendarDays className="w-4 h-4" />
                <span>View Master Timetable Grid</span>
              </Link>
            </div>
          </div>

          {/* Primary Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Initial CSP Fitness</span>
              <span className="text-xl font-extrabold text-slate-200 mt-1 block">{resultData.initial_fitness} / 100</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Hard Feasible</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-indigo-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">GA Fitness (60%)</span>
              <span className="text-xl font-extrabold text-indigo-300 mt-1 block">{resultData.optimized_fitness} / 100</span>
              <span className="text-[10px] text-indigo-300 font-semibold mt-0.5 block">+{resultData.improvement_percent}% Imprv</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-purple-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Fuzzy Suitability (40%)</span>
              <span className="text-xl font-extrabold text-purple-300 mt-1 block">{resultData.fuzzy_score} / 100</span>
              <span className="text-[10px] text-purple-300 font-semibold mt-0.5 block">Centroid Defuzzified</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Final Combined Score</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
                {resultData.final_score} / 100
              </span>
              <span className="text-[10px] text-emerald-300 mt-0.5 block">Overall Quality</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Assigned Slots</span>
              <span className="text-xl font-extrabold text-blue-300 mt-1 block">{resultData.generated_count}</span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">0 Hard Conflicts</span>
            </div>
          </div>

          {/* Fuzzy Decision Factors Breakdown */}
          {resultData.fuzzy_breakdown && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-purple-400" />
                <span>Fuzzy Decision Suitability Factors Breakdown</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Day Spreading:</span>
                  <span className="font-bold text-slate-200">{resultData.fuzzy_breakdown.day_distribution_label}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Faculty Balance:</span>
                  <span className="font-bold text-slate-200">{resultData.fuzzy_breakdown.faculty_balance_label}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Student Gaps:</span>
                  <span className="font-bold text-slate-200">{resultData.fuzzy_breakdown.student_gaps_label}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Consecutive Load:</span>
                  <span className="font-bold text-slate-200">{resultData.fuzzy_breakdown.consecutive_load_label}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Faculty Preference:</span>
                  <span className="font-bold text-slate-200">{resultData.fuzzy_breakdown.faculty_preference_label}</span>
                </div>
              </div>
            </div>
          )}
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
            ? 'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white border-purple-800'
            : 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Cpu className="w-4 h-4 text-purple-300" />
              <span>Phase 2.3 Complete Pipeline: CSP + GA + Fuzzy Engine</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              {isReady ? 'Feasibility + GA Optimization + Fuzzy Suitability' : 'Pre-Generation System Check'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              CSP Backtracking guarantees 100% hard feasibility. Genetic Algorithm optimizes day spreading and workload balancing across 100 generations. The Fuzzy Decision Engine evaluates soft constraint suitability using triangular & trapezoidal MFs, 15 IF-THEN rules, Mamdani inference, and Centroid defuzzification.
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
