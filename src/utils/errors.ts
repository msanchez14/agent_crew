const ERROR_MAP: Record<string, string> = {
  'stop the team before deleting': 'You must stop the team before deleting it.',
  'team is already running': 'This team is already running.',
  'team is already stopped': 'This team is already stopped.',
  'team is currently deploying': 'This team is currently deploying. Please wait.',
  'team must be running to chat': 'The team must be running before you can send messages.',
  'message is required': 'Please enter a message before sending.',
  'name is required': 'A name is required.',
  'team not found': 'Team not found. It may have been deleted.',
  'agent not found': 'Agent not found. It may have been removed.',
  'team is not running': 'The team must be running to read or edit agent instructions.',
  'agent is not running': 'The agent must be running to read or edit its instructions.',
  'team name already exists': 'A team with that name already exists. Please choose a different name.',
  'invalid credentials': 'Invalid email or password. Please try again.',
  'invalid email or password': 'Invalid email or password. Please try again.',
  'email already registered': 'An account with this email already exists.',
  'email already exists': 'An account with this email already exists.',
  'session expired': 'Your session has expired. Please sign in again.',
  'invite not found': 'This invite link is invalid or has already been used.',
  'invite expired': 'This invite link has expired. Please request a new one.',
  'invite already used': 'This invite link has already been used.',
  'registration disabled': 'Registration is currently disabled.',
  'organization name is required': 'Please enter an organization name.',
  'password too short': 'Password must be at least 8 characters.',
  'password must be at least': 'Password must be at least 8 characters.',
  'password too weak': 'Password must contain uppercase, lowercase, and a digit.',
  'current password is incorrect': 'The current password you entered is incorrect.',
  'wrong password': 'The current password you entered is incorrect.',
  'already a member of this organization': 'This user is already a member of the organization.',
  'active invite already exists': 'An active invite already exists for this email.',
  'already registered in another organization': 'This email is already registered in another organization.',
};

/**
 * Converts a raw API error message into a user-friendly string.
 * Falls back to a generic message if the error is unrecognized.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (!raw) return fallback;

  const lower = raw.toLowerCase().trim();
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly;
  }

  // If the message looks like raw JSON or a status code, use fallback
  if (raw.startsWith('{') || raw.startsWith('Request failed:')) return fallback;

  // Otherwise the message is already human-readable enough
  return raw;
}
