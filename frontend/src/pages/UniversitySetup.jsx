import React, { useEffect, useState } from 'react';
import { getUniversityConfig, updateUniversityConfig, getGeneratedPeriods } from '../services/api';
import { Save, Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const UniversitySetup = ({ refreshStats }) => {
  const [formData, setFormData] = useState({
    university_name: 'State Technological University',
    academic_year: '2026-2027',
    semester: 'Odd Semester',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    day_start_time: '09:00',
    class_duration_minutes: 50,
    morning_break_after_period: 2,
    morning_break_minutes: 15,
    lunch_break_after_period: 4,
    lunch_break_minutes: 50,
    periods_per_day: 7,
  });

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getUniversityConfig();
      if (res.data) {
        setFormData(res.data);
      }
      const periodsRes = await getGeneratedPeriods();
      setPeriods(periodsRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load university setup config.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const exists = prev.working_days.includes(day);
      const updated = exists
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day];
      return { ...prev, working_days: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await updateUniversityConfig(formData);
      setFormData(res.data);
      const periodsRes = await getGeneratedPeriods();
      setPeriods(periodsRes.data || []);
      setMessage({ type: 'success', text: 'University configuration saved successfully!' });
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading University Setup...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">University Setup & Academic Timings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global university parameters, daily working hours, and fixed break schedules.
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              A. General Institution Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.university_name}
                onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. State Technological University"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 2026-2027"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester / Term <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Odd Semester / Semester 5"
                />
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Working Days per Week
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.working_days.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              B. Academic Day & Period Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day Start Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.day_start_time}
                  onChange={(e) => setFormData({ ...formData, day_start_time: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Normal Class Duration (Minutes)
                </label>
                <input
                  type="number"
                  readOnly
                  value={50}
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 font-bold text-slate-700 rounded-lg cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Fixed system constraint: Exactly 50 minutes.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Periods per Day
                </label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={formData.periods_per_day}
                  onChange={(e) => setFormData({ ...formData, periods_per_day: parseInt(e.target.value) || 7 })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Morning Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  readOnly
                  value={15}
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 font-bold text-slate-700 rounded-lg cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Fixed system constraint: Exactly 15 minutes.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Morning Break Position
                </label>
                <select
                  value={formData.morning_break_after_period}
                  onChange={(e) => setFormData({ ...formData, morning_break_after_period: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={1}>After Period 1</option>
                  <option value={2}>After Period 2 (Standard)</option>
                  <option value={3}>After Period 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lunch Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  readOnly
                  value={50}
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 font-bold text-slate-700 rounded-lg cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Fixed system constraint: Exactly 50 minutes.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lunch Break Position
              </label>
              <select
                value={formData.lunch_break_after_period}
                onChange={(e) => setFormData({ ...formData, lunch_break_after_period: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={3}>After Period 3</option>
                <option value={4}>After Period 4 (Standard)</option>
                <option value={5}>After Period 5</option>
              </select>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving Configuration...' : 'Save University Configuration'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Period Generation Preview Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Daily Schedule Preview</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auto-calculated timetable period breakdown
                </p>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                {formData.periods_per_day} Class Slots
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {periods.map((p, idx) => {
                const isClass = p.period_type === 'Class';
                const isMorningBreak = p.period_type === 'MorningBreak';
                const isLunchBreak = p.period_type === 'LunchBreak';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                      isClass
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : isMorningBreak
                        ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isClass
                            ? 'bg-blue-100 text-blue-700'
                            : isMorningBreak
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-indigo-200 text-indigo-900'
                        }`}
                      >
                        {isClass ? p.period_number : 'B'}
                      </span>
                      <div>
                        <span className="font-bold">{p.label}</span>
                        <div className="text-[10px] opacity-75">
                          {isClass ? '50 mins normal lecture' : p.label}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                      {p.start_time} - {p.end_time}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">Automatic Schedule Rule:</span> Administrators do not type period start/end times manually. Slots are calculated automatically based on 50-min class duration, 15-min morning break, and 50-min lunch break.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UniversitySetup;
