/** Values that both the API and the UI have to agree on, in one place. */

export const SPECIES = ['dog', 'cat', 'bird', 'cattle', 'rodent', 'reptile', 'other'] as const;
export const URGENCY = ['critical', 'urgent', 'stable'] as const;
export const RESCUE_STATUS = ['reported', 'claimed', 'in_care', 'resolved', 'closed'] as const;
export const ANIMAL_STATUS = ['available', 'pending', 'adopted', 'unavailable'] as const;
export const APPLICATION_STATUS = ['submitted', 'reviewing', 'approved', 'rejected', 'withdrawn'] as const;
export const SEX = ['male', 'female', 'unknown'] as const;
export const SIZE = ['small', 'medium', 'large'] as const;
export const USER_ROLE = ['citizen', 'ngo', 'admin'] as const;
export const POST_KIND = ['lost', 'found'] as const;
export const POST_STATUS = ['open', 'reunited', 'closed'] as const;
export const CAMPAIGN_STATUS = ['draft', 'active', 'funded', 'closed'] as const;
export const OPPORTUNITY_STATUS = ['open', 'filled', 'closed'] as const;

export type Species = (typeof SPECIES)[number];
export type Urgency = (typeof URGENCY)[number];
export type RescueStatus = (typeof RESCUE_STATUS)[number];
export type AnimalStatus = (typeof ANIMAL_STATUS)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];
export type Sex = (typeof SEX)[number];
export type Size = (typeof SIZE)[number];
export type UserRole = (typeof USER_ROLE)[number];
export type PostKind = (typeof POST_KIND)[number];
export type PostStatus = (typeof POST_STATUS)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUS)[number];

/** Human-facing copy. Kept beside the enums so a new species can never ship
 *  with a missing label. */
export const SPECIES_LABEL: Record<Species, string> = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  cattle: 'Cattle',
  rodent: 'Small critter',
  reptile: 'Reptile',
  other: 'Other',
};

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🐦',
  cattle: '🐄',
  rodent: '🐹',
  reptile: '🦎',
  other: '🐾',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: 'Needs help right now',
  urgent: 'Needs help today',
  stable: 'Safe for now',
};

export const RESCUE_STATUS_LABEL: Record<RescueStatus, string> = {
  reported: 'Waiting for a helper',
  claimed: 'Helper on the way',
  in_care: 'Safe and in care',
  resolved: 'Happy ending',
  closed: 'Closed',
};

/** The only forward moves a rescue is allowed to make. Enforced by the API so
 *  a report cannot jump from "reported" straight to "resolved". */
export const RESCUE_TRANSITIONS: Record<RescueStatus, RescueStatus[]> = {
  reported: ['claimed', 'closed'],
  claimed: ['in_care', 'resolved', 'reported', 'closed'],
  in_care: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

export const STORAGE_BUCKETS = ['rescues', 'animals', 'orgs', 'avatars', 'lostfound', 'campaigns'] as const;
export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
