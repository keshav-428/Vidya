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

// ── Setting practice ─────────────────────────────────────────
export interface Assignment {
  assignment_id: string;
  title: string;
  chapter_id: string;
  section: string | null;
  created_at: string;
  for_whole_class: boolean;
  done: number;
  of: number;
}

export const setPractice = (classId: string, chapterId: string, section: string | null,
                            title: string, studentIds?: string[]) =>
  request<{ assignment_id: string }>(`/classes/${classId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ chapter_id: chapterId, section, title, student_ids: studentIds || null }),
  });

export const getAssignments = (classId: string) =>
  request<{ assignments: Assignment[] }>(`/classes/${classId}/assignments`).then((d) => d.assignments || []);

// ── Invitations ──────────────────────────────────────────────
export interface PendingInvite { invite_id: string; student_name: string; created_at: string }

export const inviteStudent = (classId: string, vidyaId: string) =>
  request<{ invite_id: string; student_name?: string }>(`/classes/${classId}/invites`, {
    method: 'POST',
    body: JSON.stringify({ vidya_id: vidyaId }),
  });

export const getInvites = (classId: string) =>
  request<{ invites: PendingInvite[] }>(`/classes/${classId}/invites`).then((d) => d.invites || []);

/** A skill key ("g6-fractions::7.2") split for the assignment call. */
export const splitKey = (key: string): { chapterId: string; section: string | null } => {
  const i = key.indexOf('::');
  return i === -1 ? { chapterId: key, section: null } : { chapterId: key.slice(0, i), section: key.slice(i + 2) };
};

// ── Home: the classes, with the two numbers a home screen earns ──
export interface ClassOverview extends TeacherClass {
  student_count: number;
  needs_count: number;
}
export const getClassesOverview = () =>
  request<{ classes: ClassOverview[] }>('/classes-overview').then((d) => d.classes || []);

// ── One student, in full ─────────────────────────────────────
export interface StudentAssignment {
  assignment_id: string;
  title: string;
  created_at: string;
  just_them: boolean;
  done: boolean;
}
export interface RecentQuiz { topic: string; score: number; total: number; when: string }

export interface StudentReport extends StudentDetail {
  trajectory?: Trajectory;
  chapters_touched: number;
  chapters_practised: number;
  quizzes_completed: number;
  recent_quizzes: RecentQuiz[];
  teach_today: { key: string; title: string; percent: number } | null;
  assignments: StudentAssignment[];
}

export const getStudentReport = (classId: string, studentId: string) =>
  request<StudentReport>(`/classes/${classId}/students/${studentId}/report`);

// ── How to teach it ──────────────────────────────────────────
export interface BoardStep { title: string; write: string; say: string }
export interface TeachingGuide {
  misconception: string;
  opening: string;
  board: BoardStep[];
  check: { ask: string; answer: string; wrong_if: string };
  watch_for: string[];
}

export const getTeachingGuide = (args: {
  topic: string; grade: number; chapterId?: string | null; section?: string | null;
  classId?: string; shaky?: number; of?: number;
}) =>
  request<TeachingGuide>('/teaching-guide', {
    method: 'POST',
    body: JSON.stringify({
      topic: args.topic,
      grade: args.grade,
      chapter_id: args.chapterId || null,
      section: args.section || null,
      class_id: args.classId || null,
      shaky: args.shaky || 0,
      of: args.of || 0,
    }),
  });

// ── Performance over time ────────────────────────────────────
export interface MovedTopic {
  key: string; title: string;
  solid_then: number; of_then: number;
  solid_now: number; of_now: number;
  gained: number;
}
export interface Movement {
  has_history: boolean;
  weeks_ago: number;
  students_then: number;
  topics: MovedTopic[];
}
export const getMovement = (classId: string) =>
  request<Movement>(`/classes/${classId}/movement`);

export interface Outcome extends Assignment { moved_up: number; has_before: boolean }
export const getOutcomes = (classId: string) =>
  request<{ assignments: Outcome[] }>(`/classes/${classId}/outcomes`).then((d) => d.assignments || []);

export type TrajectoryWord = 'improving' | 'steady' | 'slipping' | 'not_practising';
export interface Trajectory { word: TrajectoryWord; since: string | null; facts: string[] }

export interface ParentNote {
  name: string;
  doing_well: string;
  needs_work: string;
  at_home: string;
  basis: string;
}
export const getParentNote = (classId: string, studentId: string, language = 'English') =>
  request<ParentNote>(`/classes/${classId}/students/${studentId}/parent-note`, {
    method: 'POST',
    body: JSON.stringify({ language }),
  });
