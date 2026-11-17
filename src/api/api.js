import { data } from 'react-router-dom';
import axiosInstance from './axiosInstance';

// =============================================
// 1. AUTHENTICATION
// =============================================

/** Unified login — Step 2 (OTP verify) or direct login */
export function login(data) {
  return axiosInstance.post('/api/auth/login', data);
}

/** Admin login — Step 1 (credentials → triggers OTP) */
export function adminLogin(data) {
  return axiosInstance.post('/api/auth/login', data);
}

/** Owner login — Step 2 (verify OTP → complete login) */
export function verifyOwnerOtp(data) {
  return axiosInstance.post('/api/auth/otpverify', data);
}

/** Admin register — Step 1 (submit details → triggers OTP) */
export function initiateAdminRegister(data) {
  return axiosInstance.post('/api/auth/admin/register/initiate', data);
}

/** Admin register — Step 2 (verify OTP → activate account) */
export function verifyAdminRegister(data) {
  return axiosInstance.post('/api/auth/admin/register/verify', data);
}

/** Logout — unified for all roles */
export function logout() {
  return axiosInstance.post('/api/auth/logout', {});
}

/** Refresh access token using rotation */
export function refreshAuthToken(data) {
  return axiosInstance.post('/api/auth/refresh', data);
}

/** Change password for first-time login (Institute / School Admin) */
export function changeFirstPassword(data, token = null) {
  const authToken = token || sessionStorage.getItem('tempToken') || localStorage.getItem('token');
  const headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return axiosInstance.post('/api/auth/change-first-password', data, { headers });
}

// Role-specific login aliases (all go through unified login)
export function schoolLogin(data) { return login(data); }
export function teacherLogin(data) { return login(data); }
export function studentLogin(data) { return login(data); }

// =============================================
// 2. SCHOOL MANAGEMENT
// =============================================
export function createSchool(formData) {
  return axiosInstance.post('/api/AddSchool/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function sendSchoolOtp(data) {
  return axiosInstance.post('/api/AddSchool/sendOtp', data);
}

export function verifySchoolOtp(data) {
  return axiosInstance.post('/api/AddSchool/verifyOtp', data);
}

export function updateSchoolPassword(data) {
  return axiosInstance.post('/api/AddSchool/updatePassword', data);
}

export function getAllSchools() {
  return axiosInstance.post('/AddSchool/getAll', {});
}

// =============================================
// 3. ACADEMIC YEAR
// =============================================
export function getCurrentAcademicYear(schoolId) {
  return axiosInstance.post('/academicYear/getCurrent', { schoolId });
}

// =============================================
// 4. STANDARD
// =============================================
export function addStandard(data) {
  return axiosInstance.post('/standard/addStandard', data);
}

export function getAllStandards(schoolId, academicYearId) {
  return axiosInstance.post('/standard/getAllBySchoolId', { schoolId, academicYearId });
}

export function deleteStandard(schoolId, standardId) {
  return axiosInstance.post('/standard/deleteStandard', { schoolId, standardId });
}

// =============================================
// 5. BATCH / DIVISION
// =============================================
export function addBatch(data) {
  return axiosInstance.post('/batch/addBatch', data);
}

export function getAllBatches(schoolId, academicYearId) {
  return axiosInstance.post('/division/getAllBySchoolId', { schoolId, academicYearId });
}

export function addClassDivision(data) {
  return axiosInstance.post('/division/addDivision', data);
}

export function getAllDivisionsByStandardId(data) {
  return axiosInstance.post('/division/getAllDivisionsByStandardId', data);
}

export function updateDivision(data) {
  return axiosInstance.post('/division/updateDivision', data);
}

export function deleteDivision(data) {
  return axiosInstance.post('/division/deleteDivision', data);
}

// =============================================
// 6. SUBJECT (Moved to Section 35 at the bottom)
// =============================================

// =============================================
// 7. STUDENT
// =============================================
export function createStudent(data) {
  return axiosInstance.post('/student/create', data);
}

export function getAllStudents(schoolId, academicYearId) {
  return axiosInstance.post('/student/getall', { schoolId, academicYearId });
}

export function getStudentsBySection(data) {
  return axiosInstance.post('/student/getBySection', data);
}

export function updateStudentStatus(data) {
  return axiosInstance.post('/student/update/status', data);
}

/** Mandatory first login change password */
export function studentChangePassword(data) {
  return axiosInstance.post('/student/changePassword', data);
}

/** Regular password update */
export function studentUpdatePassword(data) {
  return axiosInstance.post('/student/updatePassword', data);
}

export function resetStudentPassword(data) {
  return axiosInstance.post('/student/resetPassword', data);
}

export function resetPasswordBulk(data) {
  return axiosInstance.post('/student/resetPasswordBulk', data);
}

// =============================================
// 8. TEACHER
// =============================================
export function createTeacher(data) {
  return axiosInstance.post('/teacher/create', data);
}

export function getAllTeachers(schoolId, academicYearId) {
  return axiosInstance.post('/teacher/getAllBySchoolId', { schoolId, academicYearId });
}

export function resetTeacherPasswordBulk(data) {
  return axiosInstance.post('/teacher/resetPasswordBulk', data);
}

export function getAllTeachersBySchoolId(data) {
  return axiosInstance.post('/teacher/getAllBySchoolId', data);
}

export function getTeachersForTimetable(data) {
  return axiosInstance.post('/teacher/getAllBySchoolId', data);
}

// =============================================
// 9. DASHBOARD
// =============================================
export function getDashboardSummary(schoolId, academicYearId) {
  return axiosInstance.post('/dashboard/summary', { schoolId, academicYearId });
}

export function getDashboardData(data) {
  return axiosInstance.post('/dashboard/data', data);
}

// =============================================
// 10. STUDENT EXAMS & RESULTS
// =============================================
export function getStudentExams(data) {
  return axiosInstance.post('/exam/getByStudent', data);
}

export function getHallTicket(data) {
  return axiosInstance.post('/exam/hallTicket', data);
}

export function getStudentExamMarks(data) {
  return axiosInstance.post('/exam/marks/getByStudent', data);
}

/** Create exam */
export function createExam(data) {
  return axiosInstance.post('/exam/create', data);
}

/** Get exams for school + academic year */
export function getExamsBySchool(data) {
  return axiosInstance.post('/exam/getBySchool', data);
}

/** Get exams by standard + division */
export function getExamsByDivision(data) {
  return axiosInstance.post('/exam/getByDivision', data);
}

/** Update exam details */
export function updateExam(data) {
  return axiosInstance.post('/exam/update', data);
}

/** Delete exam */
export function deleteExam(data) {
  return axiosInstance.post('/exam/delete', data);
}

/** Save bulk marks for students in an exam */
export function saveMarksBulk(data) {
  return axiosInstance.post('/exam/marks/saveBulk', data);
}

/** Get marks list by exam ID */
export function getMarksByExam(data) {
  return axiosInstance.post('/exam/marks/getByExam', data);
}

// =============================================
// 11. STUDENT WORKSPACE
// =============================================
export function getAssignmentsByClassDivision(data) {
  return axiosInstance.post('/workspace/assignment/getbyclassdivision', data);
}

export function getSingleAssignment(data) {
  return axiosInstance.post('/workspace/assignment/get', data);
}

export function getActiveAssignments(data) {
  return axiosInstance.post('/workspace/assignment/active', data);
}

export function submitAssignment(data) {
  return axiosInstance.post('/workspace/submission/submit', data);
}

export function markAssignmentAsSeen(data) {
  return axiosInstance.post('/workspace/submission/seen', data);
}

export function editSubmission(data) {
  return axiosInstance.post('/workspace/submission/edit', data);
}

export function getSubmissionHistory(data) {
  return axiosInstance.post('/workspace/submission/history', data);
}

export function getMyStudyGroups(data) {
  return axiosInstance.post('/workspace/studygroup/mygroups', data);
}

export function createStudyGroup(data) {
  return axiosInstance.post('/workspace/studygroup/create', data);
}

export function addStudentsToGroup(data) {
  return axiosInstance.post('/workspace/studygroup/addstudents', data);
}

export function createAssignment(data) {
  return axiosInstance.post('/workspace/assignment/create', data);
}

export function updateAssignment(data) {
  return axiosInstance.post('/workspace/assignment/update', data);
}

export function deleteAssignment(data) {
  return axiosInstance.post('/workspace/assignment/delete', data);
}

export function closeAssignment(data) {
  return axiosInstance.post('/workspace/assignment/close', data);
}

export function getAssignmentsByTeacher(data) {
  return axiosInstance.post('/workspace/assignment/getbyteacher', data);
}

export function getSubmissionsByAssignment(data) {
  return axiosInstance.post('/workspace/submission/byassignment', data);
}

export function gradeSubmission(data) {
  return axiosInstance.post('/workspace/submission/grade', data);
}

export function getStudentTimetable(data) {
  return axiosInstance.post('/timetable/getByStudent', data);
}

// =============================================
// 12. ADMIN CLASS & SECTION MANAGEMENT
// =============================================
export function getAllClassesBySchoolId(data) {
  return axiosInstance.post('/standard/getAllBySchoolId', data);
}

export function addClassStandard(data) {
  return axiosInstance.post('/standard/addStandard', data);
}

export function updateClassStandard(data) {
  return axiosInstance.post('/standard/updateStandard', data);
}

export function deleteClassStandard(data) {
  return axiosInstance.post('/standard/deleteStandard', data);
}

// =============================================
// 13. ADMIN TIMETABLE
// =============================================
export function getTimetableByDivision(data) {
  return axiosInstance.post('/timetable/division', data);
}

export function createTimetableSlot(data) {
  return axiosInstance.post('/timetable/create', data);
}

export function createBulkTimetableSlots(data) {
  return axiosInstance.post('/timetable/createBulk', data);
}

export function updateTimetableSlot(data) {
  return axiosInstance.post('/timetable/update', data);
}

export function deleteTimetableSlot(data) {
  return axiosInstance.post('/timetable/delete', data);
}

/** Teacher App Timetable — day/week view */
export function getTeacherAppTimetable(data) {
  return axiosInstance.post('/timetable/teacher-app', data);
}

/** Teacher Dashboard Timetable */
export function getTeacherDashboardTimetable(data) {
  return axiosInstance.post('/timetable/getByTeacher', data);
}

/** Batch Timetable */
export function getBatchTimetable(data) {
  return axiosInstance.post('/timetable/getByBatch', data);
}

/** Class Timetable (teacher context) */
export function getClassTimetable(data) {
  return axiosInstance.post('/timetable/getByClass', data);
}

/** School Timetable (full school view) */
export function getSchoolTimetable(data) {
  return axiosInstance.post('/timetable/getBySchool', data);
}

// =============================================
// 14. TEACHER PAYMENT & PAYROLL
// =============================================
export function getTeacherPayroll(schoolId, academicYearId) {
  return axiosInstance.post('/payroll/getAll', { schoolId, academicYearId });
}

export function createPaymentOrder(data) {
  return axiosInstance.post('/payroll/pay/createOrder', data);
}

export function verifyTeacherPayment(data) {
  return axiosInstance.post('/payroll/pay/verify', data);
}

// =============================================
// 15. SUBSCRIPTION PLANS (ADMIN)
// =============================================
// export function getAllSubscriptionPlans() {
//   return axiosInstance.get('/api/admin/subscription-plans/getAll');
// }

export function getMonthlySubscriptionPlans() {
  return axiosInstance.get('/api/admin/subscription-plans/monthly');
}

export function getYearlySubscriptionPlans() {
  return axiosInstance.get('/api/admin/subscription-plans/yearly');
}


// =============================================
// 16. STUDY MATERIAL
// =============================================

/** Create study material — multipart/form-data upload */
export function createStudyMaterial(formData) {
  return axiosInstance.post('/study-material/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Get all study materials (role-aware) */
export function getAllStudyMaterials(data) {
  return axiosInstance.post('/study-material/getall', data);
}

/** Get single study material by id */
export function getStudyMaterialById(data) {
  return axiosInstance.post('/study-material/getbyid', data);
}

/** Update study material — multipart/form-data */
export function updateStudyMaterial(formData) {
  return axiosInstance.post('/study-material/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Delete study material */
export function deleteStudyMaterial(data) {
  return axiosInstance.post('/study-material/delete', data);
}

/** Download study material — returns presigned S3 URL */
export function downloadStudyMaterial(data) {
  return axiosInstance.post('/study-material/download', data);
}

/** Study material stats (school role only) */
export function getStudyMaterialStats(data) {
  return axiosInstance.post('/study-material/stats', data);
}

// =============================================
// 17. FEE STRUCTURE
// =============================================

/** Create fee structure */
export function createFeeStructure(data) {
  return axiosInstance.post('/fee/structure/create', data);
}

/** Get fee structures by standard */
export function getFeeStructuresByStandard(data) {
  return axiosInstance.post('/fee/structure/getByStandard', data);
}

/** Update fee structure */
export function updateFeeStructure(data) {
  return axiosInstance.post('/fee/structure/update', data);
}

/** Delete fee structure */
export function deleteFeeStructure(data) {
  return axiosInstance.post('/fee/structure/delete', data);
}

// =============================================
// 18. FEE PAYMENT / COLLECTION
// =============================================

/** Get consolidated fee page data (summary + records) */
export function getFeePageData(data) {
  return axiosInstance.post('/fee/payment/getPageData', data);
}

/** Record a fee payment */
export function createFeePayment(data) {
  return axiosInstance.post('/fee/payment/create', data);
}

/** Get payments by student */
export function getFeePaymentsByStudent(data) {
  return axiosInstance.post('/fee/payment/getByStudent', data);
}

/** Update payment record */
export function updateFeePayment(data) {
  return axiosInstance.post('/fee/payment/update', data);
}

/** Delete payment record */
export function deleteFeePayment(data) {
  return axiosInstance.post('/fee/payment/delete', data);
}

/** Get all payments for school + academic year */
export function getAllFeePayments(data) {
  return axiosInstance.post('/fee/payment/getAll', data);
}

// =============================================
// 19. TICKET MANAGEMENT
// =============================================

/** Create a new ticket */
export function createTicket(data) {
  return axiosInstance.post('/tickets', data);
}

/** Update ticket priority (ADMIN/SCHOOL) */
export function updateTicketPriority(id, data) {
  return axiosInstance.put(`/tickets/${id}/priority`, data);
}

/** Update ticket status (lifecycle enforced) */
export function updateTicketStatus(id, data) {
  return axiosInstance.put(`/tickets/${id}/status`, data);
}

/** Update internal ticket notes */
export function updateTicketNotes(id, data) {
  return axiosInstance.put(`/tickets/${id}/notes`, data);
}

/** Reopen a closed ticket */
export function reopenTicket(id) {
  return axiosInstance.put(`/tickets/${id}/reopen`);
}

/** List/filter tickets with pagination (GET) */
export function getTickets(params = {}) {
  return axiosInstance.get('/tickets', { params });
}

// =============================================
// 20. FRANCHISE OWNER — SETUP
// =============================================

/** Create franchise owner (super admin only) */
export function createFranchiseOwner(data) {
  return axiosInstance.post('/api/app_admin/owner/create', data);
}

/** Get list of franchise owners (super admin only) */
export function getFranchiseOwners(data) {
  return axiosInstance.post('/api/app_admin/owner/list', data);
}


// =============================================
// 21. FRANCHISE OWNER — DASHBOARD & STATS
// =============================================

/** Owner KPI Dashboard */
export function getOwnerDashboard(data) {
  return axiosInstance.post('/owner/dashboard', data);
}

/** Aggregate school stats */
export function getOwnerSchoolStats(data) {
  return axiosInstance.post('/owner/schools/stats', data);
}

/** List branches (schools) */
export function getOwnerSchools(data) {
  return axiosInstance.post('/owner/schools', data);
}

/** Request a new school branch */
export function requestOwnerSchool(formData) {
  return axiosInstance.post('/owner/schools/request', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// =============================================
// 22. FRANCHISE OWNER — DIRECTORIES
// =============================================

/** List teachers across branches */
export function getOwnerTeachers(data) {
  return axiosInstance.post('/owner/teachers', data);
}

/** Teacher stats across branches */
export function getOwnerTeacherStats(data) {
  return axiosInstance.post('/owner/teachers/stats', data);
}

/** List students across branches */
export function getOwnerStudents(data) {
  return axiosInstance.post('/owner/students', data);
}

/** Student stats across branches */
export function getOwnerStudentStats(data) {
  return axiosInstance.post('/owner/students/stats', data);
}

// =============================================
// 23. FRANCHISE OWNER — FINANCE
// =============================================

/** Finance summary (billed, collected, pending) */
export function getOwnerFinanceSummary(data) {
  return axiosInstance.post('/owner/finance/summary', data);
}

/** Branch-wise finance comparison */
export function getOwnerFinanceBranchWise(data) {
  return axiosInstance.post('/owner/finance/branch-wise', data);
}

// =============================================
// 24. FRANCHISE OWNER — REPORTS
// =============================================

/** Comprehensive summary (revenue + enrollments) */
export function getOwnerReportSummary(data) {
  return axiosInstance.post('/owner/reports/summary', data);
}

/** Revenue report */
export function getOwnerReportRevenue(data) {
  return axiosInstance.post('/owner/reports/revenue', data);
}

/** Attendance over time */
export function getOwnerReportAttendance(data) {
  return axiosInstance.post('/owner/reports/attendance', data);
}

/** Enrollment additions */
export function getOwnerReportEnrollments(data) {
  return axiosInstance.post('/owner/reports/enrollments', data);
}

/** Fee collection types */
export function getOwnerReportFees(data) {
  return axiosInstance.post('/owner/reports/fees', data);
}

// =============================================
// 24B. FRANCHISE OWNER — PROFILE & SETTINGS
// =============================================

export function getOwnerProfile(data) {
  return axiosInstance.post('/owner/profile', data);
}

export function updateOwnerProfile(data) {
  return axiosInstance.post('/owner/profile/update', data);
}

// =============================================
// 25. SUPER ADMIN — GLOBAL MANAGEMENT
// =============================================

/** Super Admin Dashboard Stats */
export function getSuperAdminDashboard() {
  return axiosInstance.get('/api/app_admin/dashboard/stats');
}

/** Get pending school registration requests */
export function getPendingSchools() {
  return axiosInstance.post('/api/app_admin/SchoolApprovalController/inactive', {});
}

/** Approve or reject a school registration */
export function approveSchool(data) {
  return axiosInstance.post('/api/app_admin/SchoolApprovalController/update-status', {
    schoolId: data.schoolId,
    approvalRejectionStatus: data.status,
    rejectedReason: data.rejectedReason || ''
  });
}

/** Get all schools in the system */
export function getAllSchoolsSuperAdmin(params = {}) {
  return axiosInstance.post('/api/AddSchool/getAll', params);
}

/** Update school status (ACTIVE / INACTIVE) by Super Admin */
export function updateSchoolStatusSuperAdmin(data) {
  return axiosInstance.post('/api/app_admin/SchoolApprovalController/update-school-status', data);
}

/** Get school by ID */
export function getSchoolById(schoolId) {
  return axiosInstance.post('/api/AddSchool/getBySchoolId', { schoolId });
}

/** Update school profile */
export function updateSchool(formData) {
  return axiosInstance.post('/api/AddSchool/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/** Get global tickets across all institutions */
export function getGlobalTickets(params = {}) {
  return axiosInstance.get('/api/app_admin/tickets', { params });
}

/** Global revenue & growth analytics */
export function getGlobalAnalytics(params = {}) {
  return axiosInstance.get('/api/app_admin/analytics/growth', { params });
}

/** Create global announcement */
export function createGlobalAnnouncement(data) {
  return axiosInstance.post('/api/app_admin/announcements/create', data);
}

/** Get all global announcements */
export function getAllGlobalAnnouncements() {
  return axiosInstance.get('/api/app_admin/announcements/getAll');
}

/** Delete a global announcement */
export function deleteGlobalAnnouncement(id) {
  return axiosInstance.delete(`/api/app_admin/announcements/delete/${id}`);
}
// =============================================
// 26. TEACHER DASHBOARD
// =============================================

/** Get teacher stats for dashboard cards */
export function getTeacherStats(data) {
  return axiosInstance.post('/teacher/dashboard/stats', data);
}

/** Get teacher daily schedule */
export function getTeacherSchedule(data) {
  return axiosInstance.post('/teacher/dashboard/schedule', data);
}

/** Get teacher grading tasks */
export function getTeacherGradingTasks(data) {
  return axiosInstance.post('/teacher/dashboard/grading-tasks', data);
}

// =============================================
// 27. TEACHER PAYMENT (NEW MODULE)
// =============================================

/** Get page data — summary cards + payment records */
export function getTeacherPaymentPageData(data) {
  return axiosInstance.post('/teacher-payment/getPageData', data);
}

/** Create a new teacher payment record */
export function createTeacherPaymentRecord(data) {
  return axiosInstance.post('/teacher-payment/create', data);
}

/** Update an existing teacher payment record */
export function updateTeacherPaymentRecord(data) {
  return axiosInstance.post('/teacher-payment/update', data);
}

/** Delete a teacher payment record */
export function deleteTeacherPaymentRecord(data) {
  return axiosInstance.post('/teacher-payment/delete', data);
}

/** Mark a PENDING payment as PAID */
export function markTeacherPaymentPaid(data) {
  return axiosInstance.post('/teacher-payment/markAsPaid', data);
}

/** Get all payment records for a specific teacher */
export function getPaymentsByTeacher(data) {
  return axiosInstance.post('/teacher-payment/getByTeacher', data);
}

// =============================================
// 28. USER MANAGEMENT
// =============================================

/** Get all users (teachers + students combined) */
export function getAllUsers(data) {
  return axiosInstance.post('/usermanagement/getAllUsers', data);
}

/** Get teacher by ID — full details */
export function getTeacherById(data) {
  return axiosInstance.post('/teacher/getById', data);
}

/** Get student by ID — full details */
export function getStudentById(data) {
  return axiosInstance.post('/student/getbyschoolid/studentid', data);
}

/** Update teacher — send id + schoolId + changed fields */
export function updateTeacher(data) {
  return axiosInstance.post('/teacher/update', data);
}

/** Change teacher status — send id + schoolId + status */
export function changeTeacherStatus(data) {
  return axiosInstance.post('/teacher/changeStatus', data);
}

/** Update student — send id + schoolId + changed fields */
export function updateStudent(data) {
  return axiosInstance.post('/student/update', data);
}

/** Delete teacher */
export function deleteTeacher(data) {
  return axiosInstance.post('/teacher/delete', data);
}

/** Delete student */
export function deleteStudent(data) {
  return axiosInstance.post('/student/delete', data);
}

// =============================================
// 29. SYLLABUS MANAGEMENT
// =============================================

/** Create syllabus — multipart/form-data upload */
export function createSyllabus(formData) {
  return axiosInstance.post('/syllabus/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Update syllabus — multipart/form-data */
export function updateSyllabus(formData) {
  return axiosInstance.post('/syllabus/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Delete syllabus */
export function deleteSyllabus(data) {
  return axiosInstance.post('/syllabus/delete', data);
}

/** Get syllabus by ID */
export function getSyllabusById(data) {
  return axiosInstance.post('/syllabus/getById', data);
}

/** Get all syllabi (with optional status filter) */
export function getAllSyllabus(data) {
  return axiosInstance.post('/syllabus/getAll', data);
}

/** Update completed chapters → recalculates progress % */
export function updateSyllabusProgress(data) {
  return axiosInstance.post('/syllabus/updateProgress', data);
}

/** Stats — summary card data */
export function getSyllabusStats(data) {
  return axiosInstance.post('/syllabus/stats', data);
}

/** Download file — returns presigned S3 URL */
export function downloadSyllabus(data) {
  return axiosInstance.post('/syllabus/download', data);
}

/** Update syllabus status */
export function updateSyllabusStatus(data) {
  return axiosInstance.post('/syllabus/updateStatus', data);
}

// =============================================
// 30. EXCEL UPLOAD (BULK IMPORT)
// =============================================

/** Download Excel template — returns .xlsx file */
export function downloadExcelTemplate(type) {
  return axiosInstance.post(`/excel/template/${type}`, {}, {
    responseType: 'blob',
  });
}

/** Upload Excel file for bulk import */
export function uploadExcel(type, formData) {
  return axiosInstance.post(`/excel/upload/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// =================================================
// 31.  TEACHER MODULE (LEAVE- APPLY)
// =================================================

// Apply leave by teacher

export function applyTeacherLeave(data)
{
  return axiosInstance.post(`/teacher-leave/apply`,data,{
    headers: {'Content-Type': 'application/json'},
  });
}

// Get all leaves by teacher
export function getTeacherLeaves(data) {
  return axiosInstance.post('/teacher-leave/getByTeacher', data);
}

// =================================================
// 31A. STUDENT LEAVE MODULE
// =================================================

// Apply leave by student
export function applyStudentLeave(data) {
  return axiosInstance.post(`/student-leave/apply`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get all leaves by student
export function getStudentLeaves(data) {
  return axiosInstance.post('/student-leave/getMyLeaves', data);
}

// Get all leaves by teacher (School view)
export function getAllTeacherLeaves(data) {
  return axiosInstance.post('/teacher-leave/getAll', data);
}

// Approve teacher leave
export function approveTeacherLeave(data) {
  return axiosInstance.post('/teacher-leave/approve', data);
}

// Reject teacher leave
export function rejectTeacherLeave(data) {
  return axiosInstance.post('/teacher-leave/reject', data);
}

// Get all student leaves (School view)
export function getAllStudentLeaves(data) {
  return axiosInstance.post('/student-leave/getAll', data);
}

// Approve student leave (School / Teacher view)
export function approveStudentLeave(data) {
  return axiosInstance.post('/student-leave/approve', data);
}

// Reject student leave (School / Teacher view)
export function rejectStudentLeave(data) {
  return axiosInstance.post('/student-leave/reject', data);
}

// Get class student leaves (Teacher view)
export function getClassStudentLeaves(data) {
  return axiosInstance.post('/student-leave/getClassStudentLeaves', data);
}

// =================================================
// 32. ACADEMIC YEAR MANAGEMENT
// =================================================

export function getAllAcademicYears(data) {
  return axiosInstance.post('/academicYear/getAll', data);
}

export function createAcademicYear(data) {
  return axiosInstance.post('/academicYear/create', data);
}

export function updateAcademicYear(data) {
  return axiosInstance.post('/academicYear/update', data);
}

export function activateAcademicYear(data) {
  return axiosInstance.post('/academicYear/activate', data);
}

export function archiveAcademicYear(data) {
  return axiosInstance.post('/academicYear/archive', data);
}


// =================================================
// 33. STUDENT PROMOTION API
// =================================================

export function getActiveStudents(data) {
  return axiosInstance.post('/student/active', data);
}

export function promoteStudents(data) {
  return axiosInstance.post('/promotion/promoteStudents', data);
}

// =================================================
// 34. MASTER DATA SETUP DEPENDENCY STATUS
// =================================================

export function getMasterSetupStatus(data) {
  return axiosInstance.post('/api/master-setup/status', data);
}

// =================================================
// 35. SUBJECT MANAGEMENT API
// =================================================

export function addSubject(data) {
  return axiosInstance.post('/subject/addSubject', data);
}

export function getAllSubjects(data) {
  return axiosInstance.post('/subject/getAll', data);
}

export function getAllSubjectsBySchool(data) {
  return axiosInstance.post('/subject/getAllBySchoolId', data);
}

export function getSubjectsForTimetable(data) {
  return axiosInstance.post('/subject/getAllBySchoolId', data);
}

export function getSubjectById(data) {
  return axiosInstance.post('/subject/getBySubjectId', data);
}

export function updateSubject(data) {
  return axiosInstance.post('/subject/updateSubject', data);
}

export function deleteSubject(data) {
  return axiosInstance.post('/subject/deleteSubject', data);
}

// =================================================
// 36. TEACHER LOOKUP API
// =================================================

export function getTeacherIdNameBySchool(data) {
  return axiosInstance.post('/teacher/getTeacherIdNameBySchoolId', data);
}

// =================================================
// 37. ATTENDANCE MANAGEMENT API
// =================================================

export function markBulkAttendance(data) {
  return axiosInstance.post('/attendance/markBulk', data);
}

export function getAttendanceByDateAndSubject(data) {
  return axiosInstance.post('/attendance/getByDateAndSubject', data);
}

export function getAttendanceByDate(data) {
  return axiosInstance.post('/attendance/getByDate', data);
}

export function getAttendanceByStudent(data) {
  return axiosInstance.post('/attendance/getByStudent', data);
}

export function updateAttendance(data) {
  return axiosInstance.post('/attendance/update', data);
}

export function getTodayAttendanceSummary(data) {
  return axiosInstance.post('/attendance/summary/today', data);
}

export function getTeacherClasses(data) {
  return axiosInstance.post('/teacher/classes', data);
}

// =================================================
// 38. NOTIFICATION / NOTICE BOARD API
// =================================================

export function createNotification(data) {
  return axiosInstance.post('/notification/create', data);
}

export function getAllNotifications(data) {
  return axiosInstance.post('/notification/getAll', data);
}

export function getActiveNotifications(data) {
  return axiosInstance.post('/notification/getActive', data);
}

export function updateNotification(data) {
  return axiosInstance.post('/notification/update', data);
}

export function deleteNotification(data) {
  return axiosInstance.post('/notification/delete', data);
}

export function deactivateNotification(data) {
  return axiosInstance.post('/notification/deactivate', data);
}

// =================================================
// 39. EMPLOYEE MANAGEMENT API
// =================================================

export function createEmployee(data) {
  return axiosInstance.post('/employee/create', data);
}

export function updateEmployee(data) {
  return axiosInstance.post('/employee/update', data);
}

export function deleteEmployee(data) {
  return axiosInstance.post('/employee/delete', data);
}

export function getAllEmployees(data) {
  return axiosInstance.post('/employee/getAll', data);
}

export function getActiveEmployees(data) {
  return axiosInstance.post('/employee/getActive', data);
}

export function getInactiveEmployees(data) {
  return axiosInstance.post('/employee/getInactive', data);
}

export function getEmployeeById(data) {
  return axiosInstance.post('/employee/getById', data);
}

export function countActiveEmployees(data) {
  return axiosInstance.post('/employee/countActive', data);
}

export function countInactiveEmployees(data) {
  return axiosInstance.post('/employee/countInactive', data);
}

export function countTotalEmployees(data) {
  return axiosInstance.post('/employee/countTotal', data);
}

export function checkEmployeeEmail(data) {
  return axiosInstance.post('/employee/checkEmail', data);
}

export function checkEmployeeMobile(data) {
  return axiosInstance.post('/employee/checkMobile', data);
}

export function changeEmployeeStatus(data) {
  return axiosInstance.post('/employee/changeStatus', data);
}

// =============================================
// 36. MANUAL SUBSCRIPTIONS (SUPER ADMIN)
// =============================================
export function getAvailableSubscriptionPlans() {
  return axiosInstance.get('/api/app_admin/manual-subscriptions/plans');
}

export function assignManualSubscription(data) {
  return axiosInstance.post('/api/app_admin/manual-subscriptions/assign', data);
}

export function getSubscriptionHistory(schoolId) {
  return axiosInstance.get(`/api/app_admin/manual-subscriptions/history/${schoolId}`);
}

export function revokeSubscription(data) {
  return axiosInstance.post('/api/app_admin/manual-subscriptions/revoke', data);
}

export function extendSubscription(data) {
  return axiosInstance.post('/api/app_admin/manual-subscriptions/extend', data);
}

export function updateSubscriptionValidity(data) {
  return axiosInstance.post('/api/app_admin/manual-subscriptions/update-validity', data);
}