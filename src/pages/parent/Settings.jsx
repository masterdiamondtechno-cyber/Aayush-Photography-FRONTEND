import React from 'react';

const ParentSettings = () => {
  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>Account Settings</h1>
      
      <div className="grid gap-2" style={{ maxWidth: '800px' }}>
        <div className="card shadow-sm padding-1-5">
          <h3 className="border-bottom pb-1 mb-1">Contact Information</h3>
          <div className="grid gap-1">
             <div className="form-group">
               <label className="text-sm font-bold">Guardian Email</label>
               <input type="email" className="form-control" defaultValue="parent@school.com" />
             </div>
             <div className="form-group">
               <label className="text-sm font-bold">Emergency Phone</label>
               <input type="text" className="form-control" defaultValue="+91 98765 43210" />
             </div>
             <button className="btn btn-primary mt-1" style={{ width: 'fit-content' }}>Save Contact Info</button>
          </div>
        </div>

        <div className="card shadow-sm padding-1-5">
          <h3 className="border-bottom pb-1 mb-1">Live Notifications</h3>
          <div className="flex-column gap-1">
             <label className="flex-center gap-05 items-center" style={{ justifyContent: 'flex-start' }}>
               <input type="checkbox" defaultChecked /> SMS when Ward Boards Bus
             </label>
             <label className="flex-center gap-05 items-center" style={{ justifyContent: 'flex-start' }}>
               <input type="checkbox" defaultChecked /> SMS when Ward Reaches School
             </label>
             <label className="flex-center gap-05 items-center" style={{ justifyContent: 'flex-start' }}>
               <input type="checkbox" defaultChecked /> Email on Exam Mark Publications
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSettings;
