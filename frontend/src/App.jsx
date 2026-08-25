import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import UniversitySetup from './pages/UniversitySetup';
import DepartmentsSections from './pages/DepartmentsSections';
import FacultyManagement from './pages/FacultyManagement';
import SubjectsCourses from './pages/SubjectsCourses';
import ClassroomsLabs from './pages/ClassroomsLabs';
import TimetablePreferences from './pages/TimetablePreferences';
import GenerateTimetable from './pages/GenerateTimetable';
import ViewTimetable from './pages/ViewTimetable';
import ValidationConflicts from './pages/ValidationConflicts';
import { getDashboardStats } from './services/api';

const App = () => {
  const [stats, setStats] = useState(null);

  const refreshStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header stats={stats} />
          
          <main className="flex-1 p-6 custom-scrollbar overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard stats={stats} refreshStats={refreshStats} />} />
              <Route path="/university-setup" element={<UniversitySetup refreshStats={refreshStats} />} />
              <Route path="/departments-sections" element={<DepartmentsSections refreshStats={refreshStats} />} />
              <Route path="/faculty" element={<FacultyManagement refreshStats={refreshStats} />} />
              <Route path="/subjects-courses" element={<SubjectsCourses refreshStats={refreshStats} />} />
              <Route path="/classrooms-labs" element={<ClassroomsLabs refreshStats={refreshStats} />} />
              <Route path="/preferences" element={<TimetablePreferences refreshStats={refreshStats} />} />
              <Route path="/generate-timetable" element={<GenerateTimetable stats={stats} refreshStats={refreshStats} />} />
              <Route path="/view-timetable" element={<ViewTimetable />} />
              <Route path="/validation-conflicts" element={<ValidationConflicts />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
