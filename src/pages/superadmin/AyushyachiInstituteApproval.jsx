import { useState, useEffect } from 'react';
import { 
  BiCheck, BiX, BiMap, BiUser, 
  BiCalendar, BiLoaderAlt, BiBuilding
} from 'react-icons/bi';
import { getPendingSchools, approveSchool, getSchoolById } from '../../api/api';

/**
 * SuperAdmin — Institute Approval Page
 * Luxury Dark Gold Theme for Ayushyachi Photography
 */
const AyushyachiInstituteApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Modal states
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getPendingSchools();
      
      const schoolsData = Array.isArray(res) ? res : (res?.data || []);
      
      if (schoolsData && schoolsData.length > 0) {
        const mappedRequests = schoolsData.map(school => ({
          id: school.schoolId || school.id,
          name: school.schoolName || school.name,
          location: [school.district, school.state].filter(Boolean).join(', ') || school.schoolAddress || 'Location Details Pending',
          date: new Date(school.createdAt || Date.now()).toLocaleDateString(),
          applicant: school.email || 'Admin User',
          logo: school.schoolLogo || null,
          raw: school 
        }));
        setRequests(mappedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch school requests:', error);
      setRequests([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (schoolId) => {
    try {
      setModalLoading(true);
      const res = await getSchoolById(schoolId);
      const school = res?.data || res;
      setSelectedSchool(school);
    } catch (err) {
      console.error("Failed to fetch school details:", err);
      alert("Could not load school details. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAction = async (requestId, status) => {
    try {
      setActionLoading(requestId);
      await approveSchool({ 
        schoolId: requestId, 
        status: status === 'approve' ? 'APPROVED' : 'REJECTED'
      });
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setSelectedSchool(null);
      alert(`Institute ${status === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
    } catch (error) {
      console.error(`Failed to ${status} school:`, error);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-4xl font-extrabold text-[#FFC629] tracking-wide">
            Registration Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#F5E6BE] mt-1 font-medium">Institutes &gt; Pending Approvals</p>
        </div>
        <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30">
          {requests.length} Pending
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <BiLoaderAlt className="animate-spin text-[#FFC629]" size={40} />
          <p className="text-sm text-[#FFC629]">Fetching registration requests...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.length > 0 ? requests.map((req) => (
            <div
              key={req.id}
              className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden hover:border-[#FFC629]/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Header */}
                <div
                  className="h-28 bg-gradient-to-r from-[#1C1917] via-[#2A200B] to-[#141414] border-b border-[#262626] flex items-center justify-center relative cursor-pointer"
                  onClick={() => handleOpenDetails(req.id)}
                >
                  <div className="w-18 h-18 bg-[#141414] border-2 border-[#FFC629]/40 rounded-2xl flex items-center justify-center text-xl font-extrabold text-[#FFC629] shadow-lg translate-y-6 overflow-hidden">
                    {req.logo ? <img src={req.logo} alt="Logo" className="w-full h-full object-cover" /> : req.name?.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                
                {/* Body Content */}
                <div className="p-6 pt-10 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-xl font-extrabold text-[#FFC629] truncate cursor-pointer hover:underline transition"
                        onClick={() => handleOpenDetails(req.id)}
                      >
                        {req.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#F5E6BE] mt-1.5 font-medium truncate">
                        <BiMap className="shrink-0 text-[#FFC629]" />
                        <span className="truncate">{req.location}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#FFC629] flex items-center gap-1 shrink-0">
                      <BiCalendar /> {req.date}
                    </div>
                  </div>

                  <div
                    className="p-3 bg-[#1A1A1A] border border-[#262626] rounded-xl cursor-pointer hover:bg-[#222222] transition"
                    onClick={() => handleOpenDetails(req.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FFC629]/15 border border-[#FFC629]/30 text-[#FFC629] flex items-center justify-center shrink-0">
                        <BiUser />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase text-[#FFC629] font-extrabold">Applicant</p>
                        <p className="font-bold text-xs text-white truncate">{req.applicant}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                <button 
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition cursor-pointer disabled:opacity-50" 
                  onClick={() => handleAction(req.id, 'reject')}
                  disabled={actionLoading === req.id}
                >
                  <BiX className="text-base" /> Reject
                </button>
                <button 
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-md shadow-[#FFC629]/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50" 
                  onClick={() => handleAction(req.id, 'approve')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? <BiLoaderAlt className="animate-spin" /> : <BiCheck className="text-base" />} Approve
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-[#141414] border border-[#262626] rounded-3xl p-12 text-center text-[#FFC629] space-y-3">
              <BiBuilding size={60} className="mx-auto text-[#FFC629]/40 mb-2" />
              <h2 className="text-xl font-bold text-white">No Pending Requests</h2>
              <p className="text-sm max-w-md mx-auto">All institute registration requests have been reviewed and processed.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setSelectedSchool(null)}>
          <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-[620px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-28 bg-gradient-to-r from-[#1C1917] via-[#2A200B] to-[#141414] border-b border-[#262626] flex items-center justify-center">
              <div className="w-20 h-20 bg-[#141414] border-2 border-[#FFC629]/40 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-[#FFC629] shadow-xl translate-y-6 overflow-hidden">
                {selectedSchool.schoolLogo ? (
                  <img src={selectedSchool.schoolLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  selectedSchool.schoolName?.substring(0, 2).toUpperCase()
                )}
              </div>
              <button
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333333] text-[#A0A0A0] hover:text-white flex items-center justify-center text-xl transition-colors cursor-pointer"
                onClick={() => setSelectedSchool(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 pt-10 sm:p-8 sm:pt-12">
              <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-[#FFC629] text-center mb-1">
                {selectedSchool.schoolName}
              </h2>
              <p className="text-center text-xs text-[#FFC629] mb-6">UDISE NO: {selectedSchool.udiseNo || 'N/A'}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Institutional Email</span>
                  <span className="font-semibold text-xs text-white truncate block">{selectedSchool.email || 'N/A'}</span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Phone Number</span>
                  <span className="font-semibold text-xs text-white">{selectedSchool.phoneNo || 'N/A'}</span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Location</span>
                  <span className="font-semibold text-xs text-white">{[selectedSchool.district, selectedSchool.state].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Taluka & Pincode</span>
                  <span className="font-semibold text-xs text-white">{[selectedSchool.taluka, selectedSchool.pincode].filter(Boolean).join(' - ') || 'N/A'}</span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Complete Address</span>
                  <span className="text-xs text-[#F5E6BE] leading-relaxed">{selectedSchool.schoolAddress || 'N/A'}</span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Subscription</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {selectedSchool.subscriptionStatus || 'ACTIVE'}
                  </span>
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FFC629] tracking-wider block mb-1">Status</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30">
                    {selectedSchool.schoolStatus || 'PENDING'}
                  </span>
                </div>
              </div>

              {selectedSchool.schoolStatus === 'INACTIVE' && (
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-[#262626]">
                  <button 
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition cursor-pointer" 
                    onClick={() => handleAction(selectedSchool.schoolId, 'reject')}
                    disabled={actionLoading === selectedSchool.schoolId}
                  >
                    <BiX className="text-base" /> Reject Registration
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-md shadow-[#FFC629]/20 transition cursor-pointer" 
                    onClick={() => handleAction(selectedSchool.schoolId, 'approve')}
                    disabled={actionLoading === selectedSchool.schoolId}
                  >
                    {actionLoading === selectedSchool.schoolId ? <BiLoaderAlt className="animate-spin" /> : <BiCheck className="text-base" />} Approve Institution
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Loading */}
      {modalLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <BiLoaderAlt className="animate-spin text-[#FFC629]" size={50} />
        </div>
      )}
    </div>
  );
};

export default AyushyachiInstituteApproval;
