export const ADMIN_ROLES = ['ADMIN', 'APPROVAL', 'MODERATOR'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role || '').toUpperCase());
}
