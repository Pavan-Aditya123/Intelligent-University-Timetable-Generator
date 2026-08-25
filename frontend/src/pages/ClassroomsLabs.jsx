import React, { useEffect, useState } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../services/api';
import {
  DoorClosed,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Building,
  Search
} from 'lucide-react';

const ClassroomsLabs = ({ refreshStats }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);

  const [formData, setFormData] = useState({
    room_number: 'C-101',
    name: 'Lecture Hall 1',
    room_type: 'Classroom',
    capacity: 60,
    is_lab: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load room records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRoomId(null);
    setFormData({
      room_number: '',
      name: '',
      room_type: 'Classroom',
      capacity: 60,
      is_lab: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoomId(room.id);
    setFormData({
      room_number: room.room_number,
      name: room.name,
      room_type: room.room_type,
      capacity: room.capacity,
      is_lab: room.is_lab,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.room_number || !formData.name) {
      setMessage({ type: 'error', text: 'Room number and name are required.' });
      return;
    }
    if (formData.capacity > 70) {
      setMessage({ type: 'error', text: 'Maximum room capacity allowed is 70.' });
      return;
    }

    try {
      if (editingRoomId) {
        await updateRoom(editingRoomId, formData);
        setMessage({ type: 'success', text: `Room '${formData.room_number}' updated successfully!` });
      } else {
        await createRoom(formData);
        setMessage({ type: 'success', text: `Room '${formData.room_number}' created successfully!` });
      }
      setShowModal(false);
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save room record.' });
    }
  };

  const handleDelete = async (id, roomNum) => {
    if (!window.confirm(`Delete room '${roomNum}'?`)) return;
    try {
      await deleteRoom(id);
      setMessage({ type: 'success', text: `Room '${roomNum}' deleted.` });
      await fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete room.' });
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Classrooms & Laboratories</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university physical spaces, room types, and student capacity limits (Max 70 capacity).
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room / Lab</span>
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
            <DoorClosed className="w-5 h-5 text-teal-600" />
            <span>Rooms & Laboratories ({rooms.length})</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rooms..."
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Room Number</th>
                <th className="py-2.5 px-3">Room Name / Label</th>
                <th className="py-2.5 px-3">Room Type</th>
                <th className="py-2.5 px-3">Seating Capacity</th>
                <th className="py-2.5 px-3">Validation Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No room records found.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((r) => {
                  const isLab = r.room_type === 'Laboratory' || r.is_lab;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{r.room_number}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{r.name}</td>
                      <td className="py-3 px-3">
                        {isLab ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                            <FlaskConical className="w-3 h-3 text-amber-700" />
                            <span>Laboratory</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 border border-teal-200 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                            <DoorClosed className="w-3 h-3 text-teal-700" />
                            <span>Classroom</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold">{r.capacity} seats</td>
                      <td className="py-3 px-3">
                        {r.capacity <= 70 ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                            Valid (&le; 70)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                            Exceeds Limit (&gt; 70)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="text-slate-500 hover:text-blue-600 p-1"
                          title="Edit Room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.room_number)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Room"
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

      {/* Add / Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              {editingRoomId ? 'Edit Room / Laboratory' : 'Add Room / Laboratory'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Identifier / Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 text-sm uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. C-101 or LAB-3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Description / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Algorithms & AI Lab"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Type
                  </label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData({
                        ...formData,
                        room_type: type,
                        is_lab: type === 'Laboratory'
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (Max 70) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={70}
                    required
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 60 })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
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
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomsLabs;
