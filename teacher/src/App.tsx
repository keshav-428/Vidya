// ─────────────────────────────────────────────────────────────
//  The funnel, held in state. Each step narrows:
//
//    classes → one class → students → one student
//                       ↘ practice set
//                       ↘ add students
//
//  No router yet: there is one path through this app, and a router
//  would be more moving parts than that earns.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import SignIn from './screens/SignIn';
import Classes from './screens/Classes';
import ClassDetail from './screens/ClassDetail';
import StudentList from './screens/StudentList';
import StudentDetail from './screens/StudentDetail';
import AddStudents from './screens/AddStudents';
import Assignments from './screens/Assignments';
import type { StudentRow, TeacherClass } from './api';

type View = 'class' | 'students' | 'add' | 'assignments';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<TeacherClass | null>(null);
  const [view, setView] = useState<View>('class');
  const [student, setStudent] = useState<StudentRow | null>(null);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    // Fires once with the restored session, then on every sign in/out.
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);

  // Opening a class always starts AT the class, never wherever the last
  // visit happened to end.
  const openClass = (c: TeacherClass) => { setStudent(null); setView('class'); setOpen(c); };
  const closeClass = () => { setStudent(null); setView('class'); setOpen(null); };

  if (!ready) return <div className="wrap"><div className="empty">Loading…</div></div>;
  if (!user) return <SignIn />;

  if (open && student) {
    return (
      <StudentDetail klass={open} studentId={student.student_id} name={student.name}
        onBack={() => setStudent(null)} />
    );
  }

  if (open && view === 'students') {
    return <StudentList klass={open} onBack={() => setView('class')} onOpen={setStudent} />;
  }
  if (open && view === 'add') {
    return <AddStudents klass={open} onBack={() => setView('class')} />;
  }
  if (open && view === 'assignments') {
    return <Assignments klass={open} onBack={() => setView('class')} />;
  }
  if (open) {
    return (
      <ClassDetail klass={open}
        onBack={closeClass}
        onStudents={() => setView('students')}
        onAdd={() => setView('add')}
        onAssignments={() => setView('assignments')} />
    );
  }

  return (
    <Classes
      teacherName={user.displayName || ''}
      onOpen={openClass}
      onSignOut={() => { if (auth) signOut(auth); }}
    />
  );
}
