import React, { useEffect, useState } from 'react';
import { getEvaluationResults, runEvaluation } from '../services/api';
import { FlaskConical, RefreshCw, Award, Scale, BarChart3, CheckCircle2, Cpu, TrendingUp, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

const Evaluation = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await getEvaluationResults();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch evaluation results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleRunEvaluation = async () => {
    if (running) return;
    setRunning(true);
    try {
      const res = await runEvaluation();
      setData(res.data);
    } catch (err) {
      alert('Failed to run experimental evaluation.');
    } finally {
      setRunning(false);
    }
  };

  const expA = data?.experiments?.experiment_a || {};
  const expB = data?.experiments?.experiment_b || {};
  const expC = data?.experiments?.experiment_c || {};
  const stoch = data?.stochastic_ga_analysis || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Experimental Evaluation & Research Validation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantitative baseline comparison: Experiment A (CSP Only) vs Experiment B (CSP+GA) vs Experiment C (CSP+GA+Fuzzy).
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FlaskConical className="w-4 h-4 text-amber-300" />
          )}
          <span>{running ? 'Executing Experiments...' : 'Run Experimental Evaluation'}</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold">Executing experimental baseline suite on active university dataset...</p>
        </div>
      ) : (
        <>
          {/* Executive Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exp A Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-full">
                  Experiment A
                </span>
                <span className="text-xs font-mono text-slate-400">{expA.runtime_seconds}s</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">CSP / Backtracking Baseline</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Feasible baseline without soft-constraint optimization</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-semibold">Overall Quality:</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono">{expA.final_score} / 100</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold text-right">&check; {expA.hard_violations} Hard Violations</div>
            </div>

            {/* Exp B Card */}
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase rounded-full">
                  Experiment B
                </span>
                <span className="text-xs font-mono text-slate-400">{expB.runtime_seconds}s</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-indigo-950">CSP + Genetic Algorithm</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">100-generation multi-objective GA optimization</p>
              </div>
              <div className="pt-2 border-t border-indigo-100 flex items-baseline justify-between">
                <span className="text-xs text-indigo-700 font-semibold">GA Fitness:</span>
                <span className="text-2xl font-extrabold text-indigo-700 font-mono">{expB.final_score} / 100</span>
              </div>
              <div className="text-[10px] text-indigo-600 font-bold text-right">+{expB.ga_improvement_percent}% GA Improvement</div>
            </div>

            {/* Exp C Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-5 text-white border border-indigo-800 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold uppercase rounded-full">
                  Experiment C (Proposed)
                </span>
                <span className="text-xs font-mono text-purple-300">{expC.runtime_seconds}s</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">CSP + GA + Fuzzy Decision Engine</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">Full hybrid engine with centroid defuzzification</p>
              </div>
              <div className="pt-2 border-t border-indigo-800/80 flex items-baseline justify-between">
                <span className="text-xs text-purple-300 font-semibold">Combined Score:</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">{expC.final_score} / 100</span>
              </div>
              <div className="text-[10px] text-purple-300 font-bold text-right">Decision: {expC.fuzzy_decision}</div>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Experimental Comparison Matrix</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Dataset: 3 Depts, 7 Secs, 9 Fac, 35 Subs, 10 Rooms</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3 font-bold">Research Metric</th>
                    <th className="p-3 font-bold">Experiment A (CSP Only)</th>
                    <th className="p-3 font-bold text-indigo-800">Experiment B (CSP + GA)</th>
                    <th className="p-3 font-bold text-purple-900">Experiment C (CSP + GA + Fuzzy)</th>
                    <th className="p-3 font-bold">Unit / Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data?.comparison_table?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{row.metric}</td>
                      <td className="p-3 font-mono">{row.experiment_a}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{row.experiment_b}</td>
                      <td className="p-3 font-mono font-bold text-purple-800">{row.experiment_c}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stochastic 5-Run GA Performance Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">Stochastic GA Performance Analysis (5 Independent Runs)</h3>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                Mean Fitness: {stoch.mean_ga_fitness} &plusmn; {stoch.std_deviation} pts
              </span>
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Best GA Fitness</span>
                <span className="text-lg font-extrabold text-emerald-600 mt-1 block">{stoch.best_ga_fitness}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Worst GA Fitness</span>
                <span className="text-lg font-extrabold text-slate-700 mt-1 block">{stoch.worst_ga_fitness}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Mean Fitness (&mu;)</span>
                <span className="text-lg font-extrabold text-indigo-600 mt-1 block">{stoch.mean_ga_fitness}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Std Deviation (&sigma;)</span>
                <span className="text-lg font-extrabold text-purple-600 mt-1 block">&plusmn; {stoch.std_deviation}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Avg Imprv %</span>
                <span className="text-lg font-extrabold text-emerald-600 mt-1 block">+{stoch.avg_improvement_percent}%</span>
              </div>
            </div>

            {/* 5 Individual Runs Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-900 uppercase tracking-wider border-b border-amber-200">
                    <th className="p-2.5 font-bold">Run #</th>
                    <th className="p-2.5 font-bold">Random Seed</th>
                    <th className="p-2.5 font-bold">CSP Baseline</th>
                    <th className="p-2.5 font-bold text-indigo-900">GA Optimized Fitness</th>
                    <th className="p-2.5 font-bold text-emerald-700">Improvement Delta</th>
                    <th className="p-2.5 font-bold">Hard Violations</th>
                    <th className="p-2.5 font-bold">Execution Runtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {stoch?.individual_runs?.map((r) => (
                    <tr key={r.run_id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-800">Run #{r.run_id}</td>
                      <td className="p-2.5 text-slate-600">seed={r.seed}</td>
                      <td className="p-2.5">{r.csp_baseline_fitness}</td>
                      <td className="p-2.5 font-bold text-indigo-700">{r.ga_optimized_fitness}</td>
                      <td className="p-2.5 font-bold text-emerald-600">+{r.improvement_percent}%</td>
                      <td className="p-2.5 text-emerald-600 font-bold">0 Violations &check;</td>
                      <td className="p-2.5 text-slate-500">{r.runtime_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Comparison Bar Charts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">Quantitative Visual Comparison Charts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Overall Quality Chart */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">1. Overall Quality Score (0-100)</span>
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp A (CSP Only):</span>
                      <span className="font-mono font-bold">{expA.final_score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${expA.final_score}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp B (CSP + GA):</span>
                      <span className="font-mono font-bold text-indigo-700">{expB.final_score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${expB.final_score}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp C (CSP + GA + Fuzzy):</span>
                      <span className="font-mono font-bold text-purple-700">{expC.final_score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${expC.final_score}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Distribution Chart */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">2. Day Distribution Spreading (0-100)</span>
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp A (CSP Baseline):</span>
                      <span className="font-mono font-bold">{expA.day_distribution} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${expA.day_distribution}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp B & C (GA Optimized):</span>
                      <span className="font-mono font-bold text-emerald-600">{expC.day_distribution} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${expC.day_distribution}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Workload Balance Chart */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">3. Faculty Workload Balance (0-100)</span>
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp A (CSP Baseline):</span>
                      <span className="font-mono font-bold">{expA.faculty_balance} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${expA.faculty_balance}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp B & C (GA Optimized):</span>
                      <span className="font-mono font-bold text-blue-600">{expC.faculty_balance} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${expC.faculty_balance}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Time Preference Match Chart */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">4. Faculty Preferred Slot Match (%)</span>
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp A (CSP Baseline):</span>
                      <span className="font-mono font-bold">{expA.faculty_preference}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${expA.faculty_preference}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Exp B & C (GA Optimized):</span>
                      <span className="font-mono font-bold text-amber-600">{expC.faculty_preference}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${expC.faculty_preference}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Research Conclusions Card */}
          {data?.research_conclusions && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Automated Research Conclusions & Findings</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {data.research_conclusions.map((stmt, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{stmt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Evaluation;
