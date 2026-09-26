// ─────────────────────────────────────────────────────────────
//  The shape, held in state.
//
//    classes ─▶ a class ─┬─ Today      (one thing to do) ─▶ Topics
//                        ├─ Students   ─▶ one student
//                        ├─ Practice
//                        └─ Class      (code, invites, roster)
//
//  Tabs sit INSIDE a class because everything here belongs to one
//  class; a global tab bar would have had one real destination. The
//  profile chip is top right on every screen, as in the student app.
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
import Topics from './screens/Topics';
import Profile from './screens/Profile';
import { TabBar, type Tab } from './ui/Chrome';
import type { StudentRow, TeacherClass } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<TeacherClass | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  // Pushed over a tab, and dismissed back onto it.
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [topics, setTopics] = useState(false);
  const [profile, setProfile] = useState(false);
  const [classCount, setClassCount] = useState(0);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    // Fires once with the restored session, then on every sign in/out.
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);

  const name = user?.displayName || '';
  const showProfile = () => setProfile(true);

  // Opening a class always starts at Today, never wherever the last visit
  // happened to end.
  const openClass = (c: TeacherClass) => {
    setStudent(null); setTopics(false); setTab('today'); setOpen(c);
  };
  const leaveClass = () => { setStudent(null); setTopics(false); setOpen(null); };

  if (!ready) return <div className="wrap"><div className="empty">Loading…</div></div>;
  if (!user) return <SignIn />;

  if (profile) {
    return (
      <Profile name={name} email={user.email || ''} classCount={classCount}
        onBack={() => setProfile(false)}
        onSignOut={() => { if (auth) signOut(auth); setProfile(false); }} />
    );
  }

  if (!open) {
    return (
      <Classes teacherName={name} onOpen={openClass} onProfile={showProfile}
        onCount={setClassCount} />
    );
  }

  // ── Pushed screens: no tabs, they are one level deeper ──
  if (student) {
    return (
      <StudentDetail klass={open} studentId={student.student_id} name={student.name}
        onBack={() => setStudent(null)} onProfile={showProfile} teacherName={name} />
    );
  }
  if (topics) {
    return <Topics klass={open} onBack={() => setTopics(false)} onProfile={showProfile} teacherName={name} />;
  }

  // ── The four tabs ──
  const chrome = { onBack: leaveClass, onProfile: showProfile, teacherName: name };
  return (
    <>
      {tab === 'today' && <ClassDetail klass={open} onTopics={() => setTopics(true)}
        onStudents={() => setTab('students')} {...chrome} />}
      {tab === 'students' && <StudentList klass={open} onOpen={setStudent} {...chrome} />}
      {tab === 'practice' && <Assignments klass={open} {...chrome} />}
      {tab === 'class' && <AddStudents klass={open} {...chrome} />}
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
