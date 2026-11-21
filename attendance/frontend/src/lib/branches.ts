export type BranchId = 'NAGARBHAVI' | 'RR_NAGAR';

export interface BranchInfo {
  id: BranchId;
  name: string;
  shortName: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadius: number; // meters
}

export const BRANCHES: Record<BranchId, BranchInfo> = {
  NAGARBHAVI: {
    id: 'NAGARBHAVI',
    name: 'New Duke & Duchess - Nagarbhavi',
    shortName: 'Nagarbhavi',
    address: '1st Floor, Abhiman Arcade, Muddenapalya Main Rd, near Ayodhya Samrat Hotel, Nagarbhavi, Bengaluru 560072',
    latitude: 12.968489,
    longitude: 77.501320,
    allowedRadius: 50,
  },
  RR_NAGAR: {
    id: 'RR_NAGAR',
    name: 'New Duke & Duchess - RR Nagar',
    shortName: 'RR Nagar',
    address: 'Rajarajeshwari Nagar (RR Nagar), Bengaluru 560098',
    latitude: 12.913956,
    longitude: 77.507265,
    allowedRadius: 50,
  },
};

export const BRANCH_LIST: BranchInfo[] = Object.values(BRANCHES);

// Haversine distance in meters
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Checks employee's location against their assigned branch (or both branches).
 * If within 50m of assigned branch -> verified at assigned branch.
 * If outside assigned but within 50m of other branch -> verified at other branch.
 * If outside both -> rejected with distance to closest branch.
 */
export function verifyEmployeeGeofence(
  latitude: number,
  longitude: number,
  assignedBranchId: BranchId = 'NAGARBHAVI'
): {
  isAllowed: boolean;
  matchedBranch: BranchInfo;
  distance: number;
  allowedRadius: number;
  closestBranch: BranchInfo;
  minDistance: number;
} {
  const assigned = BRANCHES[assignedBranchId] || BRANCHES.NAGARBHAVI;
  const distToAssigned = haversineDistance(latitude, longitude, assigned.latitude, assigned.longitude);

  // 1. Check assigned branch first
  if (distToAssigned <= assigned.allowedRadius) {
    return {
      isAllowed: true,
      matchedBranch: assigned,
      distance: Math.round(distToAssigned),
      allowedRadius: assigned.allowedRadius,
      closestBranch: assigned,
      minDistance: Math.round(distToAssigned),
    };
  }

  // 2. Check the other branch in case employee is covering a shift there
  const otherBranchId: BranchId = assignedBranchId === 'NAGARBHAVI' ? 'RR_NAGAR' : 'NAGARBHAVI';
  const other = BRANCHES[otherBranchId];
  const distToOther = haversineDistance(latitude, longitude, other.latitude, other.longitude);

  if (distToOther <= other.allowedRadius) {
    return {
      isAllowed: true,
      matchedBranch: other,
      distance: Math.round(distToOther),
      allowedRadius: other.allowedRadius,
      closestBranch: other,
      minDistance: Math.round(distToOther),
    };
  }

  // 3. Outside both branches
  const isAssignedCloser = distToAssigned <= distToOther;
  const closest = isAssignedCloser ? assigned : other;
  const minDist = isAssignedCloser ? distToAssigned : distToOther;

  return {
    isAllowed: false,
    matchedBranch: assigned,
    distance: Math.round(distToAssigned),
    allowedRadius: assigned.allowedRadius,
    closestBranch: closest,
    minDistance: Math.round(minDist),
  };
}
