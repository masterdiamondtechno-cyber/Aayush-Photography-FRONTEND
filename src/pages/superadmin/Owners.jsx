import { useState, useEffect, useCallback } from 'react';
import { 
  BiUser, BiSearch, BiPlus, BiEnvelope, 
  BiPhone, BiBuildings, BiDotsVerticalRounded, BiX, BiLoader, BiCheckCircle, BiErrorCircle,
  BiMap, BiLoaderAlt
} from 'react-icons/bi';
import { createFranchiseOwner, getFranchiseOwners, getAllSchoolsSuperAdmin } from '../../api/api';

const SuperAdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNo: ''
  });

  // View Branches Modal State
  const [selectedOwnerForSchools, setSelectedOwnerForSchools] = useState(null);
  const [ownerSchools, setOwnerSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolsError, setSchoolsError] = useState('');

  // View Branches Handler
  const handleViewBranches = async (owner) => {
    setSelectedOwnerForSchools(owner);
    setLoadingSchools(true);
    setSchoolsError('');
    setOwnerSchools([]);
    try {
      const res = await getAllSchoolsSuperAdmin();
      const schoolsData = Array.isArray(res) ? res : (res?.data || []);
      const filtered = schoolsData.filter(school => {
        const schoolOwnerId = school.owner?.ownerId || school.ownerId || school.owner?.id;
        return Number(schoolOwnerId) === Number(owner.ownerId || owner.id);
      });
      setOwnerSchools(filtered);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setSchoolsError('Could not retrieve branches for this franchise partner. Please try again.');
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch Owners from Backend API
  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        page: 0,
        size: 100,
        search: searchQuery,
        status: null,
        sortBy: 'name',
        sortDirection: 'asc'
      };
      const res = await getFranchiseOwners(payload);
      // Support nested paged payload structure safely
      const list = res?.content || res?.data?.content || res?.data || [];
      setOwners(list);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
      setError('Could not retrieve franchise partners from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Fetch on mount and searchQuery change
  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitError('');
  };

  // Submit New Owner to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');

    // Strict Field Validations
    if (!formData.name.trim()) {
      setSubmitError('Full name is required.');
      setSubmitLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSubmitError('Please enter a valid email address.');
      setSubmitLoading(false);
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phoneNo)) {
      setSubmitError('Phone number must be exactly 10 digits.');
      setSubmitLoading(false);
      return;
    }

    try {
      const res = await createFranchiseOwner(formData);
      const resData = res?.data ?? res;
      setSubmitSuccess(resData?.message || 'Franchise Partner registered successfully! Credentials have been sent to their email.');
      setFormData({ name: '', email: '', phoneNo: '' });
      fetchOwners(); // Automatically refresh list
      
      // Close modal on timer
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess('');
      }, 3500);
    } catch (err) {
      console.error('Failed to register owner:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to register Franchise Partner. Email or phone number might already be in use.';
      setSubmitError(errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open Modal Helper
  const openModal = () => {
    setFormData({ name: '', email: '', phoneNo: '' });
    setSubmitError('');
    setSubmitSuccess('');
    setShowModal(true);
  };

  // Derived Stats
  const totalPartners = owners.length;
  const totalSchools = owners.reduce((sum, o) => sum + (Number(o.numberOfSchoolsManaged) || 0), 0);

  return (
    <div className="min-h-full p-1 pb-8 sm:p-2 space-y-8">
      {/* Header Panel */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Lexend'] text-2xl font-extrabold text-slate-800 sm:text-4xl">Franchise Owners</h1>
          <p className="mt-2 text-sm text-slate-500">Platform &gt; Partner Management</p>
        </div>
        <button id="add-new-owner-btn" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5" onClick={openModal}>
          <BiPlus size={20} /> Add New Owner
        </button>
      </div>

      {/* Stats Board */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700">
            <BiUser size={24} color="#fff" />
          </div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Franchise Partners</p><h3 className="mt-1 text-2xl font-extrabold text-slate-800">{loading ? '...' : totalPartners}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
            <BiBuildings size={24} color="#fff" />
          </div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Schools Under Management</p><h3 className="mt-1 text-2xl font-extrabold text-slate-800">{loading ? '...' : totalSchools}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <BiCheckCircle size={24} color="#fff" />
          </div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Mode</p><h3 className="mt-1 text-2xl font-extrabold text-slate-800">Active OTP</h3>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
          <input 
            type="text" 
            placeholder="Search partners by name, email, or mobile..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 pl-11 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
          />
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
          <span>Active Accounts Only</span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Main Grid / Loader / Error handling */}
      {loading && owners.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center">
          <BiLoader size={48} className="spin" style={{ color: 'var(--primary)' }} />
          <p className="text-muted mt-1">Loading Franchise database...</p>
        </div>
      ) : error ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <BiErrorCircle size={40} color="#ef4444" />
          <p className="error-text mt-1">{error}</p>
          <button className="mt-3 rounded-xl border-2 border-indigo-600 px-4 py-2 font-bold text-indigo-600" onClick={fetchOwners}>Retry Loading</button>
        </div>
      ) : owners.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
          <BiUser size={48} className="text-muted" />
          <p className="text-muted mt-1">No franchise partners match your search criteria.</p>
          <button className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white" onClick={openModal}>Add First Partner</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {owners.map(owner => (
            <div key={owner.ownerId || owner.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white">
                  {(owner.name || 'Owner').substring(0, 2).toUpperCase()}
                </div>
                <div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span> Active
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-slate-800">{owner.name}</h3>
              <span className="mt-1 inline-block rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">Franchise Partner</span>

              <div className="mt-5 space-y-3 text-sm text-slate-500">
                <div className="flex items-center gap-2"><BiEnvelope className="text-lg text-indigo-500" /><span className="truncate" title={owner.email}>{owner.email}</span>
                </div>
                <div className="flex items-center gap-2"><BiPhone className="text-lg text-indigo-500" /><span>{owner.phoneNo || owner.phone}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-700"><BiBuildings className="text-lg text-indigo-500" /><span>{owner.numberOfSchoolsManaged ?? owner.schoolsCount ?? 0} Schools Managed</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-xs text-slate-400">ID: #{owner.ownerId || owner.id}</span>
                <button className="border-0 bg-transparent p-0 text-sm font-bold text-indigo-600" onClick={() => handleViewBranches(owner)}>View Branches &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Creation Modal Drawer */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BiUser size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Add New Owner</h3>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-slate-100 text-slate-500" onClick={() => setShowModal(false)}>
                <BiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {submitError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <BiErrorCircle size={20} />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <BiCheckCircle size={20} />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                  <BiUser className="absolute left-4 text-xl text-slate-400" />
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="Enter partner's full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 pl-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                    disabled={submitLoading || !!submitSuccess}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                  <BiEnvelope className="absolute left-4 text-xl text-slate-400" />
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="partner@school.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 pl-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                    disabled={submitLoading || !!submitSuccess}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                  <BiPhone className="absolute left-4 text-xl text-slate-400" />
                  <input 
                    type="tel" 
                    name="phoneNo"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={formData.phoneNo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, phoneNo: val }));
                    }}
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 pl-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                    disabled={submitLoading || !!submitSuccess}
                  />
                </div>
                <small className="text-xs text-slate-500">An automated credentials dispatch email will be sent upon registration.</small>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button 
                  type="button" 
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600" 
                  onClick={() => setShowModal(false)}
                  disabled={submitLoading || !!submitSuccess}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-60" 
                  disabled={submitLoading || !!submitSuccess}
                >
                  {submitLoading ? (
                    <>
                      <BiLoader size={18} className="spin" /> Registering...
                    </>
                  ) : (
                    'Create Partner Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Modal Overlay */}
      {selectedOwnerForSchools && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm" onClick={() => setSelectedOwnerForSchools(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <BiBuildings size={20} color="#fff" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-800">Managed Branches</h3>
                  <p className="text-sm text-slate-500">Partner: {selectedOwnerForSchools.name}</p>
                </div>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-slate-100 text-slate-500" onClick={() => setSelectedOwnerForSchools(null)}>
                <BiX size={24} />
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-y-auto pr-2">
              {loadingSchools ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <BiLoaderAlt className="animate-spin text-indigo-600" size={40} />
                  <p className="text-sm text-slate-500">Retrieving registered branches...</p>
                </div>
              ) : schoolsError ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <BiErrorCircle size={20} />
                  <span>{schoolsError}</span>
                </div>
              ) : ownerSchools.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <BiBuildings size={32} className="text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-800">No Branches Registered</h4>
                  <p className="mt-2 max-w-xs text-sm text-slate-500">This franchise partner does not have any active school branches registered yet.</p>
                </div>
              ) : (
                <div className="text-left">
                  <p className="mb-3 text-sm font-bold text-slate-500">{ownerSchools.length} Branch{ownerSchools.length > 1 ? 'es' : ''} Found</p>
                  <div className="flex flex-col gap-4">
                    {ownerSchools.map(school => (
                      <div key={school.schoolId || school.id} className="branch-card-item-glass" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div className="branch-card-header flex-between mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div className="branch-logo-visual flex-center" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                            {school.schoolLogo ? (
                              <img src={school.schoolLogo} alt={school.schoolName} className="branch-logo-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                            ) : (
                              (school.schoolName || 'School').substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="status-pill active" style={{ background: '#e8f5e9', color: '#1b5e20', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                            {school.subscriptionStatus || 'ACTIVE'}
                          </span>
                        </div>
                        <h4 className="branch-card-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>{school.schoolName}</h4>
                        <p className="branch-udise-code mb-1" style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>UDISE NO: {school.udiseNo || 'N/A'}</p>
                        
                        <div className="branch-details-block border-top pt-1" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="branch-detail-row flex-center gap-05" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <BiEnvelope className="row-icon" style={{ minWidth: '16px' }} />
                            <span className="row-text" title={school.email} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school.email}</span>
                          </div>
                          <div className="branch-detail-row flex-center gap-05" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <BiPhone className="row-icon" style={{ minWidth: '16px' }} />
                            <span className="row-text">{school.phoneNo || school.phone}</span>
                          </div>
                          <div className="branch-detail-row flex-center gap-05" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <BiMap className="row-icon" style={{ minWidth: '16px' }} />
                            <span className="row-text" title={[school.district, school.state].filter(Boolean).join(', ')} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {[school.district, school.state].filter(Boolean).join(', ') || 'Address not listed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
              <button 
                type="button" 
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600" 
                onClick={() => setSelectedOwnerForSchools(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOwners;
