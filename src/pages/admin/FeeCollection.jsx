import { useState, useEffect, useCallback } from 'react';
import { BiWallet, BiPlus, BiSearch, BiEditAlt, BiTrash, BiDownload, BiCheck, BiTimeFive, BiXCircle, BiLoader, BiPrinter, BiReceipt } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import { getFeePageData, createFeePayment, updateFeePayment, deleteFeePayment, getAllStudents, getFeeStructuresByStandard, getAllStandards } from '../../api/api';
import { getAuthValue } from '../../utils/auth';


const FeeCollection = () => {
  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalPending: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFeeType, setFilterFeeType] = useState('All');
  const [filterStandard, setFilterStandard] = useState('All');
  const [activeTab, setActiveTab] = useState('collection');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('collect'); // 'collect' or 'structure'
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [modalStdFilter, setModalStdFilter] = useState('');
  const [modalSearchFilter, setModalSearchFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    studentId: '', feeStructureId: '', amountPaid: '', paymentDate: '', paymentMode: 'CASH', transactionId: '', remark: ''
  });
  const [structForm, setStructForm] = useState({
    standardId: '', feeName: '', feeType: 'TUITION', amount: '', dueDate: '', description: ''
  });

  // Dropdown / tab list data
  const [students, setStudents] = useState([]);
  const [standards, setStandards] = useState([]);
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [feeStructures, setFeeStructures] = useState([]);
  const [structuresList, setStructuresList] = useState([]);
  const [structLoading, setStructLoading] = useState(false);
  const [feeTypes, setFeeTypes] = useState([]);

  // Fetch page data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFeePageData({ schoolId, academicYearId });
      const data = res?.data;
      if (data) {
        setSummary(data.summary || { totalCollected: 0, totalPending: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 });
        setRecords(data.records || []);
        const types = [...new Set((data.records || []).map(r => r.feeName).filter(Boolean))];
        setFeeTypes(types);
      }
    } catch (err) {
      console.error('Failed to fetch fee data:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load students for dropdown
  useEffect(() => {
    if (schoolId) {
      getAllStudents(schoolId, academicYearId)
        .then(res => setStudents(res?.data || []))
        .catch(() => setStudents([]));
    }
  }, [schoolId, academicYearId]);

  // Load standards
  useEffect(() => {
    if (schoolId) {
      getAllStandards(schoolId, academicYearId)
        .then(res => {
          const stdList = res?.data || [];
          setStandards(stdList);
          if (stdList.length > 0) {
            setSelectedStandardId(stdList[0].id || stdList[0].standardId);
          }
        })
        .catch(() => setStandards([]));
    }
  }, [schoolId, academicYearId]);

  // Fetch fee structures when selected standard changes (for Structure Management Tab)
  const fetchStructures = useCallback(async () => {
    if (!selectedStandardId) return;
    try {
      setStructLoading(true);
      const res = await getFeeStructuresByStandard({ schoolId, standardId: Number(selectedStandardId), academicYearId });
      setStructuresList(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
      setStructuresList([]);
    } finally {
      setStructLoading(false);
    }
  }, [schoolId, selectedStandardId, academicYearId]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Dynamic fee structure loading for selected student in "Collect Fee" modal
  useEffect(() => {
    if (formData.studentId) {
      const student = students.find(s => String(s.id || s.studentId) === String(formData.studentId));
      if (student && student.standardId) {
        getFeeStructuresByStandard({ schoolId, standardId: student.standardId, academicYearId })
          .then(res => setFeeStructures(res?.data || []))
          .catch(() => setFeeStructures([]));
      } else {
        setFeeStructures([]);
      }
    } else {
      setFeeStructures([]);
    }
  }, [formData.studentId, students, schoolId, academicYearId]);

  // Client-side filtering
  const filteredRecords = records.filter(r => {
    const matchesSearch = (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.className || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus.toUpperCase();
    const matchesFeeType = filterFeeType === 'All' || r.feeName === filterFeeType;
    const matchesStandard = filterStandard === 'All' || (r.className || '').toLowerCase().includes(filterStandard.toLowerCase());
    return matchesSearch && matchesStatus && matchesFeeType && matchesStandard;
  });

  const filteredStudentsForSelect = students.filter(s => {
    const matchesStd = !modalStdFilter || String(s.standardId) === String(modalStdFilter);
    const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''} ${s.name || ''} ${s.studentName || ''}`.toLowerCase();
    const matchesSearch = !modalSearchFilter || fullName.includes(modalSearchFilter.toLowerCase());
    return matchesStd && matchesSearch;
  });

  const handleAdd = () => {
    setModalType('collect');
    setEditingPayment(null);
    setModalStdFilter('');
    setModalSearchFilter('');
    setFormData({ studentId: '', feeStructureId: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH', transactionId: '', remark: '' });
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setModalType('collect');
    setEditingPayment(record);
    setModalStdFilter('');
    setModalSearchFilter('');
    setFormData({
      studentId: record.studentId || '', feeStructureId: record.feeStructureId || '',
      amountPaid: record.amountPaid || '', paymentDate: record.paymentDate || '',
      paymentMode: record.paymentMode || 'CASH', transactionId: record.transactionId || '', remark: record.remark || ''
    });
    setShowModal(true);
  };

  // Fee Structure action handlers
  const handleAddStructure = () => {
    setModalType('structure');
    setEditingStructure(null);
    setStructForm({
      standardId: selectedStandardId || '',
      feeName: '',
      feeType: 'TUITION',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowModal(true);
  };

  const handleEditStructure = (structure) => {
    setModalType('structure');
    setEditingStructure(structure);
    setStructForm({
      standardId: structure.standardId || selectedStandardId || '',
      feeName: structure.feeName || '',
      feeType: structure.feeType || 'TUITION',
      amount: structure.amount || '',
      dueDate: structure.dueDate || '',
      description: structure.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteStructure = async (structure) => {
    if (!window.confirm(`Delete fee structure "${structure.feeName}"? This will remove it from standard fees.`)) return;
    try {
      await deleteFeeStructure({ feeStructureId: structure.feeStructureId, schoolId });
      fetchStructures();
      fetchData(); // Refresh collection stats too
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'collect') {
        const payload = {
          schoolId, academicYearId,
          studentId: Number(formData.studentId),
          feeStructureId: formData.feeStructureId ? Number(formData.feeStructureId) : undefined,
          amountPaid: Number(formData.amountPaid),
          paymentDate: formData.paymentDate,
          paymentMode: formData.paymentMode,
          transactionId: formData.transactionId || undefined,
          remark: formData.remark || undefined,
        };

        if (editingPayment) {
          await updateFeePayment({ paymentId: editingPayment.paymentId, schoolId, amountPaid: payload.amountPaid, remark: payload.remark });
        } else {
          await createFeePayment(payload);
        }
        setShowModal(false);
        fetchData();
      } else {
        // Manage Fee Structure Submit
        const payload = {
          schoolId,
          academicYearId,
          standardId: Number(structForm.standardId),
          feeName: structForm.feeName,
          feeType: structForm.feeType,
          amount: Number(structForm.amount),
          dueDate: structForm.dueDate,
          description: structForm.description || undefined
        };

        if (editingStructure) {
          await updateFeeStructure({
            feeStructureId: editingStructure.feeStructureId,
            schoolId,
            academicYearId,
            feeName: payload.feeName,
            feeType: payload.feeType,
            amount: payload.amount,
            dueDate: payload.dueDate,
            description: payload.description
          });
        } else {
          await createFeeStructure(payload);
        }
        setShowModal(false);
        fetchStructures();
        fetchData(); // Refresh collection stats to represent new standards
      }
    } catch (err) {
      alert('Error: ' + (err.message || 'Operation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete payment #${record.receiptNumber || record.paymentId}?`)) return;
    try {
      await deleteFeePayment({ paymentId: record.paymentId, schoolId });
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Generate printable receipt
  const handlePrintReceipt = (record) => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Receipt #${record.receiptNumber || record.paymentId}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}*{box-sizing:border-box}
    .rc{max-width:600px;margin:0 auto;border:2px solid #5d5fef;border-radius:12px;overflow:hidden}
    .rh{background:linear-gradient(135deg,#5d5fef,#7c3aed);color:#fff;padding:24px;text-align:center}
    .rh h1{margin:0;font-size:22px}.rh p{margin:6px 0 0;opacity:.8;font-size:14px}
    .rb{padding:24px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9}
    .row:last-child{border:none}.lbl{color:#64748b;font-size:14px}.val{font-weight:700;font-size:14px}
    .amt{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:20px;text-align:center;margin:20px 0}
    .amt h2{margin:0;color:#16a34a;font-size:28px}.amt p{margin:0 0 4px;color:#64748b;font-size:13px}
    .ft{text-align:center;padding:16px;background:#f8fafc;font-size:12px;color:#94a3b8}
    @media print{body{padding:0}}</style></head><body><div class="rc">
    <div class="rh"><h1>Fee Payment Receipt</h1><p>School Management System</p></div>
    <div class="rb">
    <div class="row"><span class="lbl">Receipt No</span><span class="val">#${record.receiptNumber || record.paymentId}</span></div>
    <div class="row"><span class="lbl">Date</span><span class="val">${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span></div>
    <div class="row"><span class="lbl">Student Name</span><span class="val">${record.studentName || '-'}</span></div>
    <div class="row"><span class="lbl">Class</span><span class="val">${record.className || '-'}</span></div>
    <div class="row"><span class="lbl">Fee Type</span><span class="val">${record.feeName || record.feeType || '-'}</span></div>
    <div class="row"><span class="lbl">Total Amount</span><span class="val">\u20b9${(record.totalAmount || 0).toLocaleString('en-IN')}</span></div>
    <div class="row"><span class="lbl">Payment Mode</span><span class="val">${record.paymentMode || '-'}</span></div>
    ${record.transactionId ? `<div class="row"><span class="lbl">Transaction ID</span><span class="val">${record.transactionId}</span></div>` : ''}
    <div class="amt"><p>Amount Paid</p><h2>\u20b9${(record.amountPaid || 0).toLocaleString('en-IN')}</h2></div>
    ${(record.amountDue || 0) > 0 ? `<div class="row"><span class="lbl">Balance Due</span><span class="val" style="color:#ef4444">\u20b9${(record.amountDue || 0).toLocaleString('en-IN')}</span></div>` : ''}
    </div><div class="ft">This is a computer-generated receipt. No signature required.</div>
    </div><script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="fee-page space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Student Fee Collection
          </h1>
          <p className="text-sm text-slate-500">Finance &gt; Fee Collection</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50" title="Download Report">
            <BiDownload className="text-lg" /> Export
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleAdd}
          >
            <BiPlus className="text-lg" /> Collect Fee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BiWallet size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collection</p>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">₹{(summary.totalCollected || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <BiTimeFive size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pending</p>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-amber-600">₹{(summary.totalPending || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BiCheck size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fully Paid</p>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">{summary.paidCount || 0}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <BiXCircle size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unpaid</p>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-red-600">{summary.unpaidCount || 0}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap border-b border-slate-200">
          <button
            onClick={() => setActiveTab('collection')}
            className={`inline-flex items-center gap-2 px-5 py-4 text-sm font-bold transition ${
              activeTab === 'collection' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BiWallet /> Fee Collection
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`inline-flex items-center gap-2 px-5 py-4 text-sm font-bold transition ${
              activeTab === 'receipt' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BiReceipt /> Generate Receipt
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`inline-flex items-center gap-2 px-5 py-4 text-sm font-bold transition ${
              activeTab === 'structures' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BiPlus /> Standard Fee Structures
          </button>
        </div>
      </div>

        {/* TAB: Fee Collection */}
        {activeTab === 'collection' && (
          <div className="card shadow-sm" style={{ marginTop: '2rem', padding: '0', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
            <div style={{ padding: '1.5rem' }}>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="flex-center gap-1">
                  <div className="search-box" style={{ position: 'relative' }}>
                    <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" className="form-control text-sm" placeholder="Search by name, receipt, class..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.25rem', width: '260px' }} />
                  </div>
                  <select className="form-control text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '140px' }}>
                    <option value="All">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                  <select className="form-control text-sm" value={filterFeeType} onChange={(e) => setFilterFeeType(e.target.value)} style={{ width: '150px' }}>
                    <option value="All">All Fee Types</option>
                    {feeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="form-control text-sm" value={filterStandard} onChange={(e) => setFilterStandard(e.target.value)} style={{ width: '150px' }}>
                    <option value="All">All Standards</option>
                    {standards.map(s => {
                      const stdName = s.standard || s.standardName || s.name;
                      return <option key={s.id || s.standardId} value={stdName}>{stdName}</option>;
                    })}
                  </select>
                </div>
                <div className="text-muted text-sm">
                  {loading ? 'Loading...' : <>Showing <strong>{filteredRecords.length}</strong> of {records.length} records</>}
                </div>
              </div>

              {loading ? (
                <div className="loading-wrapper py-3" style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
                  <p className="text-muted mt-1">Loading fee records...</p>
                </div>
              ) : (
                <DataTable
                  headers={[
                    <div key="receipt" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Receipt</div>,
                    'Student',
                    <div key="class" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Class</div>,
                    'Fee Type',
                    <div key="amount" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Amount</div>,
                    <div key="paid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Paid</div>,
                    <div key="due" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Due</div>,
                    <div key="duedate" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Due Date</div>,
                    <div key="status" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Status</div>,
                    <div key="method" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Method</div>,
                    <div key="actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Actions</div>
                  ]}
                  data={filteredRecords}
                  renderRow={(record) => (
                    <tr key={record.paymentId}>
                      <td style={{ textAlign: 'center' }} className="font-bold text-sm">#{record.receiptNumber || record.paymentId}</td>
                      <td style={{ textAlign: 'left' }}>
                        <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                          <img src={`https://ui-avatars.com/api/?name=${record.studentName || 'S'}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: '28px', height: '28px' }} />
                          <div style={{ textAlign: 'left' }}>
                            <span className="font-bold text-sm">{record.studentName || '-'}</span>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Roll #{record.rollNo || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-light">{record.className || '-'}</span></td>
                      <td style={{ textAlign: 'left' }} className="text-sm">{record.feeName || record.feeType || '-'}</td>
                      <td style={{ textAlign: 'center' }} className="font-bold text-sm">₹{(record.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center', color: 'var(--success)' }} className="text-sm">₹{(record.amountPaid || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center', color: (record.amountDue || 0) > 0 ? '#ef4444' : 'var(--success)' }} className="text-sm">₹{(record.amountDue || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center' }} className="text-sm">{record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-pill ${(record.status || 'unpaid').toLowerCase()}`}>
                          {record.status || 'UNPAID'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="text-sm">{record.paymentMode || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex-center gap-1" style={{ justifyContent: 'center' }}>
                          <button className="btn-icon" title="Edit" onClick={() => handleEdit(record)}><BiEditAlt /></button>
                          <button className="btn-icon text-danger" title="Delete" onClick={() => handleDelete(record)}><BiTrash /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB: Generate Receipt */}
        {activeTab === 'receipt' && (
          <div className="card shadow-sm" style={{ marginTop: '2rem', padding: '0', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
            <div style={{ padding: '1.5rem' }}>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" className="form-control text-sm" placeholder="Search paid records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.25rem', width: '280px' }} />
                </div>
                <div className="text-muted text-sm">
                  <strong>{records.filter(r => (r.status || '').toUpperCase() === 'PAID' && (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</strong> paid records
                </div>
              </div>

              <DataTable
                headers={[
                  <div key="receipt" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Receipt #</div>,
                  'Student',
                  <div key="class" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Class</div>,
                  'Fee Type',
                  <div key="amountpaid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Amount Paid</div>,
                  <div key="date" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Date</div>,
                  <div key="method" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Method</div>,
                  <div key="action" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '120px' }}>Action</div>
                ]}
                data={records.filter(r => (r.status || '').toUpperCase() === 'PAID' && (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()))}
                renderRow={(record) => (
                  <tr key={record.paymentId}>
                    <td style={{ textAlign: 'center' }} className="font-bold text-sm">#{record.receiptNumber || record.paymentId}</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                        <img src={`https://ui-avatars.com/api/?name=${record.studentName || 'S'}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: 28, height: 28 }} />
                        <span className="font-bold text-sm">{record.studentName || '-'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-light">{record.className || '-'}</span></td>
                    <td style={{ textAlign: 'left' }} className="text-sm">{record.feeName || record.feeType || '-'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--success)' }} className="font-bold text-sm">₹{(record.amountPaid || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'center' }} className="text-sm">{record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td style={{ textAlign: 'center' }} className="text-sm">{record.paymentMode || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm fc-receipt-btn flex-center gap-05" style={{ justifyContent: 'center', margin: '0 auto' }} onClick={() => handlePrintReceipt(record)}>
                        <BiPrinter /> Print Receipt
                      </button>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}

        {/* TAB: Standard Fee Structures */}
        {activeTab === 'structures' && (
          <div className="card shadow-sm" style={{ marginTop: '2rem', padding: '0', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
            <div style={{ padding: '1.5rem' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="flex-center gap-1">
                  <label className="font-bold text-sm">Select Class/Standard:</label>
                  <select className="form-control text-sm" value={selectedStandardId} onChange={(e) => setSelectedStandardId(e.target.value)} style={{ width: '180px' }}>
                    {standards.map(s => <option key={s.id || s.standardId} value={s.id || s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary btn-sm flex-center gap-05" onClick={handleAddStructure}>
                  <BiPlus /> Define New Fee
                </button>
              </div>

              {structLoading ? (
                <div className="loading-wrapper py-3" style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
                  <p className="text-muted mt-1">Loading class structures...</p>
                </div>
              ) : structuresList.length === 0 ? (
                <div className="text-center" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fafafa', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                  <BiWallet size={48} color="#94a3b8" />
                  <h3 className="mt-1 mb-05" style={{ color: '#475569', fontWeight: 700 }}>No Fee Structures Defined</h3>
                  <p className="text-muted text-sm max-w-600" style={{ margin: '0 auto 1.5rem auto' }}>
                    There are currently no fee items configured for the selected standard in this academic year. 
                    Define structures such as Tuition Fee, Admission Fee, or Exam Fee to start collecting payments.
                  </p>
                  <button className="btn btn-primary flex-center gap-05" onClick={handleAddStructure} style={{ margin: '0 auto' }}>
                    <BiPlus /> Configure First Fee
                  </button>
                </div>
              ) : (
                <DataTable
                  headers={[
                    'Fee Name',
                    'Fee Type',
                    <div key="amount" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Amount (₹)</div>,
                    <div key="duedate" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Due Date</div>,
                    'Description',
                    <div key="actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Actions</div>
                  ]}
                  data={structuresList}
                  renderRow={(fs) => (
                    <tr key={fs.feeStructureId}>
                      <td style={{ textAlign: 'left' }} className="font-bold text-sm">{fs.feeName}</td>
                      <td style={{ textAlign: 'left' }}><span className="badge badge-light">{fs.feeType || 'TUITION'}</span></td>
                      <td style={{ textAlign: 'center' }} className="font-bold text-sm">₹{(fs.amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center' }} className="text-sm">{fs.dueDate ? new Date(fs.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td style={{ textAlign: 'left' }} className="text-muted text-sm">{fs.description || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex-center gap-1" style={{ justifyContent: 'center' }}>
                          <button className="btn-icon" title="Edit" onClick={() => handleEditStructure(fs)}><BiEditAlt /></button>
                          <button className="btn-icon text-danger" title="Delete" onClick={() => handleDeleteStructure(fs)}><BiTrash /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                />
              )}
            </div>
          </div>
        )}

        {/* Unified Fee Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content card max-w-600">
              <div className="flex-between mb-1">
                <h2>
                  {modalType === 'collect' 
                    ? (editingPayment ? 'Update Payment' : 'Collect Student Fee') 
                    : (editingStructure ? 'Edit Fee Structure' : 'Define New Fee Structure')}
                </h2>
                <button className="btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
              </div>

              {modalType === 'collect' ? (
                /* Collect Fee Modal Form */
                <form className="grid gap-1 mt-1" onSubmit={handleSubmit}>
                  {/* Quick Student Search & Class Filter */}
                  {!editingPayment && (
                    <div className="grid grid-2 gap-1" style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Quick Class Filter</label>
                        <select className="form-control text-xs" style={{ padding: '4px 8px', height: '32px' }} value={modalStdFilter} onChange={e => setModalStdFilter(e.target.value)}>
                          <option value="">All Classes</option>
                          {standards.map(s => {
                            const stdName = s.standard || s.standardName || s.name;
                            return <option key={s.id || s.standardId} value={s.id || s.standardId}>{stdName}</option>;
                          })}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Quick Name Search</label>
                        <input type="text" className="form-control text-xs" style={{ padding: '4px 8px', height: '32px' }} placeholder="Type student name..." value={modalSearchFilter} onChange={e => setModalSearchFilter(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-2 gap-1">
                    <div className="form-group">
                      <label>Student *</label>
                      <select className="form-control" value={formData.studentId} onChange={e => setFormData(p => ({ ...p, studentId: e.target.value, feeStructureId: '' }))} required disabled={!!editingPayment}>
                        <option value="">Select Student ({filteredStudentsForSelect.length} found)</option>
                        {filteredStudentsForSelect.map(s => <option key={s.id || s.studentId} value={s.id || s.studentId}>{s.firstName ? `${s.firstName} ${s.lastName || ''}` : s.name || s.studentName}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fee Item <span className="text-muted text-xs">(optional)</span></label>
                      <select className="form-control" value={formData.feeStructureId} onChange={e => {
                        const selectedFsId = e.target.value;
                        const selectedFs = feeStructures.find(fs => String(fs.feeStructureId) === String(selectedFsId));
                        setFormData(p => ({
                          ...p,
                          feeStructureId: selectedFsId,
                          amountPaid: selectedFs ? String(selectedFs.amount) : p.amountPaid
                        }));
                      }} disabled={!!editingPayment}>
                        <option value="">{feeStructures.length > 0 ? "Select Fee Item (Optional)" : "No structures defined for this class"}</option>
                        {feeStructures.map(fs => (
                          <option key={fs.feeStructureId} value={fs.feeStructureId}>
                            {fs.feeName} (₹{(fs.amount || 0).toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-2 gap-1">
                    <div className="form-group">
                      <label>Amount (₹) *</label>
                      <input type="number" className="form-control" placeholder="Enter amount" value={formData.amountPaid} onChange={e => setFormData(p => ({ ...p, amountPaid: e.target.value }))} required min="1" />
                    </div>
                    <div className="form-group">
                      <label>Payment Date *</label>
                      <input type="date" className="form-control" value={formData.paymentDate} onChange={e => setFormData(p => ({ ...p, paymentDate: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="grid grid-2 gap-1">
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select className="form-control" value={formData.paymentMode} onChange={e => setFormData(p => ({ ...p, paymentMode: e.target.value }))}>
                        <option value="CASH">Cash</option>
                        <option value="ONLINE">Online</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                    {formData.paymentMode !== 'CASH' ? (
                      <div className="form-group">
                        <label>Transaction ID</label>
                        <input type="text" className="form-control" placeholder="e.g. TXN12345" value={formData.transactionId} onChange={e => setFormData(p => ({ ...p, transactionId: e.target.value }))} />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Remarks <span className="text-muted text-xs">(optional)</span></label>
                        <input type="text" className="form-control" placeholder="Any additional notes..." value={formData.remark} onChange={e => setFormData(p => ({ ...p, remark: e.target.value }))} />
                      </div>
                    )}
                  </div>
                  {formData.paymentMode !== 'CASH' && (
                    <div className="form-group">
                      <label>Remarks <span className="text-muted text-xs">(optional)</span></label>
                      <input type="text" className="form-control" placeholder="Any additional notes..." value={formData.remark} onChange={e => setFormData(p => ({ ...p, remark: e.target.value }))} />
                    </div>
                  )}
                  <div className="flex-end gap-1 mt-1">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      <BiWallet /> {submitting ? 'Processing...' : editingPayment ? 'Update Payment' : 'Collect Fee'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Fee Structure Modal Form */
                <form className="grid gap-1 mt-1" onSubmit={handleSubmit}>
                  <div className="grid grid-2 gap-1">
                    <div className="form-group">
                      <label>Class/Standard *</label>
                      <select className="form-control" value={structForm.standardId} onChange={e => setStructForm(p => ({ ...p, standardId: e.target.value }))} required disabled={!!editingStructure}>
                        <option value="">Select Standard</option>
                        {standards.map(s => <option key={s.id || s.standardId} value={s.id || s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fee Name *</label>
                      <input type="text" className="form-control" placeholder="e.g. Tuition Fees - Term 1" value={structForm.feeName} onChange={e => setStructForm(p => ({ ...p, feeName: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="grid grid-2 gap-1">
                    <div className="form-group">
                      <label>Amount (₹) *</label>
                      <input type="number" className="form-control" placeholder="e.g. 15000" value={structForm.amount} onChange={e => setStructForm(p => ({ ...p, amount: e.target.value }))} required min="1" />
                    </div>
                    <div className="form-group">
                      <label>Due Date *</label>
                      <input type="date" className="form-control" value={structForm.dueDate} onChange={e => setStructForm(p => ({ ...p, dueDate: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Fee Category/Type</label>
                    <select className="form-control" value={structForm.feeType} onChange={e => setStructForm(p => ({ ...p, feeType: e.target.value }))}>
                      <option value="TUITION">Tuition Fee</option>
                      <option value="TERM">Term Fee</option>
                      <option value="ADMISSION">Admission Fee</option>
                      <option value="EXAM">Exam Fee</option>
                      <option value="SPORTS">Sports Fee</option>
                      <option value="OTHER">Other Fees</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description <span className="text-muted text-xs">(optional)</span></label>
                    <textarea className="form-control" placeholder="Describe the purpose of this fee..." value={structForm.description} onChange={e => setStructForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>
                  <div className="flex-end gap-1 mt-1">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      <BiPlus /> {submitting ? 'Saving...' : editingStructure ? 'Update Structure' : 'Define Fee'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <style>{`
          .fee-collection-page { animation: fadeIn 0.5s ease; }
          .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
          .bg-primary-light { background: rgba(93, 95, 239, 0.1); }
          .bg-success-light { background: rgba(16, 185, 129, 0.1); }
          .status-pill { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.35rem; letter-spacing: 0.02em; }
          .status-pill.paid { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
          .status-pill.partial { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
          .status-pill.unpaid { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
          .badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }
          .btn-icon { font-size: 1.2rem; color: var(--text-muted); padding: 0.3rem; border-radius: 6px; transition: 0.2s; cursor: pointer; background: none; border: none; }
          .btn-icon:hover { background: var(--bg-light); color: var(--primary); }
          .text-danger { color: var(--danger) !important; }
          .text-danger:hover { color: #b91c1c !important; }
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
          .max-w-600 { width: 100%; max-width: 640px; }
          .modal-content { max-height: 90vh; overflow-y: auto; }
          .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
          .form-group label { font-weight: 600; font-size: 0.85rem; color: var(--text-main); }
          .form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; }
          .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12); outline: none; }
          .grid-2 { grid-template-columns: 1fr 1fr; }
          .grid-4 { grid-template-columns: repeat(4, 1fr); }
          .gap-05 { gap: 0.35rem; }
          .gap-1 { gap: 0.75rem; }
          .mt-2 { margin-top: 1.5rem; }
          .mb-2 { margin-bottom: 1.5rem; }
          .mb-1 { margin-bottom: 0.75rem; }
          .mb-0 { margin-bottom: 0; }
          .mt-1 { margin-top: 0.75rem; }
          .padding-1 { padding: 1.25rem; }
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.85rem; }
          .text-muted { color: var(--text-muted); }
          .font-bold { font-weight: 600; }
          .flex-end { display: flex; justify-content: flex-end; align-items: center; }
          .btn-outline { background: transparent; border: 1.5px solid var(--border-light); color: var(--text-main); }
          .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
          .shadow-sm { box-shadow: var(--shadow-sm); }
          .breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
          .spin{animation:spin 1s linear infinite}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          .fc-tab { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.5rem; font-weight: 600; font-size: 0.9rem; border: none; background: none; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; }
          .fc-tab:hover { color: var(--primary); background: rgba(93,95,239,0.03); }
          .fc-tab-active { color: var(--primary); border-bottom-color: var(--primary); background: rgba(93,95,239,0.05); }
          .fc-receipt-btn { background: var(--primary); color: #fff; border: none; padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap; }
          .fc-receipt-btn:hover { background: #4f46e5; }
          @media (max-width: 1024px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 768px) { .grid-2, .grid-4 { grid-template-columns: 1fr; } }
        `}</style>
    </div>
  );
};

export default FeeCollection;
