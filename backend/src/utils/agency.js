/**
 * Multi-Agency Workspace Helper
 * Extracts the tenant/agency ID for any user in the system.
 * 
 * Rules:
 * - If user already has agencyId or agency_id: return it.
 * - If user is an admin / founder: their agency ID is their own user ID.
 * - If user is a team member: their agency ID is their created_by (the admin who added them).
 * - Fallback: user.id
 */
function getAgencyId(user) {
  if (!user) return null;
  if (user.agencyId) return user.agencyId;
  if (user.agency_id) return user.agency_id;
  if (user.role === 'admin') return user.id;
  if (user.createdBy || user.created_by) return user.createdBy || user.created_by;
  return user.id;
}

module.exports = {
  getAgencyId,
};
