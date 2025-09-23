// Simple authentication for moderation
const MODERATOR_KEY = 'crisis-moderator-key'; // In production, use environment variable

export function checkModeratorAccess(): boolean {
  const storedKey = localStorage.getItem('moderatorKey');
  return storedKey === MODERATOR_KEY;
}

export function promptForModeratorKey(): boolean {
  const key = prompt('Enter moderator access key:');
  if (key === MODERATOR_KEY) {
    localStorage.setItem('moderatorKey', key);
    return true;
  }
  alert('Invalid moderator key');
  return false;
}

export function getModeratorHeaders() {
  const key = localStorage.getItem('moderatorKey');
  return key ? { 'x-moderator-key': key } : {};
}

export function clearModeratorAccess() {
  localStorage.removeItem('moderatorKey');
}