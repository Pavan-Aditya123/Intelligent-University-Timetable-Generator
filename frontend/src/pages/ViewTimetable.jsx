import React, { useEffect, useState } from 'react';
import {
  getSections,
  getFacultyList,
  getRooms,
  getGeneratedPeriods,
  getUniversityConfig
} from '../services/api';
import { CalendarDays, Filter, RefreshCw, Info } from 'lucide-react';

const ViewTimetable = () => {
  const [viewType, setViewType] = useState('section'); // 'section' | 'faculty' | 'room'
  const [selectedId, setSelectedId] = useState('');

  const [sections, setSections] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [workingDays, setWorkingDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [secRes, facRes, rmRes, pRes, cfgRes] = await Promise.all([
          getSections(),
          getFacultyList(),
          getRooms(),
          getGeneratedPeriods(),
          getUniversityConfig()
        ]);

        setSections(secRes.data || []);
        setFacultyList(facRes.data || []);
        setRooms(rmRes.data || []);
        setPeriods(pRes.data || []);
        if (cfgRes.data?.working_days) {
          setWorkingDays(cfgRes.data.working_days);
        }

        if (secRes.data?.length > 0) {
          setSelectedId(secRes.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTargetLabel = () => {
    if (viewType === 'section') {
      const s = sections.find((x) => x.id.toString() === selectedId);
      return s ? `Section ${s.name}` : 'Select Section';
    }
    if (viewType === 'faculty') {
      const f = facultyList.find((x) => x.id.toString() === selectedId);
      return f ? `Faculty: ${f.name}` : 'Select Faculty';
    }
    if (viewType === 'room') {
      const r = rooms.find((x) => x.id.toString() === selectedId);
      return r ? `Room: ${r.room_number} (${r.name})` : 'Select Room';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading Timetable View...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">University Timetable Grid Viewer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive weekly schedule matrix categorized by Section, Faculty, or Room.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setViewType('section');
                if (sections.length > 0) setSelectedId(sections[0].id.toString());
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewType === 'section' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              By Section
            </button>
            <button
              onClick={() => {
                setViewType('faculty');
                if (facultyList.length > 0) setSelectedId(facultyList[0].id.toString());
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewType === 'faculty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              By Faculty
            </button>
            <button
              onClick={() => {
                setViewType('room');
                if (rooms.length > 0) setSelectedId(rooms[0].id.toString());
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewType === 'room' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              By Room
            </button>
          </div>

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
          >
            {viewType === 'section' &&
              sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department_name})
                </option>
              ))}
            {viewType === 'faculty' &&
              facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department_name})
                </option>
              ))}
            {viewType === 'room' &&
              rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} - {r.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grid Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>{getTargetLabel()} - Weekly Master Schedule</span>
          </h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
            Phase 1 UI Structure
          </span>
        </div>

        {/* Timetable Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-28 border-r border-slate-700">Day / Period</th>
                {periods.map((p, idx) => (
                  <th key={idx} className="py-3 px-3 text-center border-r border-slate-700">
                    <div>{p.label}</div>
                    <div className="text-[10px] font-mono text-slate-300 font-normal">
                      {p.start_time} - {p.end_time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {workingDays.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold bg-slate-50 border-r border-slate-200 text-slate-800">
                    {day}
                  </td>
                  {periods.map((p, idx) => {
                    const isMorningBreak = p.period_type === 'MorningBreak';
                    const isLunchBreak = p.period_type === 'LunchBreak';

                    if (isMorningBreak) {
                      return (
                        <td
                          key={idx}
                          className="py-3 px-2 text-center bg-amber-50 text-amber-900 font-bold border-r border-slate-200 text-[11px]"
                        >
                          Morning Break
                        </td>
                      );
                    }

                    if (isLunchBreak) {
                      return (
                        <td
                          key={idx}
                          className="py-3 px-2 text-center bg-indigo-50 text-indigo-900 font-bold border-r border-slate-200 text-[11px]"
                        >
                          Lunch Break
                        </td>
                      );
                    }

                    return (
                      <td
                        key={idx}
                        className="py-3 px-2 text-center border-r border-slate-200 bg-slate-50/40 text-slate-400 italic text-[11px]"
                      >
                        Slot Empty
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Phase 1 Grid Skeleton:</span> Period slot columns dynamically reflect your 50-minute normal class durations and break timings. Generated timetable entries will populate these slots upon completing Phase 2.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTimetable;
