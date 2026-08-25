import React, { useEffect, useState } from 'react';
import { getValidationReport } from '../services/api';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

const ValidationConflicts = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await getValidationReport();
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Executing Data Validation Audit...</span>
      </div>
    );
  }

  const isHealthy = report?.is_valid;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pre-Generation Validation & Conflicts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit report validating capacity limits (&le; 70), period loads, and room availability constraints.
          </p>
        </div>
        <button
          onClick={fetchAudit}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Run Validation Audit</span>
        </button>
      </div>

      {/* Summary Audit Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Status</span>
          <div className="mt-1 flex items-center space-x-2">
            {isHealthy ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-sm rounded-full border border-emerald-200 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PASSED</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-sm rounded-full border border-rose-200 flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>ACTION NEEDED</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checks Passed</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {report?.passed_checks || 0} / {report?.total_checks || 0}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warnings</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {report?.warnings_count || 0}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hard Errors</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {report?.errors_count || 0}
          </div>
        </div>
      </div>

      {/* Rules Report Breakdown List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>System Rule Audit Inspection</span>
        </h3>

        <div className="space-y-3">
          {report?.results?.map((res, i) => {
            const isPass = res.status === 'PASS';
            const isWarn = res.status === 'WARNING';
            const isFail = res.status === 'FAIL';

            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  isPass
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isWarn
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {isPass && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                    {isWarn && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                    {isFail && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{res.rule_name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{res.message}</p>

                      {res.details && res.details.length > 0 && (
                        <ul className="list-disc list-inside text-[11px] text-slate-600 mt-2 space-y-0.5 pl-2 font-mono">
                          {res.details.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isWarn
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ValidationConflicts;
