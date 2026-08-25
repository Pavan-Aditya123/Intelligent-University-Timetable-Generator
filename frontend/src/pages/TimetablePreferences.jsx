import React, { useEffect, useState } from 'react';
import { getPreferences, updatePreferences } from '../services/api';
import { Sliders, Save, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

const TimetablePreferences = ({ refreshStats }) => {
  const [preferences, setPreferences] = useState([
    {
      key: 'faculty_preferred_time',
      value: 'No Preference',
      category: 'faculty',
      description: 'Global default time slot preference for faculty teaching assignments.'
    },
    {
      key: 'avoid_consecutive_classes',
      value: 'Medium',
      category: 'scheduling',
      description: 'Priority weight to prevent assigning 3+ consecutive classes to faculty or students.'
    },
    {
      key: 'workload_balancing',
      value: 'High',
      category: 'faculty',
      description: 'Evenly distribute subject periods across all working days of the week.'
    },
    {
      key: 'avoid_unnecessary_gaps',
      value: 'High',
      category: 'section',
      description: 'Minimize empty gap periods between scheduled classes for student sections.'
    },
    {
      key: 'lab_period_grouping',
      value: 'High',
      category: 'scheduling',
      description: 'Enforce continuous multi-period blocks for practical laboratory courses.'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await getPreferences();
      if (res.data && res.data.length > 0) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load preferences.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const handleChange = (key, newValue) => {
    setPreferences((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value: newValue } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updatePreferences(preferences);
      setMessage({ type: 'success', text: 'Timetable preferences updated successfully!' });
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Administrator Timetable Preferences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fuzzy decision weighting criteria and scheduling preferences using clean administrator controls.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {preferences.map((pref) => {
          const isTimeSlot = pref.key === 'faculty_preferred_time';

          return (
            <div
              key={pref.key}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-800 capitalize">
                    {pref.key.replace(/_/g, ' ')}
                  </h4>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                    {pref.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{pref.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preference Setting
                </label>
                {isTimeSlot ? (
                  <select
                    value={pref.value}
                    onChange={(e) => handleChange(pref.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="No Preference">No Preference</option>
                    <option value="Morning">Morning Preference</option>
                    <option value="Afternoon">Afternoon Preference</option>
                  </select>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map((opt) => {
                      const isSelected = pref.value === opt;
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleChange(pref.key, opt)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt} Priority
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimetablePreferences;
