import React, { useState, useEffect } from 'react';
import { BiBookBookmark, BiUser, BiLoaderCircle, BiRefresh } from 'react-icons/bi';
import { getTeacherClasses, getStudentsBySection } from '../../api/api';
import { getAuthValue } from '../../utils/auth';


const Subjects = () => {
  const [subjectsData, setSubjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeacherSubjects = async () => {
    const schoolId = getAuthValue("schoolId");
    const teacherId = getAuthValue("teacherId") || getAuthValue("userId");
    const academicYearId = getAuthValue("academicYearId");

    if (!schoolId || !teacherId || !academicYearId) {
      setError("Missing credentials. Please check your session and log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherClasses({ schoolId, teacherId, academicYearId });
      
      if (res.status === "SUCCESS" && res.data && res.data.classes) {
        const classes = res.data.classes;
        const list = [];
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
        
        let colorIdx = 0;
        classes.forEach(cls => {
          const className = `${cls.standard} - ${cls.divisionName}`;
          cls.subjects.forEach(sub => {
            list.push({
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              description: sub.description || 'No course description available',
              standardId: cls.standardId,
              divisionId: cls.divisionId,
              className: className,
              studentCount: 0,
              loadingStudents: true,
              color: colors[colorIdx % colors.length]
            });
            colorIdx++;
          });
        });

        setSubjectsData(list);
        setLoading(false);

        // Fetch student count for each class division in the background
        const uniqueSections = [];
        list.forEach(item => {
          const key = `${item.standardId}-${item.divisionId}`;
          if (!uniqueSections.find(s => s.key === key)) {
            uniqueSections.push({
              key,
              standardId: item.standardId,
              divisionId: item.divisionId
            });
          }
        });

        const studentCounts = {};
        await Promise.all(
          uniqueSections.map(async (sec) => {
            try {
              const studRes = await getStudentsBySection({
                schoolId,
                academicYearId,
                standardId: sec.standardId,
                divisionId: sec.divisionId
              });
              if (studRes.status === "SUCCESS" && studRes.data) {
                studentCounts[sec.key] = studRes.data.length;
              } else {
                studentCounts[sec.key] = 0;
              }
            } catch (e) {
              console.error(`Failed to fetch student count for section ${sec.key}:`, e);
              studentCounts[sec.key] = 0;
            }
          })
        );

        setSubjectsData(prevList => 
          prevList.map(item => {
            const key = `${item.standardId}-${item.divisionId}`;
            return {
              ...item,
              studentCount: studentCounts[key] || 0,
              loadingStudents: false
            };
          })
        );
      } else {
        setError(res.message || "Failed to load assigned subjects.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading teacher subjects:", err);
      setError("An error occurred while loading your assigned subjects.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherSubjects();
  }, []);

  return (
    <div className="teacher-page-container fade-in space-y-8">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title gradient-text">My Assigned Subjects</h1>
          <p className="page-subtitle">Ongoing courses and student enrollments for the current academic year</p>
        </div>
        <button className="btn-premium-outline flex-center gap-2" onClick={fetchTeacherSubjects} disabled={loading}>
          <BiRefresh /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-center flex-column py-10 gap-3">
          <BiLoaderCircle className="animate-spin text-4xl text-primary" />
          <p className="text-muted">Loading assigned subjects...</p>
        </div>
      ) : error ? (
        <div className="no-results glass-panel py-8">
          <p className="text-danger">{error}</p>
          <button className="btn-premium-primary mt-4" onClick={fetchTeacherSubjects}>Try Again</button>
        </div>
      ) : subjectsData.length === 0 ? (
        <div className="no-results glass-panel py-8">
          <BiBookBookmark size={40} className="text-muted mb-3" />
          <p>No subjects have been assigned to you for the current academic year.</p>
        </div>
      ) : (
        <div className="subjects-grid">
          {subjectsData.map((subject, index) => (
            <div 
              key={`${subject.standardId}-${subject.divisionId}-${subject.subjectId}`} 
              className="subject-card glass hover-lift" 
              style={{ '--card-color': subject.color, animationDelay: `${index * 0.05}s` }}
            >
              <div className="subject-icon">
                <BiBookBookmark />
              </div>
              <h3>{subject.subjectName}</h3>
              <p className="subject-class">{subject.className}</p>
              
              <p className="subject-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', minHeight: '3rem' }}>
                {subject.description}
              </p>

              <div className="subject-stats">
                <div className="stat-item">
                  <BiUser />
                  <span>
                    {subject.loadingStudents ? (
                      <BiLoaderCircle className="animate-spin" />
                    ) : (
                      `${subject.studentCount} Students`
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subjects;
