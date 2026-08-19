import type {
  Species, Urgency, RescueStatus, AnimalStatus, ApplicationStatus,
  Sex, Size, UserRole, PostKind, PostStatus, CampaignStatus, OpportunityStatus,
} from './constants.js';

/** Every API response is one of these two shapes. */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string[]> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  city: string | null;
  pincode: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  registrationNo: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  services: string[];
  acceptsRescues: boolean;
  verified: boolean;
  createdAt: string;
  /** Present on proximity results only. */
  distanceKm?: number;
}

export interface Rescue {
  id: string;
  reference: string;
  reporterId: string | null;
  title: string;
  description: string;
  species: Species;
  urgency: Urgency;
  status: RescueStatus;
  photos: string[];
  address: string | null;
  landmark: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  contactName: string | null;
  /** Redacted to null unless the viewer reported it or belongs to a
   *  rescue-accepting organization. */
  contactPhone: string | null;
  claimedBy: string | null;
  claimedByName?: string | null;
  claimedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  reporter?: Pick<Profile, 'id' | 'fullName' | 'avatarUrl'> | null;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'verified'> | null;
  updates?: RescueUpdate[];
  watching?: boolean;
  watcherCount?: number;
}

export interface RescueUpdate {
  id: string;
  rescueId: string;
  authorId: string | null;
  orgId: string | null;
  message: string;
  photos: string[];
  statusFrom: RescueStatus | null;
  statusTo: RescueStatus | null;
  createdAt: string;
  author?: Pick<Profile, 'id' | 'fullName' | 'avatarUrl'> | null;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl'> | null;
}

export interface Animal {
  id: string;
  orgId: string;
  rescueId: string | null;
  name: string;
  slug: string;
  species: Species;
  breed: string | null;
  sex: Sex;
  ageMonths: number | null;
  size: Size | null;
  colour: string | null;
  story: string;
  personality: string[];
  photos: string[];
  vaccinated: boolean;
  sterilised: boolean;
  dewormed: boolean;
  specialNeeds: string | null;
  goodWith: string[];
  adoptionFee: number;
  fosterOnly: boolean;
  status: AnimalStatus;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  distanceKm?: number;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'verified' | 'city'> | null;
  favourited?: boolean;
  applicationStatus?: ApplicationStatus | null;
}

export interface AdoptionApplication {
  id: string;
  animalId: string;
  applicantId: string;
  fullName: string;
  phone: string;
  email: string;
  homeType: string | null;
  household: string | null;
  hasOtherPets: boolean;
  otherPets: string | null;
  experience: string | null;
  message: string | null;
  status: ApplicationStatus;
  orgNote: string | null;
  createdAt: string;
  animal?: Pick<Animal, 'id' | 'name' | 'slug' | 'photos' | 'species' | 'orgId'> | null;
  applicant?: Pick<Profile, 'id' | 'fullName' | 'avatarUrl'> | null;
}

export interface Campaign {
  id: string;
  orgId: string;
  animalId: string | null;
  rescueId: string | null;
  title: string;
  slug: string;
  summary: string;
  story: string;
  coverUrl: string | null;
  photos: string[];
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  donorCount: number;
  deadline: string | null;
  status: CampaignStatus;
  createdAt: string;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'verified'> | null;
  recentDonors?: PublicDonation[];
}

/** What a campaign page is allowed to show about a gift. */
export interface PublicDonation {
  id: string;
  donorName: string | null;
  amount: number;
  currency: string;
  message: string | null;
  anonymous: boolean;
  createdAt: string;
}

export interface VolunteerOpportunity {
  id: string;
  orgId: string;
  title: string;
  description: string;
  skills: string[];
  commitment: string | null;
  startsAt: string | null;
  endsAt: string | null;
  slots: number;
  filled: number;
  remote: boolean;
  address: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  status: OpportunityStatus;
  createdAt: string;
  distanceKm?: number;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'verified'> | null;
  applied?: boolean;
}

export interface LostFoundPost {
  id: string;
  authorId: string | null;
  kind: PostKind;
  petName: string | null;
  species: Species;
  breed: string | null;
  colour: string | null;
  sex: Sex;
  description: string;
  distinguishing: string | null;
  photos: string[];
  seenAt: string;
  address: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  contactName: string | null;
  contactPhone: string;
  reward: number | null;
  status: PostStatus;
  createdAt: string;
  distanceKm?: number;
  matches?: LostFoundMatch[];
}

export interface LostFoundMatch {
  id: string;
  kind: PostKind;
  petName: string | null;
  species: Species;
  breed: string | null;
  colour: string | null;
  photos: string[];
  seenAt: string;
  city: string | null;
  distanceKm: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PlatformStats {
  rescuesTotal: number;
  rescuesResolved: number;
  animalsAdopted: number;
  animalsWaiting: number;
  organizations: number;
  volunteers: number;
  petsReunited: number;
  fundsRaised: number;
}

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
  organizations: Array<Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'verified'> & { role: string }>;
}

export interface UploadTicket {
  /** Signed URL the browser PUTs the file to. */
  url: string;
  /** Storage path the API will accept back in a create/update payload. */
  path: string;
  /** Public URL to store on the record once the upload succeeds. */
  publicUrl: string;
  token: string;
}
