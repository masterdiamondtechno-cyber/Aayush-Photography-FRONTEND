import React from 'react';
import { BiUserPlus, BiShieldQuarter } from 'react-icons/bi';
import { MOCK_DIRECTORS } from '../../data/mockData';

const OwnerDirectors = () => {
  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <div className="flex-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Global Authorities & Directors</h1>
        <button className="btn btn-primary-gradient flex-center gap-05"><BiUserPlus /> Assign New Auth</button>
      </div>

      <div className="card shadow-sm table-responsive">
        <div className="padding-1-5 border-bottom bg-light">
           <p className="text-muted text-sm m-0">Manage high-level administrators who have cross-branch or dedicated Principal access to individual schools.</p>
        </div>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Director Name</th>
              <th>Contact Email</th>
              <th>Assigned Role</th>
              <th>Governing Branch(es)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DIRECTORS.map(dir => (
              <tr key={dir.id}>
                <td className="font-bold flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                  <div className="bg-primary text-white round flex-center" style={{ width: 32, height: 32 }}>{dir.name.charAt(0)}</div>
                  {dir.name}
                </td>
                <td>{dir.email}</td>
                <td>
                   <span className="border px-2 py-1 round text-sm font-bold flex-center gap-05" style={{ display: 'inline-flex', color: 'var(--primary)' }}>
                     <BiShieldQuarter /> {dir.role}
                   </span>
                </td>
                <td className="font-bold">{dir.branches}</td>
                <td>
                  <span className="bg-success text-white px-2 py-1 round text-sm">
                    {dir.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline-primary text-sm">Modify Access</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerDirectors;
