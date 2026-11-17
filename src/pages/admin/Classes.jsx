import { useState, useEffect, useCallback } from 'react';
import { BiPlus, BiSearch, BiEditAlt, BiTrash, BiBuildings, BiUser, BiErrorCircle } from 'react-icons/bi';
import { 
  getAllClassesBySchoolId, 
  deleteClassStandard, 
  updateClassStandard, 
  getAllTeachers, 
  addStandard, 
  addClassDivision,
  updateDivision,
  deleteDivision
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const parseJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch { return null; }
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === 'undefined' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    standard: '',
    classTeacherId: ''
  });
  
  // Section creation/editing states
  const [checkedSections, setCheckedSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [isAddingSectionInput, setIsAddingSectionInput] = useState(false);
  const [customSectionInput, setCustomSectionInput] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionTeacherId, setSectionTeacherId] = useState('');

  // Derive session variables synchronously
  let schoolId = toNumber(getAuthValue('schoolId'));
  let academicYearId = toNumber(getAuthValue('academicYearId'));

  if (!schoolId || !academicYearId) {
    const payload = parseJwtPayload(localStorage.getItem('token') || sessionStorage.getItem('token'));
    if (payload) {
      if (!schoolId) schoolId = toNumber(payload.schoolId || payload.sid);
      if (!academicYearId) academicYearId = toNumber(payload.academicYearId || payload.ayi);
    }
  }
  if (!academicYearId) academicYearId = 6;

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      if (!schoolId || !academicYearId) throw new Error('Session metadata missing.');
      const response = await getAllClassesBySchoolId({ schoolId, academicYearId });
      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setClasses(response.data || []);
      } else {
        setError(response?.message || 'Failed to fetch classes.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching classes.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  const fetchTeachersCorrectly = useCallback(async () => {
    try {
      if (!schoolId || !academicYearId) return;
      const res = await getAllTeachers(schoolId, academicYearId);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setTeachers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchClasses();
    fetchTeachersCorrectly();
  }, [fetchClasses, fetchTeachersCorrectly]);

  // Handlers
  const handleEditClick = (cls) => {
    setSelectedClass(cls);
    setFormData({
      standard: cls.standard || '',
      classTeacherId: cls.classTeacherId || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (cls) => {
    setSelectedClass(cls);
    setShowDeleteModal(true);
  };

  const handleAddCustomSection = () => {
    const val = customSectionInput.trim().toUpperCase();
    if (!val) return;
    if (availableSections.includes(val)) {
      alert('Section already exists!');
      return;
    }
    setAvailableSections([...availableSections, val]);
    setCheckedSections([...checkedSections, val]);
    setIsAddingSectionInput(false);
    setCustomSectionInput('');
  };

  const handleRemoveAvailableSection = (s) => {
    setAvailableSections(availableSections.filter(x => x !== s));
    setCheckedSections(checkedSections.filter(x => x !== s));
  };

  const handleCreateClick = () => {
    setSelectedClass(null);
    setFormData({ standard: '', classTeacherId: '' });
    setAvailableSections([]);
    setCheckedSections([]);
    setIsAddingSectionInput(false);
    setCustomSectionInput('');
    setIsEditing(false);
    setShowModal(true);
  };

  const handleAddSectionClick = (cls) => {
    setSelectedClass(cls);
    setSelectedSection(null);
    setNewSectionName('');
    setSectionTeacherId('');
    setIsEditingSection(false);
    setShowSectionModal(true);
  };

  const handleEditSectionClick = (cls, sec) => {
    setSelectedClass(cls);
    setSelectedSection(sec);
    setNewSectionName(sec.divisionName || '');
    setSectionTeacherId(sec.classTeacherId || '');
    setIsEditingSection(true);
    setShowSectionModal(true);
  };

  // Submit Handler for standard creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        schoolId,
        academicYearId,
        standard: formData.standard,
        classTeacherId: formData.classTeacherId ? Number(formData.classTeacherId) : null
      };

      console.log('Create Class Standard Payload:', payload);
      const res = await addStandard(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        const listRes = await getAllClassesBySchoolId({ schoolId, academicYearId });
        if (listRes?.status === 'SUCCESS' || listRes?.code === 200) {
          const freshList = listRes.data || [];
          // Use robust case-insensitive trimmed matching
          const newlyCreatedStandard = freshList.find(c => {
            if (!c || !c.standard) return false;
            const s1 = String(c.standard).trim().toLowerCase();
            const s2 = String(formData.standard).trim().toLowerCase();
            return s1 === s2;
          });
          
          if (newlyCreatedStandard) {
            if (checkedSections.length > 0) {
              const standardId = newlyCreatedStandard.standardId || newlyCreatedStandard.id;
              console.log('Found newly created standard:', newlyCreatedStandard, 'Adding sections:', checkedSections);
              
              const divisionPromises = checkedSections.map(secName => {
                return addClassDivision({
                  schoolId,
                  academicYearId,
                  standardId,
                  divisionName: secName.trim().toUpperCase(),
                  classTeacherId: null
                });
              });

              await Promise.all(divisionPromises);
              console.log('All custom sections saved successfully.');
            }
          } else {
            console.error('Newly created standard not found in list matching:', formData.standard, freshList);
            throw new Error(`The standard "${formData.standard}" was created but could not be found to allot sections automatically. Please add sections manually.`);
          }
        }

        setShowModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Create standard failed');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.message || 'Error creating class and divisions');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Handler for standard update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        standardId: selectedClass.standardId || selectedClass.id, 
        schoolId,
        academicYearId,
        standard: formData.standard,
        classTeacherId: formData.classTeacherId ? Number(formData.classTeacherId) : null
      };
      console.log('Update Payload:', payload);
      const res = await updateClassStandard(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Update failed');
      }
    } catch (error) {
      alert('Error updating class');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Handler for division section creation
  const handleCreateSectionSubmit = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      alert('Section name is required.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        schoolId,
        academicYearId,
        standardId: selectedClass.standardId || selectedClass.id,
        divisionName: newSectionName.trim().toUpperCase(),
        classTeacherId: sectionTeacherId ? Number(sectionTeacherId) : null
      };
      console.log('Create Section Payload:', payload);
      const res = await addClassDivision(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowSectionModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Failed to add section');
      }
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Error adding new section division');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Handler for division section update
  const handleUpdateSectionSubmit = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      alert('Section name is required.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        divisionId: selectedSection.divisionId,
        schoolId,
        academicYearId,
        divisionName: newSectionName.trim().toUpperCase(),
        classTeacherId: sectionTeacherId ? Number(sectionTeacherId) : null
      };
      console.log('Update Section Payload:', payload);
      const res = await updateDivision(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowSectionModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Failed to update section');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Error updating section division');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for division section deletion
  const handleDeleteSection = async () => {
    if (!selectedSection) return;
    const confirmMessage = `Are you sure you want to delete Section "${selectedSection.divisionName}" from ${selectedClass.standard}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const payload = {
        schoolId,
        divisionId: selectedSection.divisionId
      };
      console.log('Delete Section Payload:', payload);
      const res = await deleteDivision(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowSectionModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Error deleting section division');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      const res = await deleteClassStandard({ schoolId, standardId: selectedClass.standardId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowDeleteModal(false);
        fetchClasses();
      } else {
        alert(res?.message || 'Delete failed');
      }
    } catch (error) {
      alert('Error deleting class');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => {
    const searchLow = searchTerm.toLowerCase();
    const stName = cls.standard ? cls.standard.toLowerCase() : '';
    const matchesSections = cls.sections && cls.sections.some(sec => 
      sec.divisionName.toLowerCase().includes(searchLow) ||
      (sec.classTeacherName && sec.classTeacherName.toLowerCase().includes(searchLow))
    );
    return stName.includes(searchLow) || matchesSections;
  });

  return (
    <div className="classes-page space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#FFC629]">
            Class & Section
          </h1>
          <p className="text-sm text-[#F5E6BE] font-medium">Academic &gt; Classes</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-[#3A3A3A] bg-[#101010] px-4 py-2.5 shadow-sm">
            <BiSearch className="shrink-0 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search standard or teacher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full min-w-[200px] border-none bg-transparent text-sm text-white outline-none placeholder:text-[#888888]"
            />
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] px-6 py-3 text-sm font-extrabold text-black shadow-lg shadow-[#FFC629]/25 transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
            onClick={handleCreateClick}
          >
            <BiPlus size={18} /> Create New Class
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#F5E6BE] animate-pulse">
          Gathering Class Matrix...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-red-600">
          <BiErrorCircle size={20} /> Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[#2A2A2A] bg-[#181818] px-6 py-12 text-center text-[#F5E6BE]">
              No classes found matching criteria.
            </div>
          ) : filteredClasses.map(cls => (
            <div
              key={cls.standardId}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#141414] shadow-lg transition hover:border-[#FFC629] hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
                    <BiBuildings size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-[#FFC629]">{cls.standard}</h3>
                    <p className="text-sm text-[#F5E6BE]">
                      {cls.sections ? cls.sections.length : 0} Sections
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-white text-[#F5E6BE] transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Edit Standard"
                    onClick={() => handleEditClick(cls)}
                  >
                    <BiEditAlt size={16} />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-white text-[#F5E6BE] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    title="Delete Standard"
                    onClick={() => handleDeleteClick(cls)}
                  >
                    <BiTrash size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sections & Teachers
                  </p>
                  <span className="hidden text-xs font-medium text-indigo-500 sm:inline">
                    Click to edit
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {cls.sections && cls.sections.length > 0 ? (
                    cls.sections.map(sec => (
                      <div
                        key={sec.divisionId || sec.divisionName}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#181818] px-3.5 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                        onClick={() => handleEditSectionClick(cls, sec)}
                        title="Click to edit section name or change Class Teacher"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                            {sec.divisionName}
                          </span>
                          <div className="flex min-w-0 items-center gap-1.5 text-sm text-[#F5E6BE]">
                            <BiUser size={14} className="shrink-0 text-indigo-500" />
                            <span className={`truncate font-medium ${sec.classTeacherName ? 'text-[#F5E6BE]' : 'text-slate-400'}`}>
                              {sec.classTeacherName || 'No Teacher'}
                            </span>
                          </div>
                        </div>
                        <BiEditAlt className="shrink-0 text-slate-300" size={16} />
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#2A2A2A] px-3 py-4 text-center text-xs italic text-slate-400">
                      No sections configured yet
                    </p>
                  )}
                </div>

                <button
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-[#181818] py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-50"
                  onClick={() => handleAddSectionClick(cls)}
                >
                  <BiPlus size={18} /> Add Division / Section
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay-premium class-form-overlay">
          <div className="modal-content-premium class-form-modal">
            <div className="modal-header-gradient ">
              <h2 className="class-modal-title" style={{ margin: 12,padding: 5,  fontWeight: 700 }}>{isEditing ? 'Edit Class' : 'Create New Class'}</h2>
              <p style={{ margin: 10, opacity: 0.9,   padding: 5 }}>Configure standard metadata</p>
            </div>
            <form className="grid gap-5 p-5 class-modal-form" onSubmit={isEditing ? handleUpdateSubmit : handleCreateSubmit}>
              <div className="form-group !mb-0">
                <label className="font-bold text-sm ">Class Name</label>
                <input type="text" className="form-control premium-input" placeholder="e.g. 10th Standard"
                  value={formData.standard} onChange={e => setFormData({ ...formData, standard: e.target.value })} required />
              </div>
              
              {!isEditing && (
                <div className="form-group !mb-0">
                  <label className="font-bold text-sm">Sections/Batch</label>
                  
                  {availableSections.length > 0 ? (
                    <div className="mt-3 mb-4 flex flex-wrap items-center justify-start gap-3">
                      {availableSections.map(s => (
                        <div key={s} className="section-checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            id={`sec-${s}`} 
                            checked={checkedSections.includes(s)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedSections([...checkedSections, s]);
                              } else {
                                setCheckedSections(checkedSections.filter(x => x !== s));
                              }
                            }}
                          />
                          <label htmlFor={`sec-${s}`} className="section-checkbox-label" style={{ padding: '0.6rem 2.5rem 0.6rem 1.5rem', fontSize: '0.95rem', minHeight: '42px', position: 'relative' }}>
                            {s}
                            <span 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveAvailableSection(s);
                              }}
                              style={{
                                position: 'absolute',
                                right: '0.6rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: checkedSections.includes(s) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0,0,0,0.06)',
                                color: checkedSections.includes(s) ? '#fff' : '#64748b',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              title="Remove section"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = checkedSections.includes(s) ? 'rgba(255, 255, 255, 0.4)' : 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.color = checkedSections.includes(s) ? '#fff' : '#ef4444';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = checkedSections.includes(s) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0,0,0,0.06)';
                                e.currentTarget.style.color = checkedSections.includes(s) ? '#fff' : '#64748b';
                              }}
                            >
                              ✕
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                      No sections or batches configured yet.
                    </div>
                  )}

                  <div className="custom-section-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Create & Add Custom Division</p>
                    <div className="flex-center gap-0-5 custom-section-entry-row" style={{ width: '100%' }}>
                      <input
                        className="custom-section-input"
                        type="text"
                        placeholder="e.g. A, B, C, D or Alpha"
                        maxLength={15}
                        value={customSectionInput}
                        onChange={e => setCustomSectionInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSection();
                          }
                        }}
                        style={{
                          flex: 1,
                          height: '46px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          padding: '0 1rem',
                          outline: 'none',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: '#1e293b',
                          transition: 'all 0.2s ease',
                          background: '#f8fafc'
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        className="custom-section-add-button"
                        type="button"
                        onClick={handleAddCustomSection}
                        style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.75rem',
                          padding: '0 1.5rem',
                          height: '46px',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(99, 102, 241, 0.2)';
                        }}
                      >
                        <BiPlus size={18} /> Add
                      </button>
                    </div>
                    <p className="text-muted text-xs" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                      💡 Tip: Type a name and click <b>Add</b> or press <b>Enter</b> to instantly check-allot it.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 class-modal-actions">
                <button type="button" className="btn btn-outline-premium" onClick={() => setShowModal(false)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary-gradient" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="modal-overlay-premium">
          <div className="modal-content-premium">
            <div className="modal-header-gradient">
              <h2 style={{ margin: 0, fontWeight: 700 }}>{isEditingSection ? 'Edit Section' : 'Add Section'}</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {isEditingSection ? `Modify settings for Section ${selectedSection?.divisionName}` : `Add a new section to ${selectedClass?.standard}`}
              </p>
            </div>
            <form className="grid gap-5 p-6" onSubmit={isEditingSection ? handleUpdateSectionSubmit : handleCreateSectionSubmit}>
              <div className="form-group !mb-0">
                <label className="font-bold text-sm">Section Name / Division</label>
                <input 
                  type="text" 
                  className="form-control premium-input" 
                  placeholder="e.g. D"
                  value={newSectionName} 
                  onChange={e => setNewSectionName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="font-bold text-sm">Allot Class Teacher</label>
                <select 
                  className="form-control premium-input"
                  value={sectionTeacherId || ''} 
                  onChange={e => setSectionTeacherId(e.target.value)}
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map(t => (
                    <option key={t.teacherId || t.id} value={t.teacherId || t.id}>
                      {t.teacherName || `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Teacher ${t.teacherId || t.id}`}
                    </option>
                  ))}
                </select>
                <p className="text-muted text-xs" style={{ marginTop: '0.4rem' }}>
                  💡 Assigning a teacher gives them management privileges over this specific division.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div>
                  {isEditingSection && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      onClick={handleDeleteSection}
                      disabled={actionLoading}
                    >
                      <BiTrash size={16} /> Delete Section
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="btn btn-outline-premium" onClick={() => setShowSectionModal(false)} disabled={actionLoading}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : isEditingSection ? 'Save Changes' : 'Add Section'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay-premium">
          <div className="modal-content-premium" style={{ maxWidth: '400px' }}>
            <div className="padding-1-5" style={{ textAlign: 'center' }}>
              <div className="flex-center mb-1" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', margin: '0 auto 1rem' }}>
                <BiErrorCircle size={32} color="#ef4444" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Confirm Deletion</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to delete <b>{selectedClass?.standard}</b>? This action cannot be undone and will delete all sections within it.
              </p>
              <div className="flex-center gap-1">
                <button type="button" className="btn btn-outline-premium" onClick={() => setShowDeleteModal(false)} disabled={actionLoading} style={{ flex: 1 }}>Cancel</button>
                <button type="button" className="btn" onClick={handleConfirmDelete} disabled={actionLoading}
                  style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .classes-page { animation: fadeIn 0.5s ease; }
        .w-100 { width: 100%; }
        .gap-0-5 { gap: 0.5rem; }
        .animate-pulse { animation: pulse 2s infinite; }
        
        /* Premium Card Styles */
        .class-card-premium { 
          background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 1.25rem;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -2px rgba(148, 163, 184, 0.08);
        }
        .class-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 30px -10px rgba(99, 102, 241, 0.12), 0 10px 15px -5px rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
        }
        
        .class-card-header {
          padding: 1.25rem;
          background: linear-gradient(to right, rgba(248, 250, 252, 0.6) 0%, transparent 100%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }
        
        .icon-box-premium { 
          width: 46px; height: 46px; 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
          background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
        }
        
        /* Section Items */
        .section-item-premium {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .section-item-premium:hover {
          background: #f8fafc;
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.04);
        }
        .section-item-premium:hover .edit-indicator {
          color: var(--primary) !important;
          transform: scale(1.1);
        }
        .edit-indicator {
          transition: all 0.2s ease;
        }

        .section-pill-premium { 
          background: #eef2ff; 
          color: var(--primary); 
          padding: 0.25rem 0.75rem; 
          border-radius: 0.5rem; 
          font-weight: 800; 
          font-size: 0.85rem; 
          border: 1px solid rgba(199, 210, 254, 0.4);
        }
        
        .btn-icon-premium {
          background: transparent; border: none; padding: 0.5rem; border-radius: 50%;
          cursor: pointer; color: #64748b; transition: all 0.2s ease; font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-icon-premium.hover-primary:hover { background: #e0e7ff; color: var(--primary); }
        .btn-icon-premium.hover-danger:hover { background: #fee2e2; color: #ef4444; }

        /* Premium Modal Styles */
        .modal-overlay-premium { 
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; 
          z-index: 1000; animation: fadeIn 0.2s ease-out;
          padding: 1.5rem;
          box-sizing: border-box;
        }
        
        .modal-content-premium { 
          width: 100%; max-width: 480px; 
          max-height: calc(100vh - 3rem);
          background: #f8fafc; 
          border-radius: 1.5rem; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.8);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .class-form-modal {
          max-height: min(90dvh, 800px);
        }

        .class-modal-title {
          max-width: 100%;
          overflow-wrap: anywhere;
          line-height: 1.25;
        }

        .class-modal-form,
        .custom-section-entry-row {
          min-width: 0;
        }

        .custom-section-input {
          min-width: 0;
        }

        .modal-content-premium form,
        .modal-content-premium .padding-1-5 {
          flex: 1;
          overflow-y: auto;
        }

        .modal-content-premium form::-webkit-scrollbar,
        .modal-content-premium .padding-1-5::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content-premium form::-webkit-scrollbar-track,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb:hover,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .modal-header-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
          color: white; padding: 1.75rem 1.5rem;
          position: relative;
        }

        @media (max-width: 640px) {
          .class-form-overlay {
            align-items: flex-start;
            overflow-y: auto;
            padding: max(0.75rem, env(safe-area-inset-top)) 0.75rem max(0.75rem, env(safe-area-inset-bottom));
          }

          .class-form-modal {
            width: 100%;
            max-height: calc(100dvh - 1.5rem);
            border-radius: 1rem;
          }

          .class-form-modal .modal-header-gradient {
            padding: 1.25rem 1rem;
          }

          .class-form-modal .class-modal-form {
            gap: 1rem;
            padding: 1rem;
          }

          .class-form-modal .custom-section-card {
            padding: 1rem !important;
          }
        }

        @media (max-width: 420px) {
          .class-form-modal .custom-section-entry-row {
            align-items: stretch;
            flex-direction: column;
          }

          .class-form-modal .custom-section-add-button {
            justify-content: center;
            width: 100%;
          }

          .class-form-modal .class-modal-actions {
            flex-direction: column-reverse;
          }

          .class-form-modal .class-modal-actions button {
            width: 100%;
          }
        }
        
        .padding-1-5 { padding: 1.5rem; }
        
        .premium-input {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.85rem 1.1rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1e293b;
          min-height: 48px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.01);
        }
        .premium-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
          background: #ffffff;
          outline: none;
        }
        
        .section-checkbox-wrapper {
          position: relative;
          display: inline-block;
        }
        .section-checkbox-wrapper input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          cursor: pointer;
        }
        .section-checkbox-label {
          background: #ffffff;
          border: 2px solid #cbd5e1;
          color: #64748b;
          border-radius: 0.75rem;
          padding: 0.5rem 1.25rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .section-checkbox-wrapper input[type="checkbox"]:checked ~ .section-checkbox-label {
          background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        
        .btn-primary-gradient { 
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%); 
          border: none; color: white; padding: 0.75rem 1.75rem;
          border-radius: 0.75rem; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.25); transition: all 0.3s ease; 
        }
        .btn-primary-gradient:hover { 
          transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35); 
        }
        
        .btn-outline-premium {
          background: #ffffff; border: 1px solid #cbd5e1;
          color: #475569; padding: 0.75rem 1.5rem; border-radius: 0.75rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-outline-premium:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default Classes;
