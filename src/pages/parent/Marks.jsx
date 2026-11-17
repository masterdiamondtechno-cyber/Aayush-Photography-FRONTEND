import React from 'react';
import { BiTrophy, BiTrendingUp } from 'react-icons/bi';

const ParentMarks = () => {
  const marksData = [
    { subject: 'Mathematics', score: 95, total: 100, grade: 'A+', average: 75 },
    { subject: 'Science', score: 88, total: 100, grade: 'A', average: 78 },
    { subject: 'English', score: 92, total: 100, grade: 'A', average: 82 },
    { subject: 'History', score: 85, total: 100, grade: 'B+', average: 70 },
  ];

  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <div className="flex-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Academic Progress</h1>
        <select className="form-control" style={{ width: 'auto' }}>
          <option>Term 2 (Current)</option>
          <option>Term 1</option>
        </select>
      </div>

      <div className="card shadow-sm padding-1-5 mb-2 flex-between" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', color: 'white' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Term 2 Standing: Distinction</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>Your ward is performing in the top 10% of their class.</p>
        </div>
        <BiTrophy size={64} style={{ opacity: 0.8 }} />
      </div>

      <div className="card shadow-sm table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Score / Total</th>
              <th>Grade</th>
              <th>Class Average</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {marksData.map((m, idx) => (
              <tr key={idx}>
                <td className="font-bold">{m.subject}</td>
                <td>{m.score} / {m.total}</td>
                <td className="font-bold" style={{ color: 'var(--primary)' }}>{m.grade}</td>
                <td className="text-muted">{m.average}</td>
                <td>
                  <span className="px-2 py-1 round text-white text-sm" style={{ background: m.score >= 40 ? '#10b981' : '#ef4444' }}>
                    {m.score >= 40 ? 'Pass' : 'Fail'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentMarks;
