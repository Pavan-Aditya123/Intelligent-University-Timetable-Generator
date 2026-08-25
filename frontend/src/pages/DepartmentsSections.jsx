import React, { useEffect, useState } from 'react';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getSections,
  createSection,
  updateSection,
  deleteSection
} from '../services/api';
import {
  Building2,
  GitFork,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

const DepartmentsSections = ({ refreshStats }) => {
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDept, setSavingDept] = useState(false);
  const [savingSec, setSavingSec] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Department Form
  const [deptForm, setDeptForm] = useState({
    code: 'CSE',
    name: 'Computer Science & Engineering',
    num_sections_auto: 3,
  });

  // Section Add Form
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [secForm, setSecForm] = useState({
    department_id: '',
    name: '',
    student_count: 60,
  });

  // Section Edit State
  const [editingSection, setEditingSection] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, secRes] = await Promise.all([getDepartments(), getSections()]);
      setDepartments(deptRes.data || []);
      setSections(secRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load departments and sections.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSuggestedSectionNames = () => {
    const code = deptForm.code.trim().toUpperCase() || 'DEPT';
    const count = parseInt(deptForm.num_sections_auto) || 0;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const suggestions = [];
    for (let i = 0; i < Math.min(count, 8); i++) {
      suggestions.push(`${code}-${letters[i]}`);
    }
    return suggestions;
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (savingDept) return; // Double-submit guard

    setMessage({ type: '', text: '' });
    const codeClean = deptForm.code.trim().toUpperCase();
    const nameClean = deptForm.name.trim();

    if (!codeClean || !nameClean) {
      setMessage({ type: 'error', text: 'Department code and name are required.' });
      return;
    }

    setSavingDept(true);
    try {
      await createDepartment({
        ...deptForm,
        code: codeClean,
        name: nameClean
      });
      setMessage({
        type: 'success',
        text: `✓ Department '${codeClean}' created successfully!`
      });
      setDeptForm({ code: '', name: '', num_sections_auto: 2 });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create department.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete department '${deptName}' and all its sections?`)) {
      return;
    }
    try {
      await deleteDepartment(deptId);
      setMessage({ type: 'success', text: `✓ Department '${deptName}' deleted successfully.` });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete department.' });
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (savingSec) return;

    setMessage({ type: '', text: '' });
    if (!secForm.department_id || !secForm.name.trim()) {
      setMessage({ type: 'error', text: 'Department selection and section name are required.' });
      return;
    }
    if (secForm.student_count > 70) {
      setMessage({ type: 'error', text: 'Maximum allowed student count per section is 70.' });
      return;
    }

    setSavingSec(true);
    try {
      await createSection({
        ...secForm,
        name: secForm.name.trim()
      });
      setMessage({ type: 'success', text: `✓ Section '${secForm.name.trim()}' added successfully!` });
      setShowSectionModal(false);
      setSecForm({ department_id: '', name: '', student_count: 60 });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to add section.' });
    } finally {
      setSavingSec(false);
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editingSection || savingSec) return;

    setMessage({ type: '', text: '' });
    if (editingSection.student_count > 70) {
      setMessage({ type: 'error', text: 'Maximum allowed student count per section is 70.' });
      return;
    }

    setSavingSec(true);
    try {
      await updateSection(editingSection.id, {
        name: editingSection.name.trim(),
        student_count: editingSection.student_count
      });
      setMessage({ type: 'success', text: `✓ Section '${editingSection.name.trim()}' updated successfully!` });
      setEditingSection(null);
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update section.' });
    } finally {
      setSavingSec(false);
    }
  };

  const handleDeleteSection = async (secId, secName) => {
    if (!window.confirm(`Delete section '${secName}'?`)) return;
    try {
      await deleteSection(secId);
      setMessage({ type: 'success', text: `✓ Section '${secName}' deleted.` });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete section.' });
    }
  };

  const filteredSections = sections.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department_name && s.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Departments & Student Sections</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic departments and student section strengths (Max 70 students per section).
          </p>
        </div>
        <button
          onClick={() => {
            if (departments.length === 0) {
              setMessage({ type: 'error', text: 'Please create at least one department first.' });
              return;
            }
            setSecForm({ department_id: departments[0]?.id || '', name: '', student_count: 60 });
            setShowSectionModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Individual Section</span>
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Creation Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Add Department & Auto-Sections</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter department details and auto-generate proposed sections.
            </p>
          </div>

          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={savingDept}
                value={deptForm.code}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 text-sm uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                placeholder="e.g. CSE, ECE, EEE"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={savingDept}
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Sections to Auto-Create
              </label>
              <input
                type="number"
                min={0}
                max={10}
                disabled={savingDept}
                value={deptForm.num_sections_auto}
                onChange={(e) =>
                  setDeptForm({
                    ...deptForm,
                    num_sections_auto: parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            {/* Live Auto-Suggestion Preview Box */}
            {deptForm.num_sections_auto > 0 && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xs font-bold text-blue-900 flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Auto-Generated Section Suggestions:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getSuggestedSectionNames().map((name, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white text-blue-800 font-bold text-xs rounded-lg border border-blue-300 shadow-sm"
                    >
                      {name} (60 students)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={savingDept}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingDept ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{savingDept ? 'Creating Department...' : 'Create Department & Sections'}</span>
            </button>
          </form>
        </div>

        {/* Existing Departments & Sections Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Registered Departments ({departments.length})
            </h3>
            {departments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No departments created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between space-x-4 shrink-0"
                  >
                    <div>
                      <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded mr-2">
                        {d.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{d.name}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {d.sections?.length || 0} active sections
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDepartment(d.id, d.name)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <GitFork className="w-5 h-5 text-indigo-600" />
                <span>All Sections ({sections.length})</span>
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sections..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Section Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Student Strength</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No section records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSections.map((sec) => (
                      <tr key={sec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{sec.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                            {sec.department_name || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          <span className={sec.student_count > 70 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {sec.student_count} Students
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {sec.student_count <= 70 ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                              Capacity OK (&le; 70)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                              Over Capacity (&gt; 70)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => setEditingSection(sec)}
                            className="text-slate-500 hover:text-blue-600 p-1"
                            title="Edit Section"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id, sec.name)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Add Individual Section</h3>

            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={savingSec}
                  value={secForm.department_id}
                  onChange={(e) => setSecForm({ ...secForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={savingSec}
                  value={secForm.name}
                  onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  placeholder="e.g. CSE-A, ECE-B"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Strength (Max 70) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={70}
                  required
                  disabled={savingSec}
                  value={secForm.student_count}
                  onChange={(e) =>
                    setSecForm({ ...secForm, student_count: parseInt(e.target.value) || 60 })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSec}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {savingSec ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Edit Section Strength</h3>

            <form onSubmit={handleUpdateSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  disabled={savingSec}
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Strength (Max 70)
                </label>
                <input
                  type="number"
                  min={1}
                  max={70}
                  required
                  disabled={savingSec}
                  value={editingSection.student_count}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      student_count: parseInt(e.target.value) || 60
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSec}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {savingSec ? 'Updating...' : 'Update Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsSections;
