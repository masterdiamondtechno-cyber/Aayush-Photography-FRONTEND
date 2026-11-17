import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BiSearch,
  BiFilter,
  BiDotsVerticalRounded,
  BiCheckCircle,
  BiXCircle,
  BiLoaderAlt,
  BiErrorCircle,
} from "react-icons/bi";

import DataTable from "../../components/common/DataTable";
import { 
  getAllSchoolsSuperAdmin, 
  getSchoolById,
  updateSchoolStatusSuperAdmin
} from "../../api/api";

const AyushyachiInstitutes = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // SEARCH STATE
  const [searchFilter, setSearchFilter] = useState("");

  // FILTER STATE
  const [statusFilter, setStatusFilter] = useState("");

  // MODAL STATES
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // TOAST NOTIFICATION STATE
  const [toast, setToast] = useState(null);
  const [confirmToggleModal, setConfirmToggleModal] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  // FETCH ALL SCHOOLS
  const fetchSchools = async () => {
    try {
      setLoading(true);

      const res = await getAllSchoolsSuperAdmin();

      const schoolsData = Array.isArray(res) ? res : res?.data || [];

      const mapped = schoolsData.map((school) => ({
        id: school.schoolId || school.id,
        name: school.schoolName || school.name,
        city: school.district || school.city || "N/A",
        ownerName: school.owner
          ? `${school.owner.firstName || ""} ${
              school.owner.lastName || ""
            }`.trim() || "Not Assigned"
          : school.ownerName || "Not Assigned",

        students: school.students || 0,

        status: school.schoolStatus || school.status || "INACTIVE",

        raw: school,
      }));

      setSchools(mapped);
    } catch (err) {
      console.error("Failed to fetch schools:", err);

      // FALLBACK MOCK DATA
      setSchools([
        {
          id: 1,
          name: "St. Xavier Academy",
          city: "Mumbai",
          ownerName: "Aman Verma",
          students: 450,
          status: "ACTIVE",
        },
        {
          id: 2,
          name: "Delhi Public School",
          city: "Delhi",
          ownerName: "Sanjay Gupta",
          students: 1200,
          status: "ACTIVE",
        },
        {
          id: 3,
          name: "Royal International",
          city: "Pune",
          ownerName: "Neha Sharma",
          students: 300,
          status: "INACTIVE",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // TOGGLE SCHOOL STATUS
  const handleToggleStatus = (schoolId, currentStatus, schoolName) => {
    setConfirmToggleModal({ schoolId, currentStatus, schoolName });
  };

  const executeToggleStatus = async () => {
    if (!confirmToggleModal) return;
    const { schoolId, currentStatus, schoolName } = confirmToggleModal;
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    
    setConfirmToggleModal(null); // Close modal

    try {
      setLoading(true);
      const res = await updateSchoolStatusSuperAdmin({
        schoolId,
        status: nextStatus,
      });

      if (res?.status === "SUCCESS" || res?.data?.status === "SUCCESS" || res?.code === 200 || res?.data?.code === 200) {
        showToast(`School status updated successfully to ${nextStatus}.`, "success");
        fetchSchools();
      } else {
        showToast(res?.message || res?.data?.message || "Failed to update school status", "error");
      }
    } catch (err) {
      console.error("Failed to toggle school status:", err);
      showToast("An error occurred while updating school status.", "error");
    } finally {
      setLoading(false);
    }
  };

  // OPEN SCHOOL DETAILS
  const handleOpenDetails = async (schoolId) => {
    try {
      setModalLoading(true);

      const res = await getSchoolById(schoolId);

      const school = res?.data || res;

      setSelectedSchool(school);
    } catch (err) {
      console.error("Failed to fetch school details:", err);

      showToast("Could not load school details", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // SEARCH FILTER
const filteredSchools = schools.filter((school) => {

  const matchesSearch =
    school.name
      .toLowerCase()
      .includes(searchFilter.toLowerCase());

  const matchesStatus =
    statusFilter === ""
      ? true
      : school.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  

  return (
    <div className="min-h-full p-1 pb-8 sm:p-2 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed right-4 top-4 z-[1100] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === "success" ? <BiCheckCircle size={20} /> : <BiErrorCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Cinzel'] text-2xl font-extrabold text-[#FFC629] sm:text-4xl tracking-wide">Institution Directory</h1>

          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#F5E6BE] sm:text-sm">
            Schools &gt; All Branches
          </p>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-5 shadow-lg sm:p-8">
        {/* SEARCH SECTION */}
        <div className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

            <input
              type="text"
              placeholder="Search school name..."
              className="h-12 w-full rounded-xl border border-[#3A3A3A] bg-[#101010] px-4 pl-11 text-sm text-white placeholder:text-[#888888] outline-none transition focus:border-[#FFC629] focus:ring-2 focus:ring-[#FFC629]/20"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />

            </div>
            <div className="relative sm:w-56">
              <BiFilter className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg text-slate-400" />

              <select
                className="h-12 w-full appearance-none rounded-xl border border-[#3A3A3A] bg-[#101010] px-4 pl-11 pr-10 text-sm font-bold text-[#FFC629] outline-none transition focus:border-[#FFC629] focus:ring-2 focus:ring-[#FFC629]/20 cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Filter</option>

                <option value="ACTIVE">Active Schools</option>

                <option value="INACTIVE">Inactive Schools</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A]">
          <DataTable
            headers={[
              "School Name",
              "Location",
              "Owner",
              "Total Students",
              "Status",
              "Actions",
            ]}
            data={filteredSchools}
            renderRow={(school) => (
              <tr key={school.id} className="transition hover:bg-[#1A1A1A]">
                <td className="px-4 py-4">
                  <strong
                    className="cursor-pointer font-bold text-white transition hover:text-[#FFC629]"
                    onClick={() => handleOpenDetails(school.id)}
                  >
                    {school.name}
                  </strong>
                </td>

                <td className="px-4 py-4">{school.city}</td>

                <td className="px-4 py-4">{school.ownerName}</td>

                <td className="px-4 py-4">{school.students}</td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 ${school.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(school.id, school.status, school.name);
                    }}
                    title="Click to toggle status"
                  >
                    {school.status === "ACTIVE" ? (
                      <BiCheckCircle />
                    ) : (
                      <BiXCircle />
                    )}

                    {school.status}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="relative">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-xl text-[#F5E6BE] transition hover:bg-indigo-50 hover:text-indigo-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === school.id ? null : school.id);
                      }}
                    >
                      <BiDotsVerticalRounded />
                    </button>
                    {activeDropdownId === school.id && (
                      <div className="absolute right-0 top-10 z-20 min-w-44 overflow-hidden rounded-xl border border-[#2A2A2A] bg-white py-1 shadow-xl">
                        <button 
                          className="block w-full border-0 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(school.id);
                            setActiveDropdownId(null);
                          }}
                        >
                          View Details
                        </button>
                        <button 
                          className="block w-full border-0 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/superadmin/schools/assign-subscription', { state: { schoolId: school.id } });
                            setActiveDropdownId(null);
                          }}
                        >
                          Assign Subscription
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* MODAL */}
      {selectedSchool && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSchool(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#141414] border border-[#2A2A2A] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-r from-[#1C1917] via-[#2A200B] to-[#141414] border-b border-[#2A2A2A]">
              <div className="flex h-20 w-20 translate-y-8 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-extrabold text-indigo-600 shadow-lg">
                {selectedSchool.schoolLogo ? (
                  <img src={selectedSchool.schoolLogo} alt="Logo" />
                ) : (
                  selectedSchool.schoolName?.substring(0, 2).toUpperCase()
                )}
              </div>

              <button
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/20 text-2xl text-white"
                onClick={() => setSelectedSchool(null)}
              >
                &times;
              </button>
            </div>

            <div className="p-6 pt-14 sm:p-8 sm:pt-16">
              <h2 className="text-center font-['Lexend'] text-2xl font-extrabold text-[#FFC629]">{selectedSchool.schoolName}</h2>
              <p className="mb-8 mt-2 text-center text-sm text-[#F5E6BE]">UDISE NO: {selectedSchool.udiseNo || 'N/A'}</p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Institutional Email</span>
                  <span className="font-bold text-white">{selectedSchool.email || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Phone Number</span>
                  <span className="font-bold text-white">{selectedSchool.phoneNo || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Location (State & District)</span>
                  <span className="font-bold text-white">{[selectedSchool.district, selectedSchool.state].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Taluka & Pincode</span>
                  <span className="font-bold text-white">{[selectedSchool.taluka, selectedSchool.pincode].filter(Boolean).join(' - ') || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Complete Address</span>
                  <span className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-3 text-sm leading-6 text-[#F5E6BE]">{selectedSchool.schoolAddress || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">School Status</span>
                  <span className="font-bold text-white">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${selectedSchool.schoolStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {selectedSchool.schoolStatus || 'INACTIVE'}
                    </span>
                  </span>
                </div>
              </div>

              {/* SUBSCRIPTION INFORMATION */}
              <div className="mt-6 rounded-2xl border border-[#2A2A2A] bg-[#181818] p-5">
                <h3 className="mb-4 border-b-2 border-[#2A2A2A] pb-2 font-['Lexend'] text-lg font-extrabold text-[#FFC629]">Subscription Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Plan Name:</span>
                    <span className="font-bold text-white">
                      {selectedSchool.subscriptionPlan?.planName || selectedSchool.subscriptionStatus || 'Standard Plan'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Source:</span>
                    <span className="w-fit rounded-md bg-sky-100 px-2.5 py-1 text-xs font-extrabold uppercase text-sky-700">
                      {selectedSchool.subscriptionSource || 'TRIAL'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Status:</span>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${selectedSchool.isSubscriptionExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selectedSchool.isSubscriptionExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F5E6BE]">Expiry Date:</span>
                    <span className="font-bold text-white">
                      {formatDate(selectedSchool.subscriptionSource === 'MANUAL' || selectedSchool.subscriptionSource === 'PURCHASED'
                        ? selectedSchool.subscriptionEndDate
                        : selectedSchool.trialEndDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <button 
                    className="w-full rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/20"
                    onClick={() => {
                      navigate('/superadmin/schools/assign-subscription', { state: { schoolId: selectedSchool.schoolId || selectedSchool.id } });
                    }}
                  >
                    Assign Subscription
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE MODAL */}
      {confirmToggleModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setConfirmToggleModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '450px', padding: '24px', borderRadius: '16px' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Confirm Status Update</h3>
              <button
                className="border-0 bg-transparent text-2xl text-[#F5E6BE]"
                onClick={() => setConfirmToggleModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            
            <div className="mb-6">
              <p className="leading-6 text-slate-600">
                Are you sure you want to change the status of <strong>"{confirmToggleModal.schoolName}"</strong> to <strong className={confirmToggleModal.currentStatus === "ACTIVE" ? 'text-red-600' : 'text-emerald-600'}>{confirmToggleModal.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"}</strong>?
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmToggleModal(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={executeToggleStatus}
                className={`rounded-xl px-5 py-2.5 font-semibold text-white ${confirmToggleModal.currentStatus === "ACTIVE" ? 'bg-red-600' : 'bg-emerald-600'}`}
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {modalLoading && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <BiLoaderAlt className="animate-spin text-white" size={50} />
        </div>
      )}
    </div>
  );
};

export default AyushyachiInstitutes;
