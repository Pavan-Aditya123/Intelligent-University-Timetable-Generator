import React from 'react';
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SetupProgressCard = ({ stats }) => {
  const steps = [
    {
      label: 'University Configuration',
      detail: 'Name, semester & academic period breakdown (50m class, 15m/50m breaks)',
      completed: stats?.university_config_done,
      path: '/university-setup'
    },
    {
      label: 'Departments & Sections',
      detail: `${stats?.departments_count || 0} Departments, ${stats?.sections_count || 0} Sections (Max 70 students)`,
      completed: (stats?.departments_count || 0) > 0 && (stats?.sections_count || 0) > 0,
      path: '/departments-sections'
    },
    {
      label: 'Faculty Members',
      detail: `${stats?.faculty_count || 0} Faculty members added with time preferences & availability`,
      completed: (stats?.faculty_count || 0) > 0,
      path: '/faculty'
    },
    {
      label: 'Subjects / Courses',
      detail: `${stats?.subjects_count || 0} Subjects created with weekly period requirements`,
      completed: (stats?.subjects_count || 0) > 0,
      path: '/subjects-courses'
    },
    {
      label: 'Classrooms & Laboratories',
      detail: `${stats?.classrooms_count || 0} Classrooms & ${stats?.laboratories_count || 0} Labs (Max capacity 70)`,
      completed: ((stats?.classrooms_count || 0) + (stats?.laboratories_count || 0)) > 0,
      path: '/classrooms-labs'
    },
    {
      label: 'Fuzzy Timetable Preferences',
      detail: 'Faculty preferred times, consecutive class limits, workload balance weights',
      completed: true,
      path: '/preferences'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">University Setup Checklist</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete all configuration steps before launching the AI timetable generator.
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-blue-600">
            {stats?.overall_progress_percentage || 0}%
          </span>
          <p className="text-xs text-slate-400 font-medium">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              step.completed
                ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{step.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                </div>
              </div>
              <Link
                to={step.path}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Edit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {stats?.missing_requirements && stats.missing_requirements.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pending Setup Actions:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {stats.missing_requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupProgressCard;
