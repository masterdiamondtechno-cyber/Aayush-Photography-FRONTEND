import { useState, useEffect } from "react";
import {
  BiCreditCard, BiPlus, BiSearch, BiEditAlt, BiTrash, BiDownload,
  BiCheck, BiTimeFive, BiMoney, BiCalendar, BiX, BiWallet, BiLoader
} from "react-icons/bi";
import DataTable from "../../components/common/DataTable";
import {
  getTeacherPaymentPageData,
  createTeacherPaymentRecord,
  updateTeacherPaymentRecord,
  deleteTeacherPaymentRecord,
  markTeacherPaymentPaid,
  getAllTeachers
} from "../../api/api";
import { getAuthValue } from "../../utils/auth";


const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

const TeacherPayment = () => {
  const [pageData, setPageData] = useState({ totalPayroll: 0, totalDisbursed: 0, totalPending: 0, pendingCount: 0, payPeriod: '', payments: [] });
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Create payment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [createForm, setCreateForm] = useState({ teacherId: '', paymentMonth: '', paymentYear: new Date().getFullYear(), basicSalary: '', bonus: '0', deductions: '0', status: 'PENDING' });

  // Edit payment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [editForm, setEditForm] = useState({ teacherPaymentId: '', teacherId: '', teacherName: '', paymentMonth: '', paymentYear: '', basicSalary: '', bonus: '0', deductions: '0', status: 'PENDING' });

  // Mark as paid form
  const [payForm, setPayForm] = useState({ paymentMode: 'BANK_TRANSFER', paymentDate: '', transactionId: '', remark: '' });

  // Feedback toast
  const [feedback, setFeedback] = useState(null);

  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  useEffect(() => { fetchPageData(); }, [filterStatus]);

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchPageData = async () => {
    if (!schoolId || !academicYearId) return;
    try {
      setLoading(true);
      const res = await getTeacherPaymentPageData({
        schoolId, academicYearId,
        statusFilter: filterStatus
      });
      if (res.data) {
        setPageData({
          totalPayroll: res.data.totalPayroll || 0,
          totalDisbursed: res.data.totalDisbursed || 0,
          totalPending: res.data.totalPending || 0,
          pendingCount: res.data.pendingCount || 0,
          payPeriod: res.data.payPeriod || '',
          payments: res.data.payments || []
        });
      }
    } catch (err) {
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (record) => {
    setSelectedPay(record);
    setPayForm({ paymentMode: 'BANK_TRANSFER', paymentDate: new Date().toISOString().split('T')[0], transactionId: '', remark: '' });
    setShowPayModal(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPay) return;
    setProcessing(true);
    try {
      await markTeacherPaymentPaid({
        teacherPaymentId: selectedPay.teacherPaymentId,
        schoolId,
        paymentMode: payForm.paymentMode,
        paymentDate: payForm.paymentDate,
        transactionId: payForm.transactionId,
        remark: payForm.remark
      });
      showFeedback('Payment marked as paid successfully');
      setShowPayModal(false);
      fetchPageData();
    } catch (err) {
      console.error('Error marking payment as paid:', err);
      showFeedback('Failed to mark payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTeacherChange = (teacherId) => {
    const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId));
    setCreateForm(prev => ({
      ...prev,
      teacherId,
      basicSalary: selectedTeacher ? (selectedTeacher.monthlySalary || '') : '',
      bonus: '0',
      deductions: '0'
    }));
  };

  const handleEditClick = (record) => {
    setSelectedEdit(record);
    setEditForm({
      teacherPaymentId: record.teacherPaymentId,
      teacherId: record.teacherId,
      teacherName: record.teacherName,
      paymentMonth: record.paymentMonth,
      paymentYear: record.paymentYear,
      basicSalary: record.basicSalary || '',
      bonus: record.bonus || '0',
      deductions: record.deductions || '0',
      status: record.status || 'PENDING'
    });
    setShowEditModal(true);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    const basic = Number(createForm.basicSalary) || 0;
    const bonus = Number(createForm.bonus) || 0;
    const deductions = Number(createForm.deductions) || 0;

    if (basic < 0 || bonus < 0 || deductions < 0) {
      showFeedback('Salary components cannot be negative', 'error');
      return;
    }

    if (basic + bonus - deductions < 0) {
      showFeedback('Deductions cannot exceed Basic Salary + Bonus', 'error');
      return;
    }

    setProcessing(true);
    try {
      await createTeacherPaymentRecord({
        schoolId, academicYearId,
        teacherId: Number(createForm.teacherId),
        paymentMonth: createForm.paymentMonth,
        paymentYear: Number(createForm.paymentYear),
        basicSalary: basic,
        bonus: bonus,
        deductions: deductions,
        status: createForm.status
      });
      showFeedback('Payment record created successfully');
      setShowCreateModal(false);
      setCreateForm({ teacherId: '', paymentMonth: '', paymentYear: new Date().getFullYear(), basicSalary: '', bonus: '0', deductions: '0', status: 'PENDING' });
      fetchPageData();
    } catch (err) {
      console.error('Error creating payment:', err);
      showFeedback('Failed to create payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();
    const basic = Number(editForm.basicSalary) || 0;
    const bonus = Number(editForm.bonus) || 0;
    const deductions = Number(editForm.deductions) || 0;

    if (basic < 0 || bonus < 0 || deductions < 0) {
      showFeedback('Salary components cannot be negative', 'error');
      return;
    }

    if (basic + bonus - deductions < 0) {
      showFeedback('Deductions cannot exceed Basic Salary + Bonus', 'error');
      return;
    }

    setProcessing(true);
    try {
      await updateTeacherPaymentRecord({
        teacherPaymentId: editForm.teacherPaymentId,
        schoolId,
        academicYearId,
        paymentMonth: editForm.paymentMonth,
        paymentYear: Number(editForm.paymentYear),
        basicSalary: basic,
        bonus: bonus,
        deductions: deductions,
        status: editForm.status
      });
      showFeedback('Payment record updated successfully');
      setShowEditModal(false);
      fetchPageData();
    } catch (err) {
      console.error('Error updating payment:', err);
      showFeedback('Failed to update payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`Delete payment ${payment.receiptNumber}?`)) return;
    try {
      await deleteTeacherPaymentRecord({ teacherPaymentId: payment.teacherPaymentId, schoolId });
      showFeedback('Payment deleted successfully');
      fetchPageData();
    } catch (err) {
      console.error('Error deleting payment:', err);
      showFeedback('Failed to delete payment', 'error');
    }
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    try {
      const res = await getAllTeachers(schoolId, academicYearId);
      if (res.data && Array.isArray(res.data)) setTeachers(res.data);
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  const filtered = pageData.payments.filter((p) => {
    const ms = (p.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    return ms;
  });

  return (
    <div className="teacher-payment-page space-y-8">
      {feedback && (
        <div className={`tp-toast ${feedback.type}`}>{feedback.type === 'success' ? <BiCheck /> : <BiX />} {feedback.message}</div>
      )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Teacher Payment</h1>
            <p className="text-sm text-slate-500">Finance &gt; Teacher Payment</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
              onClick={openCreateModal}
            >
              <BiPlus className="text-lg" /> Create Payment
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <BiDownload className="text-lg" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BiMoney size={24} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Payroll</p><h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">₹{pageData.totalPayroll.toLocaleString("en-IN")}</h3></div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><BiCheck size={24} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disbursed</p><h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-emerald-600">₹{pageData.totalDisbursed.toLocaleString("en-IN")}</h3></div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><BiTimeFive size={24} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending ({pageData.pendingCount})</p><h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-amber-600">₹{pageData.totalPending.toLocaleString("en-IN")}</h3></div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-sky-500 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><BiCalendar size={24} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pay Period</p><h3 className="mt-1 font-['Lexend'] text-lg font-extrabold text-slate-900">{pageData.payPeriod || '—'}</h3></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-center gap-1">
                <div style={{ position: "relative" }}>
                  <BiSearch style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input type="text" className="form-control text-sm" placeholder="Search teacher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: "2.25rem", width: "260px" }} />
                </div>
                <select className="form-control text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "140px" }}>
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="text-muted text-sm">Showing <strong>{filtered.length}</strong> of {pageData.payments.length}</div>
            </div>

            {loading ? (
              <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--text-muted)'}}><BiLoader className="tp-spinner" /> Loading...</div>
            ) : (
              <DataTable
                headers={[
                  <div key="receipt" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Receipt</div>,
                  'Teacher',
                  'Dept',
                  <div key="salary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '95px' }}>Salary</div>,
                  <div key="bonus" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Bonus</div>,
                  <div key="deduct" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Deduct</div>,
                  <div key="netpay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Net Pay</div>,
                  <div key="month" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Month</div>,
                  <div key="status" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Status</div>,
                  <div key="method" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Method</div>,
                  <div key="actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '130px' }}>Actions</div>
                ]}
                data={filtered}
                renderRow={(p) => (
                  <tr key={p.teacherPaymentId}>
                    <td style={{ textAlign: 'center' }} className="font-bold text-sm">{p.receiptNumber}</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex-center gap-1" style={{ justifyContent: "flex-start" }}>
                        <div className="tp-avatar">{p.avatarInitials || p.teacherName?.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                        <span className="font-bold text-sm">{p.teacherName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'left' }}><span className="badge badge-light">{p.department || '-'}</span></td>
                    <td style={{ textAlign: 'center' }} className="text-sm">₹{(p.basicSalary || 0).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: 'center', color: "var(--success)" }} className="text-sm">+₹{(p.bonus || 0).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: 'center', color: "#ef4444" }} className="text-sm">-₹{(p.deductions || 0).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: 'center' }} className="font-bold text-sm">₹{(p.netAmountPaid || 0).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: 'center' }} className="text-sm">{p.monthLabel || `${p.paymentMonth} ${p.paymentYear}`}</td>
                    <td style={{ textAlign: 'center' }}><span className={`status-pill ${(p.status || '').toLowerCase()}`}>{p.status}</span></td>
                    <td style={{ textAlign: 'center' }} className="text-sm">{p.paymentMode || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex-center gap-1" style={{ justifyContent: "center", minWidth: "120px" }}>
                        <div style={{ width: "70px", display: "flex", justifyContent: "center" }}>
                          {p.status === "PENDING" && (
                            <button className="btn btn-sm btn-pay flex-center gap-05" onClick={() => handlePayClick(p)}><BiCreditCard /> Pay</button>
                          )}
                        </div>
                        {p.status === "PENDING" && (
                          <button className="btn-icon" title="Edit" onClick={() => handleEditClick(p)}><BiEditAlt /></button>
                        )}
                        <button className="btn-icon text-danger" title="Delete" onClick={() => handleDelete(p)}><BiTrash /></button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>

        {/* ===== MARK AS PAID MODAL ===== */}
        {showPayModal && selectedPay && (
          <div className="modal-overlay">
            <div className="modal-content card max-w-500 payment-summary-card">
              <div className="payment-modal-header">
                <div className="flex-between">
                  <h2 className="text-white">Payment Summary</h2>
                  <button className="btn-close-white" onClick={() => setShowPayModal(false)}><BiX /></button>
                </div>
                <div className="teacher-profile-mini mt-1">
                  <div className="tp-avatar-lg">{selectedPay.avatarInitials || selectedPay.teacherName?.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <div>
                    <h3 className="text-white mb-0">{selectedPay.teacherName}</h3>
                    <p className="text-white-50 text-xs">{selectedPay.department || '-'} • {selectedPay.monthLabel}</p>
                  </div>
                </div>
              </div>

              <div className="payment-details-body padding-2">
                <div className="detail-item flex-between mb-1">
                  <span className="text-muted">Base Salary</span>
                  <span className="font-bold">₹{(selectedPay.basicSalary || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item flex-between mb-1">
                  <span className="text-muted">Bonus</span>
                  <span className="text-success font-bold">+₹{(selectedPay.bonus || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item flex-between mb-1 border-bottom-dashed pb-1">
                  <span className="text-muted">Deductions</span>
                  <span className="text-danger font-bold">-₹{(selectedPay.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="total-payout flex-between pt-1">
                  <span className="total-label">Total Net Pay</span>
                  <span className="total-amount primary-text">₹{(selectedPay.netAmountPaid || 0).toLocaleString()}</span>
                </div>

                <div style={{marginTop:'1.5rem',display:'grid',gap:'0.75rem'}}>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Payment Mode</label>
                    <select className="form-control" value={payForm.paymentMode} onChange={e => setPayForm(p=>({...p, paymentMode: e.target.value}))}>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Payment Date</label>
                    <input type="date" className="form-control" value={payForm.paymentDate} onChange={e => setPayForm(p=>({...p, paymentDate: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Transaction ID</label>
                    <input type="text" className="form-control" placeholder="e.g. TXN123456" value={payForm.transactionId} onChange={e => setPayForm(p=>({...p, transactionId: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Remark</label>
                    <input type="text" className="form-control" placeholder="e.g. March Salary Paid" value={payForm.remark} onChange={e => setPayForm(p=>({...p, remark: e.target.value}))} />
                  </div>
                </div>

                <button className="btn btn-primary w-100 mt-2 py-1 flex-center gap-1" onClick={handleMarkAsPaid} disabled={processing}>
                  {processing ? "Processing..." : <><BiWallet /> Mark as Paid</>}
                </button>
                <button className="btn btn-outline w-100 mt-1" onClick={() => setShowPayModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== CREATE PAYMENT MODAL ===== */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content card" style={{width:'100%',maxWidth:'550px',padding:'2rem',maxHeight:'90vh',overflowY:'auto'}}>
              <div className="flex-between" style={{marginBottom:'1.5rem'}}>
                <h2>Create Payment</h2>
                <button className="btn-icon" onClick={() => setShowCreateModal(false)}><BiX style={{fontSize:'1.2rem'}} /></button>
              </div>
              <form onSubmit={handleCreatePayment} style={{display:'grid',gap:'0.75rem'}}>
                <div className="form-group">
                  <label style={{fontWeight:600,fontSize:'0.85rem'}}>Teacher</label>
                  <select className="form-control" value={createForm.teacherId} onChange={e => handleTeacherChange(e.target.value)} required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.teacherName || t.name}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Month</label>
                    <select className="form-control" value={createForm.paymentMonth} onChange={e => setCreateForm(p=>({...p, paymentMonth: e.target.value}))} required>
                      <option value="">Select</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Year</label>
                    <input type="number" className="form-control" value={createForm.paymentYear} onChange={e => setCreateForm(p=>({...p, paymentYear: e.target.value}))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:600,fontSize:'0.85rem'}}>Basic Salary (₹)</label>
                  <input type="number" className="form-control" placeholder="e.g. 50000" value={createForm.basicSalary} onChange={e => setCreateForm(p=>({...p, basicSalary: e.target.value}))} required />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Bonus (₹)</label>
                    <input type="number" className="form-control" value={createForm.bonus} onChange={e => setCreateForm(p=>({...p, bonus: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Deductions (₹)</label>
                    <input type="number" className="form-control" value={createForm.deductions} onChange={e => setCreateForm(p=>({...p, deductions: e.target.value}))} />
                  </div>
                </div>
                {createForm.basicSalary && (
                  <div className="card bg-light padding-1 mt-1 flex-between" style={{ borderLeft: "4px solid var(--primary)", background: "var(--bg-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-bold text-sm">Calculated Net Pay:</span>
                    <span className="font-bold text-primary">₹{((Number(createForm.basicSalary) || 0) + (Number(createForm.bonus) || 0) - (Number(createForm.deductions) || 0)).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'flex-end',gap:'0.75rem',marginTop:'1rem'}}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Creating...' : <><BiPlus /> Create</>}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== EDIT PAYMENT MODAL ===== */}
        {showEditModal && selectedEdit && (
          <div className="modal-overlay">
            <div className="modal-content card" style={{width:'100%',maxWidth:'550px',padding:'2rem',maxHeight:'90vh',overflowY:'auto'}}>
              <div className="flex-between" style={{marginBottom:'1.5rem'}}>
                <h2>Edit Payment</h2>
                <button className="btn-icon" onClick={() => setShowEditModal(false)}><BiX style={{fontSize:'1.2rem'}} /></button>
              </div>
              <form onSubmit={handleEditPayment} style={{display:'grid',gap:'0.75rem'}}>
                <div className="form-group">
                  <label style={{fontWeight:600,fontSize:'0.85rem'}}>Teacher</label>
                  <input type="text" className="form-control" value={editForm.teacherName} disabled style={{background:'#f1f5f9',color:'#64748b'}} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Month</label>
                    <select className="form-control" value={editForm.paymentMonth} onChange={e => setEditForm(p=>({...p, paymentMonth: e.target.value}))} required>
                      <option value="">Select</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Year</label>
                    <input type="number" className="form-control" value={editForm.paymentYear} onChange={e => setEditForm(p=>({...p, paymentYear: e.target.value}))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:600,fontSize:'0.85rem'}}>Basic Salary (₹)</label>
                  <input type="number" className="form-control" placeholder="e.g. 50000" value={editForm.basicSalary} onChange={e => setEditForm(p=>({...p, basicSalary: e.target.value}))} required />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Bonus (₹)</label>
                    <input type="number" className="form-control" value={editForm.bonus} onChange={e => setEditForm(p=>({...p, bonus: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight:600,fontSize:'0.85rem'}}>Deductions (₹)</label>
                    <input type="number" className="form-control" value={editForm.deductions} onChange={e => setEditForm(p=>({...p, deductions: e.target.value}))} />
                  </div>
                </div>
                {editForm.basicSalary && (
                  <div className="card bg-light padding-1 mt-1 flex-between" style={{ borderLeft: "4px solid var(--primary)", background: "var(--bg-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-bold text-sm">Calculated Net Pay:</span>
                    <span className="font-bold text-primary">₹{((Number(editForm.basicSalary) || 0) + (Number(editForm.bonus) || 0) - (Number(editForm.deductions) || 0)).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'flex-end',gap:'0.75rem',marginTop:'1rem'}}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Saving...' : <><BiCheck /> Save Changes</>}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
        .teacher-payment-page { animation: fadeIn 0.5s ease; }
        .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .bg-primary-light { background: rgba(93,95,239,0.1); }
        .bg-success-light { background: rgba(16,185,129,0.1); }
        .status-pill { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; letter-spacing: 0.02em; }
        .status-pill.paid { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .status-pill.pending { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .btn-pay { background: var(--success) !important; color: white !important; font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; }
        .btn-pay:hover { background: #059669 !important; }
        .badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }
        .btn-icon { font-size: 1.2rem; color: var(--text-muted); padding: 0.3rem; border-radius: 6px; transition: 0.2s; cursor: pointer; background: none; border: none; }
        .btn-icon:hover { background: var(--bg-light); color: var(--primary); }
        .text-danger { color: var(--danger) !important; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
        .max-w-500 { width: 100%; max-width: 500px; }
        .modal-content { max-height: 90vh; overflow-y: auto; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93,95,239,0.12); outline: none; }
        .grid-4 { grid-template-columns: repeat(4,1fr); }
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
        .btn-sm { font-size: 0.8rem; padding: 0.35rem 0.65rem; }
        .btn-outline { background: transparent; border: 1.5px solid var(--border-light); color: var(--text-main); }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        .shadow-sm { box-shadow: var(--shadow-sm); }
        .breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
        .tp-avatar { width:28px;height:28px;border-radius:50%;background:#5d5fef;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0; }
        .tp-avatar-lg { width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;flex-shrink:0; }
        .tp-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tp-toast { position: fixed; top: 20px; right: 20px; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; z-index: 2000; display: flex; align-items: center; gap: 0.5rem; animation: slideInRight 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .tp-toast.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .tp-toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @media (max-width: 1024px) { .grid-4 { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 768px) { .grid-4 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default TeacherPayment;
