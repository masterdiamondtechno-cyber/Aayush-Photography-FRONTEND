import { useState } from 'react';
import { BiMessageDetail, BiCheckCircle, BiLoader, BiHelpCircle, BiPaperPlane } from 'react-icons/bi';
import { createTicket } from '../../api/api';

const Ticket = () => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await createTicket({
        title: formData.title,
        description: formData.description
      });
      setSuccess(true);
      setFormData({ title: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ticket-page mx-auto max-w-[900px] space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Raise Support Ticket
        </h1>
        <p className="text-sm text-slate-500">
          Submit a ticket to the school board/super administrators for platform assistance.
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 p-5">
          <BiCheckCircle size={28} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-semibold text-emerald-800">Ticket Submitted Successfully!</h3>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
              Your ticket has been logged and sent to the platform administrators. Our support representatives will review the details and reach out to your registered email shortly.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-5">
          <span className="shrink-0 text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">Failed to Submit Ticket</h3>
            <p className="mt-1 text-sm text-red-900/80">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Issue Title *</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                placeholder="Give a brief summary of the issue (e.g. Unable to configure Class 10th fees)"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group mt-1">
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Detailed Description *</label>
              <textarea 
                className="form-control" 
                rows="6" 
                placeholder="Provide a comprehensive explanation of the issue, including steps to reproduce or any relevant error messages..." 
                value={formData.description} 
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                required 
                disabled={submitting}
                style={{ padding: '0.85rem 1rem', borderRadius: '10px', resize: 'vertical' }}
              />
            </div>

            <div className="flex-end mt-2">
              <button 
                type="submit" 
                className="btn btn-primary flex-center gap-05" 
                disabled={submitting}
                style={{ padding: '0.85rem 2rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {submitting ? (
                  <>
                    <BiLoader className="spin" size={18} /> Submitting...
                  </>
                ) : (
                  <>
                    <BiPaperPlane size={18} /> Raise Support Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Information / Helpful links panel */}
        <div className="card shadow-sm" style={{ padding: '1.5rem 1.75rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="flex gap-05 mb-1" style={{ alignItems: 'center' }}>
            <BiHelpCircle size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Platform Support</h3>
          </div>
          
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#475569', fontSize: '0.85rem', display: 'grid', gap: '0.75rem', lineHeight: '1.5' }}>
            <li>Please state your issues clearly to ensure quick turnaround times.</li>
            <li>Tickets are processed in order of receipt. Critical items are usually addressed within 2-4 business hours.</li>
            <li>Once resolved, platform administrators will communicate resolution details directly to your registered administrator email address.</li>
          </ul>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            Powered by platform helpdesk.
          </div>
        </div>
      </div>

      <style>{`
        .ticket-page { animation: fadeIn 0.5s ease; }
        .col-span-2 { grid-column: span 2 / span 2; }
        .form-control:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(93,95,239,0.15) !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr !important; }
          .col-span-2 { grid-column: span 1 / span 1; }
        }
      `}</style>
    </div>
  );
};

export default Ticket;
