import { useState, useEffect } from 'react';
import { 
  BiCreditCard, BiCheck, 
  BiCrown, BiStar, BiLoaderAlt, BiErrorCircle, BiShield
} from 'react-icons/bi';
// import { getAllSubscriptionPlans } from '../../api/api';
import { getMonthlySubscriptionPlans, getYearlySubscriptionPlans } from '../../api/api';

const SuperAdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = billingCycle === 'YEARLY'
        ? await getYearlySubscriptionPlans()
        : await getMonthlySubscriptionPlans();
      if (response && (response.status === 'SUCCESS' || response.code === 200)) {
        const plansList = response.data || [];
        
        // Map to structure needed by this component
        const mappedPlans = plansList.map(plan => {
          let icon = BiStar;
          let color = '#64748b'; 
          const name = plan.planName.toLowerCase();
          
          if (name.includes('premium') || name.includes('crown')) {
            icon = BiCrown;
            color = '#7000ff';
          } else if (name.includes('custom') || name.includes('enterprise')) {
            icon = BiCreditCard;
            color = '#0f172a';
          } else if (name.includes('standard') || name.includes('shield')) {
            icon = BiShield;
            color = '#3b82f6';
          }
          
          return {
            id: plan.planId,
            name: plan.planName.replace(' (Monthly)', '').replace(' (Yearly)', ''),
            price: plan.price,
            billing: plan.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly',
            features: plan.featureList || [],
            icon,
            color,
            discountPercentage: plan.discountPercentage
          };
        });
        
        const sortedPlans = [...mappedPlans].sort((a, b) => {
          if (a.price === 0) return 1;
          if (b.price === 0) return -1;
          return a.price - b.price;
        });
        
        setPlans(sortedPlans);
      } else {
        setError('Failed to fetch subscription plans.');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to fetch subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [billingCycle]);

  if (loading) {
    return (
      <div className="flex-center space-y-8" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
        <BiLoaderAlt size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p className="text-muted font-bold">Loading Platform Plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="superadmin-plans" style={{ padding: '1rem 0' }}>
        <div className="error-alert mt-2" style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 500 }}>
          <BiErrorCircle size={24} />
          <span>{error}</span>
          <button className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', marginLeft: 'auto' }} onClick={fetchPlans}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="superadmin-plans-page">

      {/* ================= HEADER ================= */}
      <div className="plans-header">
        <div>
          <h1 className="plans-title">Platform Subscription Plans</h1>
          <p className="plans-breadcrumb">
            REVENUE &gt; PRICING CONFIGURATIONS
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
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

      {/* ================= PLANS GRID ================= */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div className="subscription-plan-card" key={plan.id}>

            {/* TOP */}
            <div
              className="plan-top-section"
              style={{
                background: `${plan.color}10`,
                borderBottom: `2px solid ${plan.color}25`,
              }}
            >
              <div
                className="plan-icon-wrapper"
                style={{
                  background: plan.color,
                }}
              >
                <plan.icon size={26} color="#fff" />
              </div>

              <h2 className="plan-name">{plan.name}</h2>

              {plan.name.toLowerCase().includes('custom') ? (
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
                  <span className="plan-billing">/{plan.billing}</span>
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
                {plan.features.map((feature, index) => (
                  <li className="plan-feature-item" key={index}>
                    <BiCheck className="feature-check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CSS ================= */}
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

        .create-plan-btn {
          border: none;
          outline: none;
          background: linear-gradient(135deg, #7000ff, #8f44fd);
          color: white;
          padding: 14px 22px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.3s ease;
          box-shadow: 0 10px 25px rgba(112, 0, 255, 0.25);
        }

        .create-plan-btn:hover {
          transform: translateY(-2px);
        }

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
          color: var(--primary);
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
        }

        .plan-feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          min-height: 200px;
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

        /* ================= BUTTONS ================= */

        .plan-action-buttons {
          margin-top: 26px;
          display: flex;
          gap: 12px;
        }

        .edit-plan-btn {
          flex: 1;
          border: 1px solid #d4d4d8;
          background: #fff;
          height: 48px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        .edit-plan-btn:hover {
          background: #f8fafc;
          border-color: #7000ff;
          color: #7000ff;
        }

        .delete-plan-btn {
          width: 52px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: 0.3s ease;
        }

        .delete-plan-btn:hover {
          background: #dc2626;
          color: white;
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

        /* ================= RESPONSIVE ================= */

        @media (max-width: 768px) {
          .plans-title {
            font-size: 30px;
          }
          .plans-grid {
            grid-template-columns: 1fr;
          }
          .create-plan-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminPlans;