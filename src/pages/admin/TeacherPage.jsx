

export default function TeacherPage() {

  const teachers = [
    { id: 1, name: "Mr. Sharma", subject: "Math", email: "sharma@gmail.com" },
    { id: 2, name: "Mrs. Patil", subject: "Science", email: "patil@gmail.com" },
  ];

  return (
    <div className="page-container space-y-8">
      <h2 className="page-title">Teachers</h2>

      <div className="card-container">
        {teachers.map((teacher) => (
          <div className="card" key={teacher.id}>
            <div className="avatar">
              {teacher.name.charAt(0)}
            </div>

            <h3>{teacher.name}</h3>
            <p><strong>Subject:</strong> {teacher.subject}</p>
            <p>{teacher.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}