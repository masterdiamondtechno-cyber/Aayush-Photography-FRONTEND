import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BiBusSchool, BiPhoneCall, BiErrorCircle } from 'react-icons/bi';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom bus icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// A dummy route in Pune around a school
const ROUTE_POINTS = [
  [18.5204, 73.8567], // Start
  [18.5215, 73.8580],
  [18.5230, 73.8595],
  [18.5250, 73.8610],
  [18.5270, 73.8630], // End / School
];

const BusTracker = () => {
  const [positionIndex, setPositionIndex] = useState(0);
  const [eta, setEta] = useState(15); // minutes
  
  // Simulate bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPositionIndex((prev) => {
        if (prev < ROUTE_POINTS.length - 1) {
          setEta((old) => Math.max(1, old - 3));
          return prev + 1;
        }
        return prev;
      });
    }, 5000); // moves every 5 seconds for simulation
    
    return () => clearInterval(interval);
  }, []);

  const currentPos = ROUTE_POINTS[positionIndex];
  const isArrived = positionIndex === ROUTE_POINTS.length - 1;

  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <div className="flex-between mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Live Bus Tracker</h1>
          <p className="text-muted">Tracking Vehicle: MH-12-AB-1234 (Route 4)</p>
        </div>
        <div className={`px-2 py-1 round text-white font-bold flex-center gap-05 ${isArrived ? 'bg-success' : 'bg-primary'}`}>
          {isArrived ? 'Arrived at School' : 'In Transit'}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: '1.5rem', height: 'calc(100vh - 180px)' }}>
        {/* Map Area */}
        <div className="card shadow-sm overflow-hidden" style={{ borderRadius: '1rem', border: '2px solid #e2e8f0', zIndex: 0, padding: 0 }}>
          <MapContainer 
            center={ROUTE_POINTS[0]} 
            zoom={15} 
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {ROUTE_POINTS.map((pos, idx) => (
              <Marker key={idx} position={pos} opacity={0.4} />
            ))}
            <Marker position={currentPos} icon={busIcon}>
              <Popup>
                <strong>School Bus 4</strong><br/>
                Speed: 35 km/h
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Sidebar Info */}
        <div className="flex-column gap-1-5">
          <div className="card shadow-sm padding-1-5 text-center" style={{ background: isArrived ? '#dcfce7' : 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', color: isArrived ? '#15803d' : 'white' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{isArrived ? 'Status' : 'Estimated Arrival'}</h3>
            <h1 style={{ fontSize: '3rem', margin: '0' }}>{isArrived ? 'Safe' : `${eta} m`}</h1>
            {!isArrived && <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Normal Traffic Conditions</p>}
          </div>

          <div className="card shadow-sm padding-1-5">
            <h3 className="border-bottom pb-1 mb-1" style={{ margin: 0, color: 'var(--text-dark)' }}>Driver Details</h3>
            <div className="flex-center gap-1 mt-1" style={{ justifyContent: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0' }} />
              <div>
                <p className="font-bold" style={{ margin: 0, color: 'var(--text-dark)' }}>Ramesh Kumar</p>
                <p className="text-muted text-sm" style={{ margin: 0 }}>Experience: 8 Years</p>
              </div>
            </div>
            <button className="btn w-100 flex-center gap-05 mt-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: 'var(--text-dark)' }}>
              <BiPhoneCall size={18} color="var(--primary)" /> Call Driver
            </button>
          </div>

          <div className="card shadow-sm padding-1-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div className="flex-center gap-05" style={{ color: '#d97706', marginBottom: '0.5rem' }}>
              <BiErrorCircle size={20} /> <h3 style={{ margin: 0 }}>SOS / Emergency</h3>
            </div>
            <p className="text-sm" style={{ color: '#b45309', margin: 0 }}>If the bus deviates from its route or you cannot reach the driver, contact school transport admin immediately.</p>
            <button className="btn w-100 mt-1 font-bold" style={{ background: '#ef4444', color: 'white' }}>Report Issue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusTracker;
