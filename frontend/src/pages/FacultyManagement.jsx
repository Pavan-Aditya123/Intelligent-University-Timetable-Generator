import React, { useEffect, useState } from 'react';
import {
  getFacultyList,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getDepartments,
  getSubjects
} from '../services/api';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Calendar,
  Search
} from 'lucide-react';

const FacultyManagement = ({ refreshStats }) => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    email: '',
    max_weekly_hours: 20,
    preferred_time_slot: 'No Preference',
    assigned_subject_ids: [],
  });

  const timeSlotOptions = ['No Preference', 'Morning', 'Afternoon'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, deptRes, subRes] = await Promise.all([
        getFacultyList(),
        getDepartments(),
        getSubjects()
      ]);
      setFacultyList(facRes.data || []);
      setDepartments(deptRes.data || []);
      setSubjects(subRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load faculty records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    if (departments.length === 0) {
      setMessage({ type: 'error', text: 'Please add departments before creating faculty members.' });
      return;
    }
    setEditingFacultyId(null);
    setFormData({
      name: '',
      department_id: departments[0]?.id || '',
      email: '',
      max_weekly_hours: 20,
      preferred_time_slot: 'No Preference',
      assigned_subject_ids: []
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (fac) => {
    setEditingFacultyId(fac.id);
    setFormData({
      name: fac.name,
      department_id: fac.department_id,
      email: fac.email || '',
      max_weekly_hours: fac.max_weekly_hours,
      preferred_time_slot: fac.preferred_time_slot || 'No Preference',
      assigned_subject_ids: fac.assigned_subject_ids || []
    });
    setShowModal(true);
  };

  const handleSubjectToggle = (subId) => {
    setFormData((prev) => {
      const exists = prev.assigned_subject_ids.includes(subId);
      const updated = exists
        ? prev.assigned_subject_ids.filter((id) => id !== subId)
        : [...prev.assigned_subject_ids, subId];
      return { ...prev, assigned_subject_ids: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!formData.name || !formData.department_id) {
      setMessage({ type: 'error', text: 'Faculty name and department are required.' });
      return;
    }

    try {
      if (editingFacultyId) {
        await updateFaculty(editingFacultyId, formData);
        setMessage({ type: 'success', text: `Faculty '${formData.name}' updated successfully!` });
      } else {
        await createFaculty(formData);
        setMessage({ type: 'success', text: `Faculty '${formData.name}' created successfully!` });
      }
      setShowModal(false);
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save faculty record.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty member '${name}'?`)) return;
    try {
      await deleteFaculty(id);
      setMessage({ type: 'success', text: `Faculty member '${name}' deleted.` });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete faculty member.' });
    }
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.department_name && f.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faculty Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university professors, teaching workload hours, subject qualifications, and availability.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
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

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Faculty Members ({facultyList.length})</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty..."
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Faculty Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Weekly Max Hours</th>
                <th className="py-2.5 px-3">Time Slot Preference</th>
                <th className="py-2.5 px-3">Qualified Subjects</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No faculty records found.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((fac) => {
                  const assignedSubjects = subjects.filter((s) =>
                    fac.assigned_subject_ids?.includes(s.id)
                  );

                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{fac.name}</div>
                        {fac.email && <div className="text-[10px] text-slate-400">{fac.email}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px]">
                          {fac.department_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold">{fac.max_weekly_hours} hrs/week</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold">
                          {fac.preferred_time_slot}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {assignedSubjects.length === 0 ? (
                          <span className="text-slate-400 italic">None assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedSubjects.map((s) => (
                              <span
                                key={s.id}
                                className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold"
                              >
                                {s.code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(fac)}
                          className="text-slate-500 hover:text-blue-600 p-1"
                          title="Edit Faculty"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fac.id, fac.name)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800">
              {editingFacultyId ? 'Edit Faculty Member' : 'Add Faculty Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Dr. Alan Turing"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="alan@university.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Weekly Workload (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.max_weekly_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_weekly_hours: parseInt(e.target.value) || 20
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Preference
                  </label>
                  <select
                    value={formData.preferred_time_slot}
                    onChange={(e) =>
                      setFormData({ ...formData, preferred_time_slot: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {timeSlotOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Qualifications */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Assign Qualified Subjects / Courses
                </label>
                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subjects available yet.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 custom-scrollbar">
                    {subjects.map((sub) => {
                      const checked = formData.assigned_subject_ids.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center space-x-2 text-xs p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleSubjectToggle(sub.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-bold text-slate-800">{sub.code}:</span>
                          <span className="text-slate-600">{sub.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            ({sub.section_name})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Save Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;
