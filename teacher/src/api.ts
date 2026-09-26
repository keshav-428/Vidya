// ─────────────────────────────────────────────────────────────
//  Backend calls.
//
//  Every request carries the teacher's Firebase ID token. The class routes
//  refuse anything else — they read other people's children, so the backend
//  verifies who is asking rather than trusting an id in the body.
// ─────────────────────────────────────────────────────────────
import { auth } from './firebase';

// Prod: VITE_API_BASE points at the Render backend. Dev: /api is proxied
// to localhost:8001 by vite.config.ts.
const BASE = import.meta.env.VITE_API_BASE || '/api';

export interface TeacherClass {
  class_id: string;
  name: string;
  grade: number;
  join_code: string;
  created_at?: string;
  archived?: boolean;
}

export interface RosterStudent {
  student_id: string;
  name: string;
  grade?: number | string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const token = await user.getIdToken();

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    // Surface the backend's own message where it has one — "Not your class"
    // is more useful to act on than "Request failed".
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep the status-code message */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const listClasses = () =>
  request<{ classes: TeacherClass[] }>('/classes').then((d) => d.classes || []);

export const createClass = (name: string, grade: number) =>
  request<TeacherClass>('/classes', {
    method: 'POST',
    body: JSON.stringify({ name, grade }),
  });

export const getClass = (classId: string) =>
  request<TeacherClass>(`/classes/${classId}`);

export const getRoster = (classId: string) =>
  request<{ students: RosterStudent[] }>(`/classes/${classId}/roster`).then((d) => d.students || []);

export interface ReteachItem { key: string; title: string; shaky: number; of: number }
export interface SafeItem { key: string; title: string; of: number }
export interface AttentionItem { student_id: string; name: string; reason: string }

/** What the class needs tomorrow. Aggregated on the server — the browser
 *  never sees a child's record, only counts. */
export interface ClassSummary {
  class_id: string;
  name: string;
  grade: number;
  students: number;
  students_with_data: number;
  reteach: ReteachItem[];
  attention: AttentionItem[];
  safe: SafeItem[];
}

export const getSummary = (classId: string) =>
  request<ClassSummary>(`/classes/${classId}/summary`);

export type StudentState = 'needs_you' | 'no_data' | 'slipping' | 'on_track';

/** One row in the student list: a state and why — deliberately no numbers. */
export interface StudentRow {
  student_id: string;
  name: string;
  state: StudentState;
  reason: string;
}

export interface WeakSkill { key: string; title: string; percent: number }

/** One student, where the numbers are allowed to live. */
export interface StudentDetail {
  student_id: string;
  name: string;
  state: StudentState;
  reason: string;
  skills_with_evidence: number;
  idle_days: number;
  weak: WeakSkill[];
}

export const getStudents = (classId: string) =>
  request<{ students: StudentRow[] }>(`/classes/${classId}/students`).then((d) => d.students || []);

export const getStudent = (classId: string, studentId: string) =>
  request<StudentDetail>(`/classes/${classId}/students/${studentId}`);
