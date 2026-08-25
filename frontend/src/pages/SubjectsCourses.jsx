import React, { useEffect, useState } from 'react';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getDepartments,
  getSections,
  getFacultyList
} from '../services/api';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Clock,
  Search,
  RefreshCw
} from 'lucide-react';

const SubjectsCourses = ({ refreshStats }) => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department_id: '',
    section_id: '',
    course_type: 'Theory',
    weekly_classes_required: 4,
    duration_in_periods: 1,
    requires_lab: false,
    assigned_faculty_ids: [],
  });

  const courseTypes = ['Theory', 'Lab', 'Project', 'Activity'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, deptRes, secRes, facRes] = await Promise.all([
        getSubjects(),
        getDepartments(),
        getSections(),
        getFacultyList()
      ]);
      setSubjects(subRes.data || []);
      setDepartments(deptRes.data || []);
      setSections(secRes.data || []);
      setFacultyList(facRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load subjects data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Sections by selected Department
  const availableSections = sections.filter(
    (s) => !formData.department_id || s.department_id === parseInt(formData.department_id)
  );

  // Filter Faculty by selected Department
  const availableFaculty = facultyList.filter(
    (f) => !formData.department_id || f.department_id === parseInt(formData.department_id)
  );

  const handleOpenAddModal = () => {
    if (departments.length === 0 || sections.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please create departments and sections before adding subjects.'
      });
      return;
    }
    setEditingSubjectId(null);
    const firstDept = departments[0]?.id || '';
    const validSecs = sections.filter((s) => s.department_id === parseInt(firstDept));
    const firstSec = validSecs[0]?.id || sections[0]?.id || '';

    setFormData({
      code: '',
      name: '',
      department_id: firstDept,
      section_id: firstSec,
      course_type: 'Theory',
      weekly_classes_required: 4,
      duration_in_periods: 1,
      requires_lab: false,
      assigned_faculty_ids: [],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditingSubjectId(sub.id);
    setFormData({
      code: sub.code,
      name: sub.name,
      department_id: sub.department_id,
      section_id: sub.section_id,
      course_type: sub.course_type,
      weekly_classes_required: sub.weekly_classes_required,
      duration_in_periods: sub.duration_in_periods,
      requires_lab: sub.requires_lab,
      assigned_faculty_ids: sub.assigned_faculty_ids || [],
    });
    setShowModal(true);
  };

  const handleFacultyToggle = (facId) => {
    setFormData((prev) => {
      const exists = prev.assigned_faculty_ids.includes(facId);
      const updated = exists
        ? prev.assigned_faculty_ids.filter((id) => id !== facId)
        : [...prev.assigned_faculty_ids, facId];
      return { ...prev, assigned_faculty_ids: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // Double submit protection

    setMessage({ type: '', text: '' });
    const codeClean = formData.code.trim().toUpperCase();
    const nameClean = formData.name.trim();

    if (!codeClean || !nameClean || !formData.department_id || !formData.section_id) {
      setMessage({ type: 'error', text: 'Subject code, name, department, and section are required.' });
      return;
    }
    if (formData.weekly_classes_required <= 0) {
      setMessage({ type: 'error', text: 'Weekly classes required must be greater than 0.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: codeClean,
        name: nameClean
      };

      if (editingSubjectId) {
        await updateSubject(editingSubjectId, payload);
        setMessage({ type: 'success', text: `✓ Subject '${codeClean}' updated successfully!` });
      } else {
        await createSubject(payload);
        setMessage({ type: 'success', text: `✓ Subject '${codeClean}' created successfully!` });
      }
      setShowModal(false);
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save subject.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete subject '${code}'?`)) return;
    try {
      await deleteSubject(id);
      setMessage({ type: 'success', text: `✓ Subject '${code}' deleted.` });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete subject.' });
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.section_name && s.section_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Subjects & Course Requirements</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define subjects per section, weekly period load, course types, and laboratory requirements.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject / Course</span>
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

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Subjects & Courses ({subjects.length})</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, title, section..."
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Subject Code & Name</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Weekly Classes</th>
                <th className="py-2.5 px-3">Course Type</th>
                <th className="py-2.5 px-3">Lab Required</th>
                <th className="py-2.5 px-3">Assigned Faculty</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No subject records found.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{sub.code}</div>
                      <div className="text-slate-600 font-medium">{sub.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[11px]">
                        {sub.section_name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold">
                        {sub.weekly_classes_required} periods/wk
                      </span>
                      {sub.duration_in_periods > 1 && (
                        <span className="block text-[10px] text-slate-400 mt-1">
                          ({sub.duration_in_periods} consecutive periods)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium">{sub.course_type}</td>
                    <td className="py-3 px-3">
                      {sub.requires_lab ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                          <FlaskConical className="w-3 h-3 text-amber-700" />
                          <span>Lab Required</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {sub.assigned_faculty_names?.length === 0 ? (
                        <span className="text-rose-500 italic text-[11px]">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {sub.assigned_faculty_names.map((fname, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold"
                            >
                              {fname}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        className="text-slate-500 hover:text-blue-600 p-1"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.code)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete Subject"
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

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800">
              {editingSubjectId ? 'Edit Subject / Course' : 'Add Subject / Course'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                    placeholder="e.g. CSE101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Type
                  </label>
                  <select
                    disabled={saving}
                    value={formData.course_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData({
                        ...formData,
                        course_type: type,
                        requires_lab: type === 'Lab',
                        duration_in_periods: type === 'Lab' ? 2 : 1
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  >
                    {courseTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={saving}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={saving}
                    value={formData.department_id}
                    onChange={(e) => {
                      const deptId = e.target.value;
                      const validSecs = sections.filter((s) => s.department_id === parseInt(deptId));
                      const validFacs = facultyList.filter((f) => f.department_id === parseInt(deptId));
                      setFormData({
                        ...formData,
                        department_id: deptId,
                        section_id: validSecs[0]?.id || '',
                        assigned_faculty_ids: []
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
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
                    Assigned Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={saving}
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  >
                    {availableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.student_count} std)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classes Required Per Week <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    disabled={saving}
                    value={formData.weekly_classes_required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weekly_classes_required: parseInt(e.target.value) || 4
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Period Duration per Class
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    disabled={saving}
                    value={formData.duration_in_periods}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_in_periods: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires_lab"
                  disabled={saving}
                  checked={formData.requires_lab}
                  onChange={(e) => setFormData({ ...formData, requires_lab: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requires_lab" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Requires Laboratory Room / Practical Lab Equipment
                </label>
              </div>

              {/* Department-Filtered Faculty Assignments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assign Department Faculty ({availableFaculty.length} available)
                  </label>
                  <span className="text-[10px] text-slate-400">Filtered by selected department</span>
                </div>
                {availableFaculty.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 border border-slate-200 rounded-lg">
                    No faculty members found for this department.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 custom-scrollbar">
                    {availableFaculty.map((f) => {
                      const checked = formData.assigned_faculty_ids.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className="flex items-center space-x-2 text-xs p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            disabled={saving}
                            checked={checked}
                            onChange={() => handleFacultyToggle(f.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-bold text-slate-800">{f.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            ({f.department_name})
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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsCourses;
