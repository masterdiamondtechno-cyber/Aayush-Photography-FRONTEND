import React, { useState, useEffect } from "react";
import { BiCalendarCheck, BiCalendar, BiCheckCircle, BiXCircle, BiUser, BiTime } from "react-icons/bi";
import { applyTeacherLeave, getTeacherLeaves, getClassStudentLeaves, approveStudentLeave, rejectStudentLeave } from "../../api/api";
import { getAuthValue } from "../../utils/auth";

export default function TeacherLeave() {
  const [activeTab, setActiveTab] = useState("my-leaves"); // "my-leaves" or "student-leaves"
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
    academicYearId: "",
  });

  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [errorLeaves, setErrorLeaves] = useState(null);

  const [studentLeaves, setStudentLeaves] = useState([]);
  const [loadingStudentLeaves, setLoadingStudentLeaves] = useState(false);
  const [errorStudentLeaves, setErrorStudentLeaves] = useState(null);

  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    leaveId: null,
    actionType: "", // "APPROVE" or "REJECT"
    remark: "",
  });

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    setErrorLeaves(null);
    try {
      const schoolId = getAuthValue("schoolId");
      const academicYearId = getAuthValue("academicYearId");
      const teacherId = getAuthValue("teacherId") || getAuthValue("userId");

      if (!schoolId || !teacherId) {
        setErrorLeaves("Session configurations are missing. Please log in again.");
        setLoadingLeaves(false);
        return;
      }

      const res = await getTeacherLeaves({
        schoolId,
        academicYearId,
        teacherId
      });

      if (res.status === "SUCCESS") {
        if (res.data && Array.isArray(res.data.leaves)) {
          setLeaves(res.data.leaves);
        } else if (Array.isArray(res.data)) {
          setLeaves(res.data);
        } else {
          setLeaves([]);
        }
      } else {
        setErrorLeaves(res.message || "Failed to fetch leaves");
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setErrorLeaves(err.message || "Failed to load leave history");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchStudentLeaves = async () => {
    setLoadingStudentLeaves(true);
    setErrorStudentLeaves(null);
    try {
      const schoolId = getAuthValue("schoolId");
      if (!schoolId) {
        setErrorStudentLeaves("School ID is missing.");
        setLoadingStudentLeaves(false);
        return;
      }
      const res = await getClassStudentLeaves({
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
        setErrorStudentLeaves(res.message || "Failed to fetch student leaves");
      }
    } catch (err) {
      console.error("Error fetching student leaves:", err);
      setErrorStudentLeaves(err.message || "Failed to load student leaves");
    } finally {
      setLoadingStudentLeaves(false);
    }
  };

  useEffect(() => {
    if (activeTab === "student-leaves") {
      fetchStudentLeaves();
    } else {
      fetchLeaves();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.leaveType) {
      alert("Please select a leave type.");
      return;
    }
    if (!formData.fromDate || !formData.toDate) {
      alert("Please select both from and to dates.");
      return;
    }
    if (!formData.reason.trim()) {
      alert("Please provide a reason for the leave.");
      return;
    }

    try {
      const schoolId = getAuthValue("schoolId");
      const academicYearId = getAuthValue("academicYearId");
      const teacherId = getAuthValue("teacherId") || getAuthValue("userId");

      const res = await applyTeacherLeave({
        ...formData,
        schoolId,
        teacherId,
        academicYearId
      });
      
      alert("Leave applied successfully");
      
      setFormData({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
        academicYearId: "",
      });

      fetchLeaves();
    } catch (err) {
      alert(err.message || err || "Failed to apply leave");
    }
  };

  const handleStudentLeaveAction = (leaveId, actionType) => {
    setRemarkModal({
      isOpen: true,
      leaveId,
      actionType,
      remark: "",
    });
  };

  const submitStudentLeaveAction = async () => {
    const { leaveId, actionType, remark } = remarkModal;
    if (actionType === "REJECT" && !remark.trim()) {
      alert("Please provide a rejection remark.");
      return;
    }
    try {
      const schoolId = getAuthValue("schoolId");
      const apiCall = actionType === "APPROVE" ? approveStudentLeave : rejectStudentLeave;
      const teacherName = localStorage.getItem("userEmail") ? localStorage.getItem("userEmail").split("@")[0].toUpperCase() : "Class Teacher";

      const res = await apiCall({
        id: leaveId,
        schoolId,
        reviewRemark: remark,
        reviewedBy: "Class Teacher: " + teacherName
      });
      if (res.status === "SUCCESS") {
        alert(`Leave request ${actionType === "APPROVE" ? "approved" : "rejected"} successfully.`);
        setRemarkModal({ isOpen: false, leaveId: null, actionType: "", remark: "" });
        fetchStudentLeaves();
      } else {
        alert(res.message || `Failed to ${actionType.toLowerCase()} leave request.`);
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "30px",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .leave-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.05) !important;
        }
        @media (max-width: 900px) {
          .leave-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
        <BiCalendarCheck size={40} color="#2563eb" />
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#1e293b", fontWeight: "700" }}>
            Leave Management
          </h1>
          <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "14px" }}>
            Submit leave requests and review class student leave applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
        <button
          onClick={() => setActiveTab("my-leaves")}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "my-leaves" ? "#2563eb" : "transparent",
            color: activeTab === "my-leaves" ? "#fff" : "#64748b",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          My Leave Requests
        </button>
        <button
          onClick={() => setActiveTab("student-leaves")}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "student-leaves" ? "#2563eb" : "transparent",
            color: activeTab === "student-leaves" ? "#fff" : "#64748b",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Student Leave Approvals
        </button>
      </div>

      {activeTab === "my-leaves" ? (
        <div className="leave-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "30px", alignItems: "start" }}>
          {/* Left Column: Apply Form */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>
              Apply for Leave
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>
                  Select Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={handleChange}
                  name="leaveType"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", background: "#fff" }}
                >
                  <option value="">Select Leave Type</option>
                  <option value="SICK">SICK</option>
                  <option value="CASUAL">CASUAL</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="MATERNITY">MATERNITY</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>
                  From Date
                </label>
                <input
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleChange}
                  type="date"
                  style={{ width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>
                  To Date
                </label>
                <input
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleChange}
                  type="date"
                  style={{ width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>
                  Reason for Leave
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter details or reason..."
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", resize: "none", outline: "none" }}
                />
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}
              >
                Apply Leave
              </button>
            </form>
          </div>

          {/* Right Column: Leave History */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0", minHeight: "450px" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>
              My Leave History
            </h2>

            {loadingLeaves ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px" }}>
                <div style={{ border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }} />
                <span style={{ color: "#64748b", fontSize: "14px" }}>Retrieving leave records...</span>
              </div>
            ) : errorLeaves ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>{errorLeaves}</p>
                <button onClick={fetchLeaves} style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                  Retry
                </button>
              </div>
            ) : leaves.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "#64748b", textAlign: "center" }}>
                <BiCalendar size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>No leave records found</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "560px", overflowY: "auto", paddingRight: "6px" }}>
                {leaves.map((leave, idx) => {
                  const statusStyle = getStatusStyle(leave.status);
                  return (
                    <div
                      key={leave.id || idx}
                      className="leave-card"
                      style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                          {leave.leaveType} LEAVE
                        </span>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, textTransform: "uppercase" }}>
                          {leave.status || "PENDING"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                        <div>
                          <span style={{ color: "#94a3b8", fontWeight: "500" }}>From:</span> {formatDate(leave.fromDate)}
                        </div>
                        <div>
                          <span style={{ color: "#94a3b8", fontWeight: "500" }}>To:</span> {formatDate(leave.toDate)}
                        </div>
                        {leave.totalDays !== undefined && (
                          <div style={{ marginLeft: "auto", fontWeight: "600", color: "#2563eb" }}>
                            {leave.totalDays} {leave.totalDays === 1 ? "Day" : "Days"}
                          </div>
                        )}
                      </div>

                      {leave.reason && (
                        <p style={{ margin: "0", fontSize: "13px", color: "#64748b", lineHeight: "1.4", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                      )}

                      {(leave.status === "APPROVED" || leave.status === "REJECTED") && (leave.reviewedBy || leave.reviewRemark) && (
                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0", fontSize: "12px", color: "#475569" }}>
                          {leave.reviewedBy && (
                            <div style={{ marginBottom: "2px" }}>
                              <span style={{ color: "#94a3b8" }}>Reviewed By:</span> {leave.reviewedBy}
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
        </div>
      ) : (
        // Tab 2: Student Leave Approvals
        <div style={{ background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>
            Class Student Leave Requests
          </h2>

          {loadingStudentLeaves ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : errorStudentLeaves ? (
            <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", border: "1px solid #fecaca" }}>
              {errorStudentLeaves}
            </div>
          ) : studentLeaves.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
              <BiCalendar size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "16px" }}>No student leave requests found for your class.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
              {studentLeaves.map((leave) => {
                const colors = getStatusStyle(leave.status);
                return (
                  <div
                    key={leave.id}
                    className="leave-card space-y-8"
                    style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                          {leave.leaveRefId}
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
                          onClick={() => handleStudentLeaveAction(leave.id, "APPROVE")}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#22c55e", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" }}
                        >
                          <BiCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => handleStudentLeaveAction(leave.id, "REJECT")}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "none", borderRadius: "8px", background: "#ef4444", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" }}
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
              placeholder="e.g. Approved. Cover missed lectures. / Please provide medical certificate."
              value={remarkModal.remark}
              onChange={(e) => setRemarkModal(prev => ({ ...prev, remark: e.target.value }))}
              style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", resize: "none", marginBottom: "20px" }}
            />

            <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
              <button
                onClick={() => setRemarkModal({ isOpen: false, leaveId: null, actionType: "", remark: "" })}
                style={{ padding: "10px 20px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "transparent", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitStudentLeaveAction}
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
