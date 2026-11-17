import React, { useState, useEffect } from "react";
import { BiCalendarCheck, BiCalendar } from "react-icons/bi";
import { applyStudentLeave, getStudentLeaves } from "../../api/api";
import { getAuthValue } from "../../utils/auth";

export default function StudentLeave() {
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

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    setErrorLeaves(null);
    try {
      const schoolId = getAuthValue("schoolId");
      const academicYearId = getAuthValue("academicYearId");
      const studentId = getAuthValue("studentId") || getAuthValue("userId");

      if (!schoolId || !studentId) {
        setErrorLeaves("Session configurations are missing. Please log in again.");
        setLoadingLeaves(false);
        return;
      }

      const res = await getStudentLeaves({
        schoolId,
        academicYearId,
        studentId
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

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Leave API call
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
      const studentId = getAuthValue("studentId") || getAuthValue("userId");

      const res = await applyStudentLeave({
        ...formData,
        schoolId,
        studentId,
        academicYearId
      });
      
      console.log(res);
      alert("Leave applied successfully");
      
      // Reset form
      setFormData({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
        academicYearId: "",
      });

      // Refresh leave history
      fetchLeaves();
    } catch (err) {
      alert(err.message || err || "Failed to apply leave");
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
        .leave-history-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.06) !important;
        }
        @media (max-width: 900px) {
          .leave-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "30px",
        }}
      >
        <BiCalendarCheck size={40} color="#2563eb" />
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#1e293b",
              fontWeight: "700"
            }}
          >
            Leave Module
          </h1>
          <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "14px" }}>
            Submit leave requests and monitor their approval status
          </p>
        </div>
      </div>

      <div
        className="leave-layout-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "30px",
          alignItems: "start"
        }}
      >
        {/* Left Column: Apply Form */}
        <div
          className="card shadow-sm"
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0"
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              color: "#1e293b",
              fontWeight: "600"
            }}
          >
            Apply for Leave
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Leave Type */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "14px"
                }}
              >
                Select Leave Type
              </label>

              <select
                value={formData.leaveType}
                onChange={handleChange}
                name="leaveType"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  outline: "none",
                  background: "#fff"
                }}
              >
                <option value="">Select Leave Type</option>
                <option value="SICK">SICK</option>
                <option value="CASUAL">CASUAL</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            {/* From Date */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "14px"
                }}
              >
                From Date
              </label>

              <input
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                type="date"
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            {/* To Date */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "14px"
                }}
              >
                To Date
              </label>

              <input
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
                type="date"
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            {/* Reason */}
            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "14px"
                }}
              >
                Reason for Leave
              </label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                placeholder="Enter details or reason..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "#1d4ed8"}
              onMouseLeave={(e) => e.target.style.background = "#2563eb"}
            >
              Apply Leave
            </button>
          </form>
        </div>

        {/* Right Column: Leave History */}
        <div
          className="card shadow-sm"
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
            minHeight: "450px"
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              color: "#1e293b",
              fontWeight: "600"
            }}
          >
            My Leave History
          </h2>

          {loadingLeaves ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px" }}>
              <div
                style={{
                  border: "3px solid #e2e8f0",
                  borderTop: "3px solid #2563eb",
                  borderRadius: "50%",
                  width: "35px",
                  height: "35px",
                  animation: "spin 1s linear infinite"
                }}
              ></div>
              <span style={{ color: "#64748b", fontSize: "14px" }}>Retrieving leave records...</span>
            </div>
          ) : errorLeaves ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>{errorLeaves}</p>
              <button
                onClick={fetchLeaves}
                style={{
                  padding: "8px 16px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Retry
              </button>
            </div>
          ) : leaves.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "#64748b", textAlign: "center" }}>
              <BiCalendar size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>No leave records found</p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                You have not applied for any leave yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxHeight: "560px",
                overflowY: "auto",
                paddingRight: "6px"
              }}
            >
              {leaves.map((leave, idx) => {
                const statusStyle = getStatusStyle(leave.status);
                return (
                  <div
                    key={leave.id || idx}
                    className="leave-history-card space-y-8"
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                    }}
                  >
                    {/* Top Row: Type & Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px", letterSpacing: "0.5px" }}>
                        {leave.leaveType} LEAVE
                      </span>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          textTransform: "uppercase"
                        }}
                      >
                        {leave.status || "PENDING"}
                      </span>
                    </div>

                    {/* Middle Row: Duration & Details */}
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

                    {/* Reason */}
                    {leave.reason && (
                      <p style={{ margin: "0", fontSize: "13px", color: "#64748b", lineHeight: "1.4", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
                        <strong>Reason:</strong> {leave.reason}
                      </p>
                    )}

                    {/* Reviewed Details */}
                    {(leave.status === "APPROVED" || leave.status === "REJECTED") && (leave.reviewedBy || leave.reviewRemark) && (
                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "10px",
                          borderTop: "1px dashed #e2e8f0",
                          fontSize: "12px",
                          color: "#475569"
                        }}
                      >
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
    </div>
  );
}
