/**
 * Shared TypeScript types — single source of truth for all frontend pages.
 */

// ─── Core Entities ───────────────────────────────────────────

export interface UserMeta {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'PARENT';
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  parentId?: string;
  isActive?: boolean;
  ageGroup?: 'PETIT' | 'GRAND';
  createdAt?: string;
  score?: number;
  parent?: ParentInfo;
  defaultPresences?: DefaultPresence[];
  isCurrentlyAbsent?: boolean;
}

export interface ParentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  secondId?: string | null;
  secondEmail?: string | null;
}

export interface DefaultPresence {
  id?: string;
  childId?: string;
  dayOfWeek: string;
  halfDay: string;
}

// ─── Planning Entities ───────────────────────────────────────

export interface Week {
  id: string;
  weekNumber: number;
  year: number;
  status: 'PREPARATION' | 'OPEN_TO_PARENTS' | 'PUBLISHED';
  needsRecalculation?: boolean;
  hasAssignments?: boolean;
  createdAt?: string;
  updatedAt?: string;
  slots?: Slot[];
}

export interface Slot {
  id: string;
  planningWeekId?: string;
  dayOfWeek: string;
  halfDay: string;
  slotType: 'OPEN' | 'DOUBLE_PERM' | 'CLOSED';
  requiredParents: number;
  assignments?: Assignment[];
  availabilities?: Availability[];
  childPresences?: ChildPresence[];
}

export interface Assignment {
  id: string;
  isManual: boolean;
  childId?: string;
  child?: Child;
  parent: ParentInfo;
}

export interface Availability {
  id: string;
  isAvailable: boolean;
  isAbsent?: boolean;
  childId?: string;
  child: Pick<Child, 'id' | 'firstName' | 'lastName'>;
}

export interface ChildPresence {
  id: string;
  isPresent: boolean;
  childId?: string;
  child: Pick<Child, 'id' | 'firstName' | 'lastName'>;
}

// ─── Constants ───────────────────────────────────────────────

export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
};

export const HALF_DAYS = ['MORNING', 'AFTERNOON'] as const;
export const HALF_DAY_LABELS: Record<string, string> = {
  MORNING: 'Matin',
  AFTERNOON: 'Après-midi',
};

export type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'ABSENT';
