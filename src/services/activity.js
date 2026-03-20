import { API_URL } from '../config';
const API = API_URL;

/**
 * Fire-and-forget activity logger.
 * Never awaited — never blocks the UI.
 */
export const logActivity = (userId, eventType, data = {}) => {
  if (!userId) return;
  fetch(`${API}/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, event_type: eventType, data })
  }).catch(() => {}); // silent fail — tracking must never break the app
};
