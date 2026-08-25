import React from 'react';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const Header = ({ stats }) => {
  const percentage = stats?.overall_progress_percentage || 0;
  const isReady = stats?.is_ready_for_generation || false;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Intelligent University-Wide Timetable Generator
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Knowledge Representation & Fuzzy Decision Making System
        </p>
      </div>

      <div className="flex items-center space-x-6">
        {/* Setup Progress Indicator */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-700">Setup Readiness</div>
            <div className="text-xs text-slate-500 font-medium">{percentage}% Complete</div>
          </div>

          <div className="w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Readiness Badge */}
        <div>
          {isReady ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ready for Timetable AI</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Setup Required</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
