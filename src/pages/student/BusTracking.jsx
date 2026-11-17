import { useState, useEffect } from 'react';
import { BiMap, BiBus, BiTime, BiPhone, BiUser, BiCurrentLocation, BiCheckCircle, BiInfoCircle } from 'react-icons/bi';
import { useStudentSearch } from '../../contexts/StudentSearchContext';

const MOCK_BUS_DATA = {
  busNumber: 'BUS-07',
  routeName: 'Route 7 – Green Park → School',
  driverName: 'Rajesh Kumar',
  driverPhone: '+91 98765 43210',
  conductorName: 'Suresh Yadav',
  vehicleNo: 'UP 32 AB 1234',
  capacity: 42,
  currentOccupancy: 35,
  estimatedArrival: '8:15 AM',
  status: 'On Route',
  lastUpdated: '2 min ago',
  stops: [
    { name: 'Green Park Colony', time: '7:30 AM', status: 'passed', distance: '0 km' },
    { name: 'Shanti Nagar', time: '7:38 AM', status: 'passed', distance: '2.1 km' },
    { name: 'MG Road Crossing', time: '7:45 AM', status: 'passed', distance: '4.3 km' },
    { name: 'Laxmi Chowk', time: '7:52 AM', status: 'current', distance: '6.0 km' },
    { name: 'Civil Lines', time: '8:00 AM', status: 'upcoming', distance: '7.8 km' },
    { name: 'Railway Station', time: '8:08 AM', status: 'upcoming', distance: '9.5 km' },
    { name: 'School Campus', time: '8:15 AM', status: 'upcoming', distance: '11.2 km' },
  ],
};

const StudentBusTracking = () => {
  const [bus] = useState(MOCK_BUS_DATA);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { searchQuery } = useStudentSearch();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const passedStops = bus.stops.filter(s => s.status === 'passed').length;
  const progress = ((passedStops + 0.5) / bus.stops.length) * 100;

  // Filter stops by navbar search
  const busSearchLower = (searchQuery || '').toLowerCase();
  const filteredStops = busSearchLower
    ? bus.stops.filter(s => s.name.toLowerCase().includes(busSearchLower))
    : bus.stops;

  const getStatusColor = (status) => {
    if (status === 'On Route') return '#10b981';
    if (status === 'Delayed') return '#f59e0b';
    if (status === 'Arrived') return '#6C5CE7';
    return '#64748b';
  };

  return (
    <div className="bt-page fade-in space-y-8">
      <div className="header-section">
        <h1>Bus Tracking</h1>
        <p className="bt-breadcrumb">Transport &gt; Live Bus Tracking</p>
      </div>

      {/* Status Banner */}
      <div className="bt-status-banner" style={{ borderLeftColor: getStatusColor(bus.status) }}>
        <div className="bt-status-left">
          <div className="bt-bus-icon-lg">
            <BiBus size={28} />
          </div>
          <div>
            <h2 className="bt-bus-number">{bus.busNumber}</h2>
            <p className="bt-route-name">{bus.routeName}</p>
          </div>
        </div>
        <div className="bt-status-right">
          <span className="bt-live-badge" style={{ background: `${getStatusColor(bus.status)}15`, color: getStatusColor(bus.status), borderColor: `${getStatusColor(bus.status)}40` }}>
            <span className="bt-live-dot" style={{ background: getStatusColor(bus.status) }}></span>
            {bus.status}
          </span>
          <span className="bt-updated">Updated {bus.lastUpdated}</span>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="bt-cards-grid">
        <div className="bt-info-card">
          <div className="bt-card-icon" style={{ background: 'rgba(108,92,231,0.1)', color: '#6C5CE7' }}><BiTime size={22} /></div>
          <div>
            <span className="bt-card-label">ETA to School</span>
            <span className="bt-card-value">{bus.estimatedArrival}</span>
          </div>
        </div>
        <div className="bt-info-card">
          <div className="bt-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><BiCurrentLocation size={22} /></div>
          <div>
            <span className="bt-card-label">Current Stop</span>
            <span className="bt-card-value">{bus.stops.find(s => s.status === 'current')?.name || 'N/A'}</span>
          </div>
        </div>
        <div className="bt-info-card">
          <div className="bt-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><BiBus size={22} /></div>
          <div>
            <span className="bt-card-label">Occupancy</span>
            <span className="bt-card-value">{bus.currentOccupancy}/{bus.capacity} seats</span>
          </div>
        </div>
        <div className="bt-info-card">
          <div className="bt-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><BiMap size={22} /></div>
          <div>
            <span className="bt-card-label">Vehicle No.</span>
            <span className="bt-card-value">{bus.vehicleNo}</span>
          </div>
        </div>
      </div>

      <div className="bt-main-grid">
        {/* Route Timeline */}
        <div className="bt-timeline-card">
          <div className="bt-section-header">
            <h3><BiMap /> Route Progress</h3>
            <span className="bt-progress-text">{passedStops}/{bus.stops.length} stops</span>
          </div>
          <div className="bt-progress-bar-container">
            <div className="bt-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="bt-timeline">
            {filteredStops.map((stop, i) => (
              <div key={i} className={`bt-stop ${stop.status}`}>
                <div className="bt-stop-marker">
                  {stop.status === 'passed' ? <BiCheckCircle size={18} /> :
                   stop.status === 'current' ? <BiCurrentLocation size={18} /> :
                   <div className="bt-stop-dot"></div>}
                </div>
                <div className="bt-stop-line"></div>
                <div className="bt-stop-info">
                  <span className="bt-stop-name">{stop.name}</span>
                  <div className="bt-stop-meta">
                    <span><BiTime size={12} /> {stop.time}</span>
                    <span>{stop.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver & Contact */}
        <div className="bt-details-col">
          <div className="bt-contact-card">
            <h3 className="bt-section-title"><BiUser /> Driver Details</h3>
            <div className="bt-contact-row">
              <img src={`https://ui-avatars.com/api/?name=${bus.driverName}&size=44&background=5d5fef&color=fff`} alt="" className="bt-avatar" />
              <div>
                <span className="bt-contact-name">{bus.driverName}</span>
                <span className="bt-contact-role">Driver</span>
              </div>
              <a href={`tel:${bus.driverPhone}`} className="bt-call-btn" title="Call Driver">
                <BiPhone size={18} />
              </a>
            </div>
            <div className="bt-contact-row">
              <img src={`https://ui-avatars.com/api/?name=${bus.conductorName}&size=44&background=10b981&color=fff`} alt="" className="bt-avatar" />
              <div>
                <span className="bt-contact-name">{bus.conductorName}</span>
                <span className="bt-contact-role">Conductor</span>
              </div>
              <a href="tel:+919876543211" className="bt-call-btn" title="Call Conductor">
                <BiPhone size={18} />
              </a>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bt-tips-card">
            <h3 className="bt-section-title"><BiInfoCircle /> Safety Tips</h3>
            <ul className="bt-tips-list">
              <li>Always wait at your designated bus stop</li>
              <li>Board and exit only when bus has stopped</li>
              <li>Keep your ID card visible at all times</li>
              <li>Contact driver if running late</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .bt-page { animation: fadeIn 0.5s ease; }
        .bt-breadcrumb { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }

        .bt-status-banner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: #fff; padding: 1.5rem 2rem; border-radius: 16px; border-left: 5px solid #10b981; box-shadow: 0 1px 6px rgba(0,0,0,0.06); margin: 1.5rem 0; }
        .bt-status-left { display: flex; align-items: center; gap: 1rem; }
        .bt-bus-icon-lg { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #5d5fef, #7000ff); color: #fff; display: flex; align-items: center; justify-content: center; }
        .bt-bus-number { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin: 0; }
        .bt-route-name { font-size: 0.85rem; color: #64748b; margin: 0.15rem 0 0; }
        .bt-status-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; }
        .bt-live-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.85rem; border-radius: 2rem; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid; }
        .bt-live-dot { width: 8px; height: 8px; border-radius: 50%; animation: btPulse 1.5s infinite; }
        .bt-updated { font-size: 0.72rem; color: #94a3b8; }

        @keyframes btPulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.4); } }

        .bt-cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .bt-info-card { display: flex; align-items: center; gap: 0.85rem; background: #fff; padding: 1.15rem 1.25rem; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
        .bt-info-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .bt-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bt-card-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; display: block; }
        .bt-card-value { font-size: 0.95rem; font-weight: 700; color: #1e293b; display: block; margin-top: 0.15rem; }

        .bt-main-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; }

        .bt-timeline-card { background: #fff; border-radius: 16px; padding: 1.75rem; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
        .bt-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .bt-section-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; }
        .bt-progress-text { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .bt-progress-bar-container { width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; margin-bottom: 1.5rem; overflow: hidden; }
        .bt-progress-bar { height: 100%; background: linear-gradient(90deg, #5d5fef, #10b981); border-radius: 3px; transition: width 0.8s ease; }

        .bt-timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
        .bt-stop { display: flex; align-items: flex-start; gap: 1rem; position: relative; padding-bottom: 1.25rem; }
        .bt-stop:last-child { padding-bottom: 0; }
        .bt-stop:last-child .bt-stop-line { display: none; }

        .bt-stop-marker { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1; background: #f1f5f9; color: #94a3b8; }
        .bt-stop.passed .bt-stop-marker { background: rgba(16,185,129,0.15); color: #10b981; }
        .bt-stop.current .bt-stop-marker { background: linear-gradient(135deg, #5d5fef, #7000ff); color: #fff; box-shadow: 0 0 0 4px rgba(93,95,239,0.2); animation: btPulse 2s infinite; }
        .bt-stop.upcoming .bt-stop-marker { background: #f8fafc; border: 2px dashed #cbd5e1; }
        .bt-stop-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }

        .bt-stop-line { position: absolute; left: 13px; top: 28px; bottom: 0; width: 2px; z-index: 0; }
        .bt-stop.passed .bt-stop-line { background: #10b981; }
        .bt-stop.current .bt-stop-line { background: linear-gradient(to bottom, #5d5fef, #e2e8f0); }
        .bt-stop.upcoming .bt-stop-line { background: #e2e8f0; border-left: 2px dashed #cbd5e1; width: 0; }

        .bt-stop-info { flex: 1; }
        .bt-stop-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
        .bt-stop.passed .bt-stop-name { color: #64748b; }
        .bt-stop.current .bt-stop-name { color: #5d5fef; font-weight: 700; }
        .bt-stop-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; }
        .bt-stop-meta span { display: flex; align-items: center; gap: 0.25rem; }

        .bt-details-col { display: flex; flex-direction: column; gap: 1.25rem; }
        .bt-contact-card, .bt-tips-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
        .bt-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
        .bt-contact-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .bt-contact-row:last-child { border-bottom: none; padding-bottom: 0; }
        .bt-avatar { width: 44px; height: 44px; border-radius: 12px; }
        .bt-contact-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; display: block; }
        .bt-contact-role { font-size: 0.75rem; color: #94a3b8; }
        .bt-call-btn { margin-left: auto; width: 38px; height: 38px; border-radius: 10px; background: rgba(16,185,129,0.1); color: #10b981; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: 0.2s; }
        .bt-call-btn:hover { background: #10b981; color: #fff; }

        .bt-tips-list { list-style: none; padding: 0; margin: 0; }
        .bt-tips-list li { font-size: 0.82rem; color: #475569; padding: 0.5rem 0 0.5rem 1.25rem; position: relative; border-bottom: 1px solid #f8fafc; }
        .bt-tips-list li::before { content: '•'; position: absolute; left: 0; color: #6C5CE7; font-weight: 900; font-size: 1.1rem; }
        .bt-tips-list li:last-child { border-bottom: none; }

        @media (max-width: 1024px) { .bt-cards-grid { grid-template-columns: repeat(2, 1fr); } .bt-main-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .bt-cards-grid { grid-template-columns: 1fr; } .bt-status-banner { flex-direction: column; align-items: flex-start; } .bt-status-right { align-items: flex-start; } }
      `}</style>
    </div>
  );
};

export default StudentBusTracking;
