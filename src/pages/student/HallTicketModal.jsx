import React, { useEffect, useState, useRef } from 'react';
import { BiX, BiPrinter, BiCalendarStar, BiTimeFive, BiBookOpen, BiIdCard, BiMapPin, BiUserCircle, BiInfoCircle } from 'react-icons/bi';
import { getHallTicket } from '../../api/api';

const HallTicketModal = ({ exam, schoolId, academicYearId, studentId, onClose }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef();

  useEffect(() => {
    let mounted = true;
    const fetchTicket = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getHallTicket({ schoolId, academicYearId, studentId, examId: exam.examId });
        if (mounted) {
          if (res?.status === 'SUCCESS' || res?.code === 200) {
            setTicket(res.data);
          } else {
            setError(res?.message || 'Failed to fetch hall ticket');
          }
        }
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'Failed to fetch hall ticket');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTicket();
    return () => { mounted = false; };
  }, [exam.examId, schoolId, academicYearId, studentId]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hall Ticket - ${ticket?.examName || 'Exam'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Lexend:wght@700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .hall-ticket-print-wrapper { max-width: 800px; margin: 0 auto; border: 2px solid #6C5CE7; padding: 30px; border-radius: 12px; position: relative; }
            .ht-header { text-align: center; border-bottom: 3px double #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .ht-header h1 { font-family: 'Lexend', sans-serif; font-size: 24px; color: #6C5CE7; text-transform: uppercase; margin-bottom: 5px; }
            .ht-header h2 { font-size: 14px; font-weight: 500; color: #64748b; letter-spacing: 3px; }
            .ht-main-content { display: flex; gap: 30px; margin-bottom: 30px; }
            .ht-photo-box { width: 130px; height: 160px; border: 2px dashed #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px; color: #94a3b8; font-size: 10px; flex-shrink: 0; }
            .ht-info-grid { flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px 25px; }
            .ht-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 3px; }
            .ht-field p { font-size: 14px; font-weight: 600; color: #1e293b; }
            .perforation-line { border-top: 2px dashed #e2e8f0; margin: 25px 0; position: relative; }
            .perforation-line:before, .perforation-line:after { content: ''; position: absolute; top: -8px; width: 16px; height: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 50%; }
            .perforation-line:before { left: -39px; } .perforation-line:after { right: -39px; }
            .ht-exam-details { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px; }
            .ht-instructions { font-size: 11px; color: #64748b; line-height: 1.6; }
            .ht-instructions h4 { color: #1e293b; margin-bottom: 8px; text-transform: uppercase; }
            .ht-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .ht-seal { width: 100px; height: 100px; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #cbd5e1; text-transform: uppercase; transform: rotate(-15deg); }
            .ht-sign { border-top: 1px solid #1e293b; padding-top: 5px; width: 150px; text-align: center; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="hall-ticket-print-wrapper">
            ${content.innerHTML}
            <div class="ht-footer">
              <div class="ht-seal">Institutional Seal</div>
              <div class="ht-sign">Authorized Signatory</div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="modal-overlay space-y-8" onClick={onClose}>
      <div className="modal-container ht-premium-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <h2 className="modal-title"><BiIdCard /> Official Hall Ticket</h2>
          <div className="modal-actions">
            {ticket && (
              <button className="btn-icon-action print" onClick={handlePrint} title="Print Ticket">
                <BiPrinter />
              </button>
            )}
            <button className="btn-icon-action close" onClick={onClose} title="Dismiss">
              <BiX />
            </button>
          </div>
        </div>

        {loading && (
          <div className="modal-body-center">
            <div className="spinner"></div>
            <p>Processing Hall Ticket Access...</p>
          </div>
        )}

        {error && !loading && (
          <div className="modal-body-center error">
            <p>{error}</p>
            <button className="btn-retry" onClick={onClose}>Return</button>
          </div>
        )}

        {ticket && !loading && (
          <div className="ht-visual-ticket" ref={printRef}>
            <div className="ht-header">
              <h1>{ticket.schoolName || 'School'}</h1>
              <h2>OFFICIAL HALL TICKET</h2>
            </div>

            <div className="ht-main-content">
              <div className="ht-photo-box">
                <BiUserCircle size={48} />
                <span>Affix Passport<br/>Size Photo</span>
              </div>
              <div className="ht-info-grid">
                <div className="ht-field">
                  <label>Name of Candidate</label>
                  <p>{ticket.studentName}</p>
                </div>
                <div className="ht-field">
                  <label>Enrollment ID</label>
                  <p>{ticket.studentId}</p>
                </div>
                <div className="ht-field">
                  <label>Academic Grade</label>
                  <p>{ticket.standardName} - {ticket.batchName}</p>
                </div>
                <div className="ht-field">
                  <label>Examination Venue</label>
                  <p><BiMapPin /> School Main Block</p>
                </div>
              </div>
            </div>

            <div className="perforation-line"></div>

            <div className="ht-exam-details">
              <div className="ht-info-grid">
                <div className="ht-field">
                  <label>Target Subject</label>
                  <p>{ticket.subjectName}</p>
                </div>
                <div className="ht-field">
                  <label>Examination Level</label>
                  <p>{ticket.examName}</p>
                </div>
                <div className="ht-field">
                  <label>Paper Code / Mode</label>
                  <p>{ticket.examMode || 'Theory'}</p>
                </div>
                <div className="ht-field">
                  <label>Scheduled Date</label>
                  <p><BiCalendarStar /> {formatDate(ticket.examDate)}</p>
                </div>
                <div className="ht-field">
                  <label>Duration & Total</label>
                  <p><BiTimeFive /> {ticket.duration} | {ticket.totalMarks} Marks</p>
                </div>
                <div className="ht-field">
                  <label>Admission Status</label>
                  <p className="ht-status-confirmed">AUTHENTICATED</p>
                </div>
              </div>
            </div>

            <div className="ht-instructions">
              <h4>Candidate Instructions:</h4>
              <ul>
                <li>Please bring a hard copy of this hall ticket to the examination venue.</li>
                <li>Report at least 30 minutes before the scheduled start time.</li>
                <li>Digital devices and unauthorized materials are strictly prohibited.</li>
                <li>Institutional photo ID must be available for verification.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallTicketModal;
