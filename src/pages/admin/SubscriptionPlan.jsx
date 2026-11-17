import { useState, useEffect } from 'react';
import { BiCheck, BiCrown, BiRocket, BiStar, BiShield, BiDiamond, BiCreditCard, BiLoaderAlt, BiErrorCircle } from 'react-icons/bi';
import { getMonthlySubscriptionPlans, getYearlySubscriptionPlans } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const RAZORPAY_LINKS = {
  MONTHLY: {
    STANDARD: 'https://rzp.io/rzp/XGXnPm8e',
    PREMIUM: 'https://rzp.io/rzp/CQythuf'
  },
  YEARLY: {
    STANDARD: 'https://rzp.io/rzp/MvX0ZJw',
    PREMIUM: 'https://rzp.io/rzp/UkWfs81'
  }
};

const SubscriptionPlan = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [formData, setFormData] = useState({
    planName: '',
    price: '',
    billingCycle: 'MONTHLY',
    maxStudents: '',
    maxTeachers: '',
    storageLimitGb: '',
    featureList: '',
    supportLevel: '',
    isMostPopular: false
  });

  const getPlanStyle = (name) => {
    const n = name.toLowerCase();
    if (n.includes('premium') || n.includes('crown')) {
      return { icon: BiCrown, color: '#7000ff' };
    }
    if (n.includes('custom') || n.includes('enterprise')) {
      return { icon: BiCreditCard, color: '#0f172a' };
    }
    if (n.includes('standard') || n.includes('shield')) {
      return { icon: BiShield, color: '#3b82f6' };
    }
    return { icon: BiStar, color: '#64748b' };
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = billingCycle === 'YEARLY'
        ? await getYearlySubscriptionPlans()
        : await getMonthlySubscriptionPlans();
      
      if (response && (response.status === 'SUCCESS' || response.code === 200)) {
        const plansList = response.data || [];
        // Sort plans: standard first, premium second, custom (price 0) last
        const sortedPlans = [...plansList].sort((a, b) => {
          if (a.price === 0) return 1;
          if (b.price === 0) return -1;
          return a.price - b.price;
        });
        setPlans(sortedPlans);
      } else {
        setError('Failed to load subscription plans.');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [billingCycle]);

  const handleBuyNow = (plan) => {
    const cycle = (plan.billingCycle || billingCycle || 'MONTHLY').toUpperCase();
    const planName = (plan.planName || '').toUpperCase();

    let link = plan.paymentLink;

    if (!link) {
      if (planName.includes('PREMIUM')) {
        link = RAZORPAY_LINKS[cycle]?.PREMIUM || RAZORPAY_LINKS.MONTHLY.PREMIUM;
      } else {
        link = RAZORPAY_LINKS[cycle]?.STANDARD || RAZORPAY_LINKS.MONTHLY.STANDARD;
      }
    }

    if (!link) {
      alert("Payment link is not available for this plan.");
      return;
    }

    try {
      const schoolId = getAuthValue('schoolId') || localStorage.getItem('schoolId') || '';
      const userEmail = getAuthValue('userEmail') || localStorage.getItem('userEmail') || '';

      const checkoutUrl = new URL(link);
      if (schoolId) checkoutUrl.searchParams.append('notes[school_id]', schoolId);
      if (plan.planId) checkoutUrl.searchParams.append('notes[plan_id]', plan.planId);
      if (userEmail) checkoutUrl.searchParams.append('email', userEmail);

      window.open(checkoutUrl.toString(), '_blank');
    } catch (err) {
      console.error("Error launching checkout URL:", err);
      window.open(link, '_blank');
    }
  };

  /*
  const resetForm = () => {
    setFormData({
      planName: '',
      price: '',
      billingCycle: 'MONTHLY',
      maxStudents: '',
      maxTeachers: '',
      storageLimitGb: '',
      featureList: '',
      supportLevel: '',
      isMostPopular: false
    });
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setFormData({
      planId: plan.planId,
      planName: plan.planName,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      storageLimitGb: plan.storageLimitGb,
      featureList: Array.isArray(plan.featureList) ? plan.featureList.join(', ') : plan.featureList,
      supportLevel: plan.supportLevel,
      isMostPopular: plan.isMostPopular
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        maxStudents: parseInt(formData.maxStudents),
        maxTeachers: parseInt(formData.maxTeachers),
        storageLimitGb: parseInt(formData.storageLimitGb),
        featureList: formData.featureList.split(',').map(f => f.trim()).filter(f => f)
      };

      let response;
      if (isEditing) {
        response = await updateSubscriptionPlan(payload);
      } else {
        response = await addSubscriptionPlan(payload);
      }

      if (response && (response.status === 'SUCCESS' || response.code === 200)) {
        alert(isEditing ? 'Plan updated successfully!' : 'New plan added successfully!');
        setShowModal(false);
        fetchPlans();
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Operation failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      setLoading(true);
      const response = await deleteSubscriptionPlan({ planId });
      if (response && (response.status === 'SUCCESS' || response.code === 200)) {
        alert('Plan deleted successfully!');
        fetchPlans();
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete plan.');
    } finally {
      setLoading(false);
    }
  };
  */

  const displayedPlans = plans;

  if (loading && plans.length === 0) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
        <BiLoaderAlt size={48} className="animate-spin" style={{ color: 'var(--primary, #7000ff)' }} />
        <p className="text-muted font-bold">Synchronizing with API...</p>
      </div>
    );
  }

  return (
    <div className="superadmin-plans-page space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Manage Subscriptions</h1>
          <p className="text-sm text-slate-500">PLATFORM ADMIN &gt; SUBSCRIPTION CATALOG</p>
        </div>
        <div className="flex items-center">
          <div className="billing-toggle-premium">
            <button className={`toggle-option ${billingCycle === 'MONTHLY' ? 'active' : ''}`} onClick={() => setBillingCycle('MONTHLY')}>
              <span>Monthly</span>
            </button>
            <button className={`toggle-option ${billingCycle === 'YEARLY' ? 'active' : ''}`} onClick={() => setBillingCycle('YEARLY')}>
              <span>Yearly</span>
              <span className="save-badge">Save ~15%</span>
            </button>
            <div className={`active-slider ${billingCycle === 'YEARLY' ? 'yearly' : 'monthly'}`}></div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <BiErrorCircle size={24} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="text-indigo-600 underline" onClick={fetchPlans}>Retry Connection</button>
        </div>
      ) : (
        <div className="plans-grid">
          {displayedPlans.length > 0 ? (
            displayedPlans.map((plan) => {
              const { icon: PlanIcon, color: planColor } = getPlanStyle(plan.planName);
              return (
                <div className="subscription-plan-card" key={plan.planId}>
                  
                  {/* TOP */}
                  <div
                    className="plan-top-section"
                    style={{
                      background: `${planColor}10`,
                      borderBottom: `2px solid ${planColor}25`,
                    }}
                  >
                    <div
                      className="plan-icon-wrapper"
                      style={{
                        background: planColor,
                      }}
                    >
                      <PlanIcon size={26} color="#fff" />
                    </div>

                    <h2 className="plan-name">{plan.planName.replace(' (Monthly)', '').replace(' (Yearly)', '')}</h2>

                    {plan.planName.toLowerCase().includes('custom') ? (
                      <div className="plan-price-area">
                        <a 
                          href="https://www.masterdiamond.in/contact" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="contact-us-link"
                        >
                          Contact Us
                        </a>
                      </div>
                    ) : (
                      <div className="plan-price-area" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                        <span className="plan-currency">₹</span>
                        <span className="plan-price">{plan.price.toLocaleString('en-IN')}</span>
                        <span className="plan-billing">/{plan.billingCycle.toLowerCase()}</span>
                        {plan.discountPercentage && plan.discountPercentage > 0 && (
                          <span className="discount-badge">
                            {plan.discountPercentage}% discount
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FEATURES */}
                  <div className="plan-features-section">
                    <ul className="plan-feature-list">
                      {!plan.planName.toLowerCase().includes('custom') && (
                        <>
                          <li className="plan-feature-item">
                            <BiCheck className="feature-check-icon" />
                            <span><strong>{plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}</strong> Students Limit</span>
                          </li>
                          <li className="plan-feature-item">
                            <BiCheck className="feature-check-icon" />
                            <span><strong>{plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}</strong> Teachers Limit</span>
                          </li>
                        </>
                      )}
                      {Array.isArray(plan.featureList) && plan.featureList.map((f, i) => (
                        <li className="plan-feature-item" key={i}>
                          <BiCheck className="feature-check-icon" />
                          <span>{f}</span>
                        </li>
                      ))}
                      {plan.supportLevel && (
                        <li className="plan-feature-item">
                          <BiCheck className="feature-check-icon" />
                          <span><strong>Support:</strong> {plan.supportLevel}</span>
                        </li>
                      )}
                    </ul>

                    {!plan.planName.toLowerCase().includes('custom') && (
                      <button 
                        className="buy-now-btn"
                        onClick={() => handleBuyNow(plan)}
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '12px', color: '#666' }}>
              No subscription plans found.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-1-5">{isEditing ? 'Update Plan' : 'Create Subscription Plan'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-1-5">
              <div className="form-group col-span-2">
                <label className="label">Plan Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Professional Suite"
                  value={formData.planName}
                  onChange={(e) => setFormData({...formData, planName: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Billing Price (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="2999"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Billing Cycle</label>
                <select 
                  className="input-field"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Max Students</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Max Teachers</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.maxTeachers}
                  onChange={(e) => setFormData({...formData, maxTeachers: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Storage Limit (GB)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.storageLimitGb}
                  onChange={(e) => setFormData({...formData, storageLimitGb: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Support Level</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="24/7 Dedicated Support"
                  value={formData.supportLevel}
                  onChange={(e) => setFormData({...formData, supportLevel: e.target.value})}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="label">Features (Comma separated)</label>
                <textarea 
                  className="input-field" 
                  rows="3"
                  placeholder="Attendance, Exams, Live Lectures, SMS Notifications"
                  value={formData.featureList}
                  onChange={(e) => setFormData({...formData, featureList: e.target.value})}
                  required
                ></textarea>
              </div>

              <div className="form-group col-span-2 flex items-center gap-1">
                <input 
                  type="checkbox" 
                  id="mostPopular" 
                  checked={formData.isMostPopular}
                  onChange={(e) => setFormData({...formData, isMostPopular: e.target.checked})}
                />
                <label htmlFor="mostPopular" className="label" style={{ marginBottom: 0 }}>Mark as "Most Popular"</label>
              </div>

              <div className="col-span-2 flex-end gap-1 mt-1 border-top pt-1-5">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : isEditing ? 'Update Plan' : 'Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .superadmin-plans-page {
          width: 100%;
          padding: 24px;
        }

        /* ================= HEADER ================= */

        .plans-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .plans-title {
          font-size: 42px;
          font-weight: 800;
          color: #2f2f73;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .plans-breadcrumb {
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 1px;
        }

        /* ================= BILLING TOGGLE ================= */
        .billing-toggle-premium {
          position: relative;
          display: flex;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 4px;
          border-radius: 9999px;
          width: 240px;
          height: 40px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        .billing-toggle-premium .toggle-option {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          font-weight: 700;
          font-size: 0.8rem;
          color: #64748b;
          cursor: pointer;
          transition: color 0.25s ease;
          line-height: 1.1;
        }
        .billing-toggle-premium .toggle-option.active {
          color: var(--primary, #7000ff);
        }
        .billing-toggle-premium .save-badge {
          font-size: 0.58rem;
          background: #dcfce7;
          color: #15803d;
          padding: 1px 6px;
          border-radius: 9999px;
          margin-top: 1px;
          font-weight: 800;
        }
        .billing-toggle-premium .active-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc(50% - 4px);
          background: white;
          border-radius: 9999px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 1;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .billing-toggle-premium .active-slider.yearly {
          transform: translateX(100%);
        }

        .error-alert { background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 1rem; display: flex; align-items: center; gap: 1rem; font-weight: 500; }
        .btn-link { background: none; border: none; color: var(--primary, #7000ff); text-decoration: underline; cursor: pointer; padding: 0; margin-left: auto; }

        /* ================= GRID ================= */

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 28px;
        }

        /* ================= CARD ================= */

        .subscription-plan-card {
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #ececec;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          transition: 0.35s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .subscription-plan-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
        }

        /* ================= TOP ================= */

        .plan-top-section {
          padding: 34px 28px;
          text-align: center;
        }

        .plan-icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .plan-name {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 14px;
        }

        .plan-price-area {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 2px;
        }

        .plan-currency {
          font-size: 22px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
        }

        .plan-price {
          font-size: 48px;
          font-weight: 900;
          line-height: 1;
          color: #111827;
        }

        .plan-billing {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .discount-badge {
          background: #dcfce7;
          color: #15803d;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 0.5rem;
          display: inline-flex;
          align-items: center;
        }

        .contact-us-link {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary, #7000ff);
          text-decoration: underline;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: inline-block;
        }
        .contact-us-link:hover {
          color: #4f46e5;
          transform: translateY(-1px);
        }

        /* ================= FEATURES ================= */

        .plan-features-section {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .plan-feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }

        .plan-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px dashed #e5e7eb;
          color: #475569;
          font-size: 15px;
          font-weight: 500;
        }

        .feature-check-icon {
          color: #16a34a;
          font-size: 20px;
          min-width: 20px;
        }

        .buy-now-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #7000ff, #8f44fd);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(112, 0, 255, 0.2);
        }
        .buy-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(112, 0, 255, 0.3);
        }
        .buy-now-btn:active {
          transform: translateY(0);
        }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1.5rem; }
        .modal-content { max-height: 90vh; overflow-y: auto; }
        .col-span-2 { grid-column: span 2; }
        .label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.4rem; }
      `}</style>
    </div>
  );
};

export default SubscriptionPlan;
