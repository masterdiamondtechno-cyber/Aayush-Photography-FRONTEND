import React, { useState, useEffect } from "react";
import { BiCalendarCheck, BiCalendar, BiCheckCircle, BiXCircle, BiUser, BiTime, BiDetail } from "react-icons/bi";
import { 
  getAllTeacherLeaves, 
  approveTeacherLeave, 
  rejectTeacherLeave, 
  getAllStudentLeaves, 
  approveStudentLeave, 
  rejectStudentLeave 
} from "../../api/api";
import { getAuthValue } from "../../utils/auth";

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState("teacher-leaves"); // "teacher-leaves" or "student-leaves"
  
  const [teacherLeaves, setTeacherLeaves] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [errorTeachers, setErrorTeachers] = useState(null);

  const [studentLeaves, setStudentLeaves] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorStudents, setErrorStudents] = useState(null);

  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    leaveId: null,
    leaveType: "", // "TEACHER" or "STUDENT"
    actionType: "", // "APPROVE" or "REJECT"
    remark: "",
  });

  const fetchTeacherLeaves = async () => {
    setLoadingTeachers(true);
    setErrorTeachers(null);
    try {
      const schoolId = getAuthValue("schoolId");
      if (!schoolId) {
        setErrorTeachers("School configuration is missing.");
        setLoadingTeachers(false);
        return;
      }
      const res = await getAllTeacherLeaves({
        schoolId,
        statusFilter: "ALL"
      });
      if (res.status === "SUCCESS") {
        if (res.data && Array.isArray(res.data.leaves)) {
          setTeacherLeaves(res.data.leaves);
        } else if (Array.isArray(res.data)) {
          setTeacherLeaves(res.data);
        } else {
          setTeacherLeaves([]);
        }
      } else {
        setErrorTeachers(res.message || "Failed to fetch teacher leaves");
      }
    } catch (err) {
      console.error("Error fetching teacher leaves:", err);
      setErrorTeachers(err.message || "Failed to load teacher leaves");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchStudentLeaves = async () => {
    setLoadingStudents(true);
    setErrorStudents(null);
    try {
      const schoolId = getAuthValue("schoolId");
      if (!schoolId) {
        setErrorStudents("School configuration is missing.");
        setLoadingStudents(false);
        return;
      }
      const res = await getAllStudentLeaves({
        schoolId,
        statusFilter: "ALL"
      });
      if (res.status === "SUCCESS") {
        if (res.data && Array.isArray(res.data.leaves)) {
          setStudentLeaves(res.data.leaves);
        } else if (Array.isArray(res.data)) {
          setStudentLeaves(res.data);
        } else {
          setStudentLeaves([]);
        }
      } else {
        setErrorStudents(res.message || "Failed to fetch student leaves");
      }
    } catch (err) {
      console.error("Error fetching student leaves:", err);
      setErrorStudents(err.message || "Failed to load student leaves");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "teacher-leaves") {
      fetchTeacherLeaves();
    } else {
      fetchStudentLeaves();
    }
  }, [activeTab]);

  const handleAction = (leaveId, leaveType, actionType) => {
    setRemarkModal({
      isOpen: true,
      leaveId,
      leaveType,
      actionType,
      remark: "",
    });
  };

  const submitAction = async () => {
    const { leaveId, leaveType, actionType, remark } = remarkModal;
    if (actionType === "REJECT" && !remark.trim()) {
      alert("Please provide a rejection remark.");
      return;
    }

    try {
      const schoolId = getAuthValue("schoolId");
      let apiCall;
      if (leaveType === "TEACHER") {
        apiCall = actionType === "APPROVE" ? approveTeacherLeave : rejectTeacherLeave;
      } else {
        apiCall = actionType === "APPROVE" ? approveStudentLeave : rejectStudentLeave;
      }

      const res = await apiCall({
        id: leaveId,
        schoolId,
        reviewRemark: remark,
        reviewedBy: "School Management"
      });

      if (res.status === "SUCCESS") {
        alert(`Leave request successfully ${actionType === "APPROVE" ? "approved" : "rejected"}.`);
        setRemarkModal({ isOpen: false, leaveId: null, leaveType: "", actionType: "", remark: "" });
        if (leaveType === "TEACHER") {
          fetchTeacherLeaves();
        } else {
          fetchStudentLeaves();
        }
      } else {
        alert(res.message || `Failed to complete request.`);
      }
    } catch (err) {
      alert(err.message || `Failed to process request.`);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" };
      case "REJECTED":
        return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
      case "CANCELLED":
        return { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" };
      case "PENDING":
      default:
        return { bg: "#fffbeb", color: "#92400e", border: "#fde68a" };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Stats calculation
  const pendingTeacherCount = teacherLeaves.filter(l => l.status === "PENDING").length;
  const pendingStudentCount = studentLeaves.filter(l => l.status === "PENDING").length;

  return (
    <div className="leave-page space-y-8">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .admin-leave-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.06) !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Leave Management Panel
          </h1>
          <p className="text-sm text-slate-500">
            Review, approve or reject leaves for teachers and students
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BiCalendarCheck size={28} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Teacher Leaves</div>
            <div className="mt-1 font-['Lexend'] text-2xl font-extrabold text-slate-900">
              {pendingTeacherCount}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BiCalendarCheck size={28} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Student Leaves</div>
            <div className="mt-1 font-['Lexend'] text-2xl font-extrabold text-slate-900">
              {pendingStudentCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab("teacher-leaves")}
          className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-bold transition ${
            activeTab === "teacher-leaves"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Teacher Leaves
          {pendingTeacherCount > 0 && (
            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {pendingTeacherCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("student-leaves")}
          className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-bold transition ${
            activeTab === "student-leaves"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Student Leaves
          {pendingStudentCount > 0 && (
            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {pendingStudentCount}
            </span>
          )}
        </button>
      </div>

      {/* Main List */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
        {activeTab === "teacher-leaves" ? (
          <div>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>
              Teacher Leave Requests
            </h2>

            {loadingTeachers ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </div>
            ) : errorTeachers ? (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", border: "1px solid #fecaca" }}>
                {errorTeachers}
              </div>
            ) : teacherLeaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
                <BiCalendar size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0, fontSize: "16px" }}>No teacher leave requests found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {teacherLeaves.map((leave) => {
                  const colors = getStatusStyle(leave.status);
                  return (
                    <div
                      key={leave.id}
                      className="admin-leave-card"
                      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                            {leave.leaveRefId || `REF-${leave.id}`}
                          </div>
                          <span style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                            {leave.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                          Applied: {formatDate(leave.createdAt)}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Teacher Name
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <BiUser /> {leave.teacherName}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Leave Type
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>
                            {leave.leaveType}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Duration
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <BiTime /> {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Total Days
                          </div>
                          <div style={{ fontSize: "15px", color: "#2563eb", fontWeight: "700" }}>
                            {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}
                          </div>
                        </div>
                      </div>

                      {leave.reason && (
                        <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#475569", lineHeight: "1.4", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                      )}

                      {leave.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                          <button
                            onClick={() => handleAction(leave.id, "TEACHER", "APPROVE")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#22c55e", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
                          >
                            <BiCheckCircle /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, "TEACHER", "REJECT")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#ef4444", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
                          >
                            <BiXCircle /> Reject
                          </button>
                        </div>
                      )}

                      {(leave.status === "APPROVED" || leave.status === "REJECTED") && (leave.reviewedBy || leave.reviewRemark) && (
                        <div style={{ marginTop: "15px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0", fontSize: "13px", color: "#475569" }}>
                          {leave.reviewedBy && (
                            <div style={{ marginBottom: "4px" }}>
                              <span style={{ color: "#94a3b8" }}>Reviewed By:</span> <strong>{leave.reviewedBy}</strong>
                            </div>
                          )}
                          {leave.reviewRemark && (
                            <div>
                              <span style={{ color: "#94a3b8" }}>Remark:</span> <span style={{ color: "#334155", fontStyle: "italic" }}>"{leave.reviewRemark}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>
              Student Leave Requests
            </h2>

            {loadingStudents ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </div>
            ) : errorStudents ? (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", border: "1px solid #fecaca" }}>
                {errorStudents}
              </div>
            ) : studentLeaves.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
                <BiCalendar size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0, fontSize: "16px" }}>No student leave requests found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {studentLeaves.map((leave) => {
                  const colors = getStatusStyle(leave.status);
                  return (
                    <div
                      key={leave.id}
                      className="admin-leave-card"
                      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                            {leave.leaveRefId || `REF-${leave.id}`}
                          </div>
                          <span style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                            {leave.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                          Applied: {formatDate(leave.createdAt)}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Student Name
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <BiUser /> {leave.studentName}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Leave Type
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>
                            {leave.leaveType}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Duration
                          </div>
                          <div style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <BiTime /> {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>
                            Total Days
                          </div>
                          <div style={{ fontSize: "15px", color: "#2563eb", fontWeight: "700" }}>
                            {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}
                          </div>
                        </div>
                      </div>

                      {leave.reason && (
                        <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#475569", lineHeight: "1.4", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                      )}

                      {leave.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                          <button
                            onClick={() => handleAction(leave.id, "STUDENT", "APPROVE")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#22c55e", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
                          >
                            <BiCheckCircle /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, "STUDENT", "REJECT")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#ef4444", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
                          >
                            <BiXCircle /> Reject
                          </button>
                        </div>
                      )}

                      {(leave.status === "APPROVED" || leave.status === "REJECTED") && (leave.reviewedBy || leave.reviewRemark) && (
                        <div style={{ marginTop: "15px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0", fontSize: "13px", color: "#475569" }}>
                          {leave.reviewedBy && (
                            <div style={{ marginBottom: "4px" }}>
                              <span style={{ color: "#94a3b8" }}>Reviewed By:</span> <strong>{leave.reviewedBy}</strong>
                            </div>
                          )}
                          {leave.reviewRemark && (
                            <div>
                              <span style={{ color: "#94a3b8" }}>Remark:</span> <span style={{ color: "#334155", fontStyle: "italic" }}>"{leave.reviewRemark}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {remarkModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "30px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>
              {remarkModal.actionType === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
            </h3>
            <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}>
              Please enter an optional review remark/remark for this action.
            </p>

            <textarea
              placeholder="e.g. Approved. Cover missed syllabus. / Rejected due to exam schedule."
              value={remarkModal.remark}
              onChange={(e) => setRemarkModal(prev => ({ ...prev, remark: e.target.value }))}
              style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", resize: "none", marginBottom: "20px" }}
            />

            <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
              <button
                onClick={() => setRemarkModal({ isOpen: false, leaveId: null, leaveType: "", actionType: "", remark: "" })}
                style={{ padding: "10px 20px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "transparent", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                style={{ padding: "10px 20px", border: "none", borderRadius: "8px", background: remarkModal.actionType === "APPROVE" ? "#22c55e" : "#ef4444", color: "#fff", fontWeight: "600", cursor: "pointer" }}
              >
                Confirm {remarkModal.actionType === "APPROVE" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
