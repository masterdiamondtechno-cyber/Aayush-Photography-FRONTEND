import { 
  BiGridAlt, BiGridSmall, BiUser, BiGroup, 
  BiVideo, BiPlayCircle, BiFile, BiTable, 
  BiCalendarCheck, BiBuilding, BiBookOpen, 
  BiWallet, BiCreditCard, BiBarChartAlt, 
  BiMessageDetail, BiCog, BiLogOutCircle, BiMap,
  BiMessageSquareAdd,
  BiHomeAlt
} from 'react-icons/bi';


export const ADMIN_SIDEBAR_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: BiGridAlt },
  { path: '/home', label: 'Home', icon: BiHomeAlt },
  { path: '/admin/users', label: 'User Management', icon: BiGroup },
  { path: '/admin/classes', label: 'Class & Section', icon: BiBuilding },

  // 🔥 FIXED PART
  { path: '/admin/master-menu', label: 'Master Menu', icon: BiGridSmall },
  { path: '/admin/student', label: 'Student', icon: BiGroup },
  { path: '/admin/teacher', label: 'Teacher', icon: BiUser },
  { path: '/admin/employee',label: 'Employee', icon: BiGroup},

  { path: '/admin/live-lecture', label: 'Live Lecture', icon: BiVideo },
  { path: '/admin/recorded-lecture', label: 'Recorded Lecture', icon: BiPlayCircle },
  { path: '/admin/syllabus', label: 'Syllabus', icon: BiFile },
  { path: '/admin/timetable', label: 'Time Table (Daily)', icon: BiTable },
  { path: '/admin/attendance', label: 'Attendance', icon: BiCalendarCheck },
  { path: '/admin/exam-center', label: 'Exam Center', icon: BiBuilding },
  { path: '/admin/study-material', label: 'Study Material', icon: BiBookOpen },
  { path: '/admin/workspace', label: 'Assignments Workspace', icon: BiBookOpen },
  { path: '/admin/fee-collection', label: 'Student Fee Collection', icon: BiWallet },
  { path: '/admin/teacher-payment', label: 'Teacher Payment', icon: BiCreditCard },
  { path: '/admin/leave-management', label: 'Leave Management', icon: BiCalendarCheck },
  { path: '/admin/noticeboard', label: 'Notice Board', icon: BiMessageSquareAdd },
  { path: '/admin/ticket', label: 'Ticket', icon: BiMessageDetail },
  { path: '/admin/settings', label: 'Setting', icon: BiCog },
];



export const PARENT_SIDEBAR_LINKS = [];





export const MOCK_NOTICES = [
  { title: 'Update on Examinations', date: '2026-03-01', sender: 'Principal' },
  { title: 'Holiday Announcement', date: '2026-03-05', sender: 'Admin' },
  { title: 'New Teaching Resources', date: '2026-03-10', sender: 'HOD' },
];

export const MOCK_STATS = {
  teachers: 25,
  students: 450,
  schoolName: 'St. Xavier Academy',
  schoolInfo: 'Established 1995 | Excellence in Education',
};

export const MOCK_STUDENT_PROGRESS = [
  { standard: '1st', progress: 90 },
  { standard: '2nd', progress: 78 },
  { standard: '3rd', progress: 92 },
  { standard: '4th', progress: 88 },
  { standard: '5th', progress: 81 },
  { standard: '6th', progress: 89 },
];

export const MOCK_TEACHER_ATTENDANCE = [
  { name: 'Arvind Verma', status: 'Present' },
  { name: 'Sneha Sharma', status: 'Present' },
  { name: 'Raj Kumar', status: 'Absent' },
  { name: 'Priya Singh', status: 'Present' },
];

export const MOCK_STANDARD_WISE_COUNT = [
  { standard: '1st', count: 45 },
  { standard: '2nd', count: 52 },
  { standard: '3rd', count: 48 },
  { standard: '4th', count: 55 },
  { standard: '5th', count: 50 },
  { standard: '6th', count: 50 },
];

export const MOCK_FEE_COLLECTION = [
  { standard: '1st', amount: '₹4,50,000' },
  { standard: '2nd', amount: '₹5,20,000' },
  { standard: '3rd', amount: '₹4,80,000' },
  { standard: '4th', amount: '₹5,50,000' },
];

export const MOCK_TEACHERS = [
  { id: 101, name: 'Arvind Verma', role: 'Mathematics', email: 'arvind@example.com', phone: '+91 98765 43210', qualification: 'M.Sc Mathematics', salary: 45000, status: 'Active', address: '12, Knowledge Park, Pune', joinDate: '2022-01-15' },
  { id: 102, name: 'Sneha Sharma', role: 'Science', email: 'sneha@example.com', phone: '+91 87654 32109', qualification: 'M.Sc Physics', salary: 42000, status: 'Active', address: '45, Green Valley, Mumbai', joinDate: '2023-02-10' },
  { id: 103, name: 'Raj Kumar', role: 'English', email: 'raj@example.com', phone: '+91 76543 21098', qualification: 'M.A English', salary: 40000, status: 'Active', address: '78, Sunshine Colony, Delhi', joinDate: '2021-11-20' },
  { id: 104, name: 'Priya Singh', role: 'Hindi', email: 'priya@example.com', phone: '+91 65432 10987', qualification: 'M.A Hindi', salary: 38000, status: 'Active', address: '23, River Road, Jaipur', joinDate: '2023-06-01' },
  { id: 105, name: 'Vikram Patel', role: 'Computer Science', email: 'vikram@example.com', phone: '+91 54321 09876', qualification: 'M.Tech CS', salary: 50000, status: 'On Leave', address: '56, Tech Park, Bangalore', joinDate: '2020-08-15' },
];

export const MOCK_STUDENTS = [
  { id: 1001, name: 'Yogesh Yadav', class: '10', section: 'A', email: 'yogesh@example.com', phone: '+91 91234 56780', guardian: 'Mukesh Yadav', guardianRelation: 'Father', guardianPhone: '+91 98765 43210', dob: '2010-05-12', rollNo: 24, status: 'Active', address: 'Knowledge City, House #404, Pune' },
  { id: 1002, name: 'Deepak Singh', class: '12', section: 'B', email: 'deepak@example.com', phone: '+91 81234 56781', guardian: 'Ramesh Singh', guardianRelation: 'Father', guardianPhone: '+91 87654 32109', dob: '2008-11-08', rollNo: 12, status: 'Active', address: '15, MG Road, Mumbai' },
  { id: 1003, name: 'Anjali Gupta', class: '9', section: 'C', email: 'anjali@example.com', phone: '+91 71234 56782', guardian: 'Sunita Gupta', guardianRelation: 'Mother', guardianPhone: '+91 76543 21098', dob: '2011-03-22', rollNo: 8, status: 'Active', address: '32, Nehru Nagar, Delhi' },
  { id: 1004, name: 'Rahul Mehta', class: '10', section: 'A', email: 'rahul@example.com', phone: '+91 61234 56783', guardian: 'Suresh Mehta', guardianRelation: 'Father', guardianPhone: '+91 65432 10987', dob: '2010-09-15', rollNo: 31, status: 'Active', address: '67, Civil Lines, Jaipur' },
  { id: 1005, name: 'Sneha Patil', class: '11', section: 'A', email: 'sneha.p@example.com', phone: '+91 51234 56784', guardian: 'Anita Patil', guardianRelation: 'Mother', guardianPhone: '+91 54321 09876', dob: '2009-07-30', rollNo: 5, status: 'Inactive', address: '89, Station Road, Nagpur' },
];

export const MOCK_TEACHER_SALARY_REPORT = [
  { id: 1, teacherId: 101, name: 'Arvind Verma', department: 'Mathematics', salary: 45000, status: 'Paid', paidDate: '2026-03-01', month: 'March 2026' },
  { id: 2, teacherId: 102, name: 'Sneha Sharma', department: 'Science', salary: 42000, status: 'Paid', paidDate: '2026-03-01', month: 'March 2026' },
  { id: 3, teacherId: 103, name: 'Raj Kumar', department: 'English', salary: 40000, status: 'Pending', paidDate: null, month: 'March 2026' },
  { id: 4, teacherId: 104, name: 'Priya Singh', department: 'Hindi', salary: 38000, status: 'Paid', paidDate: '2026-03-02', month: 'March 2026' },
  { id: 5, teacherId: 105, name: 'Vikram Patel', department: 'Computer Science', salary: 50000, status: 'Pending', paidDate: null, month: 'March 2026' },
];

export const MOCK_STUDENT_ATTENDANCE_REPORT = [
  { id: 1, studentId: 1001, name: 'Yogesh Yadav', class: '10', section: 'A', totalDays: 25, presentDays: 23, absentDays: 2, percentage: 92 },
  { id: 2, studentId: 1002, name: 'Deepak Singh', class: '12', section: 'B', totalDays: 25, presentDays: 20, absentDays: 5, percentage: 80 },
  { id: 3, studentId: 1003, name: 'Anjali Gupta', class: '9', section: 'C', totalDays: 25, presentDays: 24, absentDays: 1, percentage: 96 },
  { id: 4, studentId: 1004, name: 'Rahul Mehta', class: '10', section: 'A', totalDays: 25, presentDays: 18, absentDays: 7, percentage: 72 },
  { id: 5, studentId: 1005, name: 'Sneha Patil', class: '11', section: 'A', totalDays: 25, presentDays: 22, absentDays: 3, percentage: 88 },
];

export const MOCK_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@school.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'John Doe', email: 'john@teacher.com', role: 'Teacher', status: 'Active' },
  { id: 3, name: 'Jane Smith', email: 'jane@student.com', role: 'Student', status: 'Active' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@owner.com', role: 'Owner', status: 'Active' },
];

export const MOCK_CLASSES = [
  { id: 1, name: '10th Standard', sections: ['A', 'B', 'C'], classTeacher: 'Arvind Verma' },
  { id: 2, name: '11th Standard', sections: ['A', 'B'], classTeacher: 'Sneha Sharma' },
  { id: 3, name: '12th Standard', sections: ['A', 'B', 'C', 'D'], classTeacher: 'Raj Kumar' },
];
export const MOCK_EXAMS = [
  { id: 'EX001', name: 'Half Yearly Examination', type: 'Main', startDate: '2026-03-20', endDate: '2026-03-30', status: 'Upcoming' },
  { id: 'EX002', name: 'Monthly Unit Test 1', type: 'Unit Test', startDate: '2026-02-15', endDate: '2026-02-18', status: 'Completed' },
];

export const MOCK_SCHOOL_REQUESTS = [
  { id: 1, name: 'Bright Future International', location: 'Bandra, Mumbai', applicant: 'Rohit Sharma', date: '2026-04-05', logo: 'BF' },
  { id: 2, name: 'Zenith Global School', location: 'Hitech City, Hyderabad', applicant: 'Priya Reddy', date: '2026-04-07', logo: 'ZG' },
  { id: 3, name: 'Royal Academy', location: 'Indiranagar, Bangalore', applicant: 'Sanjay Kumar', date: '2026-04-08', logo: 'RA' },
];

export const MOCK_TIMETABLE = {
  '10-A': [
    { day: 'Monday', period: '09:00 - 10:00', subject: 'Mathematics', teacher: 'Arvind Verma' },
    { day: 'Monday', period: '10:00 - 11:00', subject: 'Science', teacher: 'Sneha Sharma' },
    { day: 'Tuesday', period: '09:00 - 10:00', subject: 'English', teacher: 'Raj Kumar' },
  ]
};
export const MOCK_BRANCHES = [
  {
    id: 1,
    name: "Main Branch",
    location: "Pune",
    students: 450,
    teachers: 25,
    status: "Active"
  },
  {
    id: 2,
    name: "City Branch",
    location: "Mumbai",
    students: 300,
    teachers: 18,
    status: "Active"
  },
  {
    id: 3,
    name: "North Branch",
    location: "Delhi",
    students: 280,
    teachers: 20,
    status: "Inactive"
  }
];


export const MOCK_DIRECTORS = [
  {
    id: 1,
    name: "Pankaj Sir",
    email: "pankaj@school.com",
    phone: "+91 9876543210",
    role: "Managing Director",
    status: "Active"
  },
  {
    id: 2,
    name: "Rahul Sharma",
    email: "rahul@school.com",
    phone: "+91 9123456780",
    role: "Director",
    status: "Active"
  },
  {
    id: 3,
    name: "Neha Patil",
    email: "neha@school.com",
    phone: "+91 9988776655",
    role: "Director",
    status: "Inactive"
  }
];

export const OWNER_SIDEBAR_LINKS = [];

export const SUPERADMIN_SIDEBAR_LINKS = [];
