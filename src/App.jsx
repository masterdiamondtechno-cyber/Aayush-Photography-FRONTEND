import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import Home from "./pages/public/Home";
import AboutUs from "./pages/public/AboutUs";
import Courses from "./pages/public/Courses";
import Facilities from "./pages/public/Facilities";
import Gallery from "./pages/public/Gallery";
import FAQ from "./pages/public/FAQ";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import ForgotPassword from "./pages/public/ForgotPassword";
import Dashboard from "./pages/admin/Dashboard";
import Teachers from "./pages/admin/Teachers";
import TeacherReport from "./pages/admin/TeacherReport";
import Students from "./pages/admin/Students";
import StudentReport from "./pages/admin/StudentReport";
import Attendance from "./pages/admin/Attendance";
import Noticeboard from "./pages/admin/Noticeboard";
import Subjects from "./pages/admin/Subjects";
import Timetable from "./pages/admin/Timetable";
import Settings from "./pages/admin/Settings";
import UserManagement from "./pages/admin/UserManagement";
import Classes from "./pages/admin/Classes";
import ExamCenter from "./pages/admin/Exams";
import LiveLecture from "./pages/admin/LiveLecture";
import RecordedLecture from "./pages/admin/RecordedLecture";
import Syllabus from "./pages/admin/Syllabus";
import StudyMaterial from "./pages/admin/StudyMaterial";
import FeeCollection from "./pages/admin/FeeCollection";
import TeacherPayment from "./pages/admin/TeacherPayment";
import LeaveManagement from "./pages/admin/LeaveManagement";
import Ticket from "./pages/admin/Ticket";
import TeacherLayout from "./components/layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherStudents from "./pages/teacher/Students";
import TeacherSubjects from "./pages/teacher/Subjects";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherSettings from "./pages/teacher/Settings";
import TeacherTimetable from "./pages/teacher/Timetable";
import TeacherStudyMaterial from "./pages/teacher/StudyMaterial";
import TeacherWorkspace from "./pages/teacher/Workspace";
import LiveTeacherLecture from "./pages/teacher/LiveTeacherLecture";
import RecordedTeacherLeacture from "./pages/teacher/RecordedTeacherLeacture";
import AdminWorkspace from "./pages/admin/Workspace";

import StudentLayout from "./components/layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentTimetable from "./pages/student/Timetable";
import StudentExamination from "./pages/student/Examination";
import StudentWorkspace from "./pages/student/Workspace";
import StudentProfile from "./pages/student/Profile";
import StudentLiveLecture from "./pages/student/LiveLecture";
import StudentRecordedLecture from "./pages/student/RecordedLecture";
import StudentBusTracking from "./pages/student/BusTracking";
import StudentChangePassword from "./pages/student/ChangePassword";
import ChangeFirstPassword from "./pages/public/ChangeFirstPassword";
import StudentLeave from "./pages/student/StudentLeave";
import { getDashboardURL } from "./utils/auth";

import MasterSetupGuard from "./components/common/MasterSetupGuard";
import SubscriptionGuard from "./components/common/SubscriptionGuard";

import MasterMenuPage from "./pages/admin/MasterMenuPage";
import StudentPage from "./pages/admin/StudentPage";
import TeacherPage from "./pages/admin/TeacherPage";
import ClassPage from "./pages/admin/ClassPage";

import EmployeePage from "./pages/admin/EmployeePage";
import TeacherLeave from "./pages/teacher/TeacherLeave";
import ErrorBoundary from "./components/common/ErrorBoundary";

/**
 * Main Application Component
 * Handles global routing and layout management
 */
function App() {
  return (
    <Router>
      <div className="app-container">
        <ErrorBoundary>
          <Routes>
            {/* Public Routes - Ayushyachi Photography */}
            <Route path="/" element={<PublicLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="courses" element={<Courses />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="student/change-password" element={<StudentChangePassword />} />
            <Route path="change-first-password" element={<ChangeFirstPassword />} />
          </Route>

          {/* Direct Public Routes */}
          <Route path="/change-first-password" element={<ChangeFirstPassword />} />
          <Route path="/dashboard" element={<Navigate to={getDashboardURL()} replace />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
              />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="teachers" element={<MasterSetupGuard step={5}><Teachers /></MasterSetupGuard>} />
            <Route path="teachers/report" element={<TeacherReport />} />
            <Route path="students" element={<MasterSetupGuard step={7}><Students /></MasterSetupGuard>} />
            <Route path="students/report" element={<StudentReport />} />
            <Route path="attendance" element={<MasterSetupGuard step={10}><Attendance /></MasterSetupGuard>} />
            <Route path="noticeboard" element={<Noticeboard />} />
            <Route path="master-menu" element={<MasterMenuPage />}></Route>
            <Route path="student" element={<MasterSetupGuard step={7}><Students /></MasterSetupGuard>} />
            <Route path="teacher" element={<MasterSetupGuard step={5}><Teachers /></MasterSetupGuard>} />
            <Route path="employee" element={<EmployeePage/>}></Route>
            <Route path="subjects" element={<MasterSetupGuard step={4}><Subjects /></MasterSetupGuard>} />
            <Route path="timetable" element={<MasterSetupGuard step={9}><Timetable /></MasterSetupGuard>} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="live-lecture" element={<LiveLecture />} />
            <Route path="fee-collection" element={<MasterSetupGuard step={12}><FeeCollection /></MasterSetupGuard>} />
            <Route path="teacher-payment" element={<TeacherPayment />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="ticket" element={<Ticket />} />
            <Route path="recorded-lecture" element={<RecordedLecture />} />
            <Route path="syllabus" element={<Syllabus />} />
            <Route path="study-material" element={<StudyMaterial />} />
            <Route path="classes" element={<MasterSetupGuard step={2}><Classes /></MasterSetupGuard>} />
            <Route path="exam-center" element={<MasterSetupGuard step={11}><ExamCenter /></MasterSetupGuard>} />
            <Route path="workspace" element={<AdminWorkspace />} />
          </Route>

          {/* School Routes (Alias for Admin) */}
          <Route path="/school" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/school/dashboard" replace />}
              />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="teachers" element={<MasterSetupGuard step={5}><Teachers /></MasterSetupGuard>} />
            <Route path="teachers/report" element={<TeacherReport />} />
            <Route path="students" element={<MasterSetupGuard step={7}><Students /></MasterSetupGuard>} />
            <Route path="students/report" element={<StudentReport />} />
            <Route path="attendance" element={<MasterSetupGuard step={10}><Attendance /></MasterSetupGuard>} />
            <Route path="noticeboard" element={<Noticeboard />} />
            <Route path="master-menu" element={<MasterMenuPage />}></Route>
            <Route path="student" element={<MasterSetupGuard step={7}><Students /></MasterSetupGuard>} />
            <Route path="teacher" element={<MasterSetupGuard step={5}><Teachers /></MasterSetupGuard>} />
            <Route path="employee" element={<EmployeePage/>}></Route>
            <Route path="subjects" element={<MasterSetupGuard step={4}><Subjects /></MasterSetupGuard>} />
            <Route path="timetable" element={<MasterSetupGuard step={9}><Timetable /></MasterSetupGuard>} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="live-lecture" element={<LiveLecture />} />
            <Route path="fee-collection" element={<MasterSetupGuard step={12}><FeeCollection /></MasterSetupGuard>} />
            <Route path="teacher-payment" element={<TeacherPayment />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="ticket" element={<Ticket />} />
            <Route path="recorded-lecture" element={<RecordedLecture />} />
            <Route path="syllabus" element={<Syllabus />} />
            <Route path="study-material" element={<StudyMaterial />} />
            <Route path="classes" element={<MasterSetupGuard step={2}><Classes /></MasterSetupGuard>} />
            <Route path="exam-center" element={<MasterSetupGuard step={11}><ExamCenter /></MasterSetupGuard>} />
            <Route path="workspace" element={<AdminWorkspace />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route
              index
              element={<Navigate to="/teacher/dashboard" replace />}
            />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="subjects" element={<TeacherSubjects />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="noticeboard" element={<Noticeboard />} />
            <Route path="leave" element={<TeacherLeave/>}></Route>
            <Route path="timetable" element={<TeacherTimetable />} />
            <Route path="study-material" element={<TeacherStudyMaterial />} />
            <Route path="workspace" element={<TeacherWorkspace />} />
            <Route path="settings" element={<TeacherSettings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route
              index
              element={<Navigate to="/student/dashboard" replace />}
            />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="examination" element={<StudentExamination />} />
            <Route path="workspace" element={<StudentWorkspace />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="live-lecture" element={<SubscriptionGuard feature="live-lectures"><StudentLiveLecture /></SubscriptionGuard>} />
            <Route path="recorded-lecture" element={<SubscriptionGuard feature="recorded-lectures"><StudentRecordedLecture /></SubscriptionGuard>} />
            <Route path="bus-tracking" element={<SubscriptionGuard feature="bus-tracking"><StudentBusTracking /></SubscriptionGuard>} />
            <Route path="leave" element={<StudentLeave />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;


