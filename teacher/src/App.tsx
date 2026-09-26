// ─────────────────────────────────────────────────────────────
//  Three screens, held in state. No router yet: there is one path
//  through this app (sign in → your classes → one class), and a router
//  would be more moving parts than that earns.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import SignIn from './screens/SignIn';
import Classes from './screens/Classes';
import ClassDetail from './screens/ClassDetail';
import type { TeacherClass } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<TeacherClass | null>(null);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    // Fires once with the restored session, then on every sign in/out.
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);

  if (!ready) return <div className="wrap"><div className="empty">Loading…</div></div>;
  if (!user) return <SignIn />;

  if (open) return <ClassDetail klass={open} onBack={() => setOpen(null)} />;

  return (
    <Classes
      teacherName={user.displayName || ''}
      onOpen={setOpen}
      onSignOut={() => { if (auth) signOut(auth); }}
    />
  );
}
