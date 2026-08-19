import { z } from 'zod';
import {
  SPECIES, URGENCY, RESCUE_STATUS, ANIMAL_STATUS, APPLICATION_STATUS,
  SEX, SIZE, USER_ROLE, POST_KIND, POST_STATUS, CAMPAIGN_STATUS,
  STORAGE_BUCKETS, ACCEPTED_IMAGE_TYPES,
} from './constants.js';

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** Indian mobile numbers, tolerant of the ways people actually type them
 *  (+91, leading 0, spaces, dashes). Normalised to 10 digits. */
export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(\+?91|0)?[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number')
  .transform((v) => v.replace(/^(\+?91|0)/, ''));

export const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode');

export const email = z.string().trim().toLowerCase().email('Enter a valid email address');

export const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Passwords cap out at 72 characters')
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), 'Mix in at least one letter and one number');

export const latitude = z.coerce.number().min(-90).max(90);
export const longitude = z.coerce.number().min(-180).max(180);

export const photos = z.array(z.string().url()).max(6, 'Six photos is plenty').default([]);

export const uuid = z.string().uuid();

/** Shared by every "near me" endpoint. */
export const geoQuery = z.object({
  lat: latitude,
  lng: longitude,
  radiusKm: z.coerce.number().min(0.5).max(200).default(10),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

/** Query params arrive as `?species=dog,cat`; accept that, a repeated param,
 *  or a real array, and normalise all three to a non-empty tuple. */
const csvEnum = <V extends string>(values: readonly [V, ...V[]]) =>
  z.preprocess(
    (raw) => {
      if (raw === undefined || raw === null || raw === '') return undefined;
      const list = (Array.isArray(raw) ? raw : String(raw).split(','))
        .map((s) => String(s).trim())
        .filter(Boolean);
      return list.length ? list : undefined;
    },
    z.array(z.enum(values as unknown as [V, ...V[]])).nonempty().optional(),
  );

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const signUpSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(2, 'Tell us your name').max(80),
  phone: phone.optional(),
  role: z.enum(USER_ROLE).exclude(['admin']).default('citizen'),
});

export const signInSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
  bio: optionalText(400),
  city: optionalText(80),
  pincode: pincode.optional(),
  avatarUrl: z.string().url().optional(),
});

/* -------------------------------------------------------------------------- */
/* Organizations                                                              */
/* -------------------------------------------------------------------------- */

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'What is your organization called?').max(120),
  tagline: optionalText(140),
  description: z.string().trim().min(40, 'Tell people what you do — at least 40 characters').max(4000),
  email,
  phone,
  website: z.string().trim().url('Enter a full URL including https://').optional().or(z.literal('').transform(() => undefined)),
  registrationNo: optionalText(60),
  addressLine1: z.string().trim().min(3).max(160),
  addressLine2: optionalText(160),
  landmark: optionalText(120),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode,
  lat: latitude,
  lng: longitude,
  services: z.array(z.string().trim().max(40)).max(12).default([]),
  acceptsRescues: z.boolean().default(true),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

/* -------------------------------------------------------------------------- */
/* Rescues                                                                    */
/* -------------------------------------------------------------------------- */

export const createRescueSchema = z.object({
  title: z.string().trim().min(5, 'A short headline helps helpers triage').max(120),
  description: z.string().trim().min(20, 'A few more details, please — at least 20 characters').max(3000),
  species: z.enum(SPECIES).default('other'),
  urgency: z.enum(URGENCY).default('urgent'),
  photos,
  address: optionalText(240),
  landmark: optionalText(120),
  city: optionalText(80),
  pincode: pincode.optional(),
  lat: latitude,
  lng: longitude,
  contactName: optionalText(80),
  contactPhone: phone,
});

export const rescueQuerySchema = geoQuery.partial({ lat: true, lng: true }).extend({
  status: csvEnum(RESCUE_STATUS),
  species: csvEnum(SPECIES),
  urgency: csvEnum(URGENCY),
  pincode: pincode.optional(),
  orgId: uuid.optional(),
  mine: z.coerce.boolean().optional(),
});

export const claimRescueSchema = z.object({
  orgId: uuid,
  note: optionalText(500),
});

export const rescueStatusSchema = z.object({
  status: z.enum(RESCUE_STATUS),
  note: optionalText(500),
});

export const rescueUpdateSchema = z.object({
  message: z.string().trim().min(3).max(1000),
  photos,
});

/* -------------------------------------------------------------------------- */
/* Adoption                                                                   */
/* -------------------------------------------------------------------------- */

export const createAnimalSchema = z.object({
  name: z.string().trim().min(1, 'Give this friend a name').max(60),
  species: z.enum(SPECIES).default('dog'),
  breed: optionalText(80),
  sex: z.enum(SEX).default('unknown'),
  ageMonths: z.coerce.number().int().min(0).max(360).optional(),
  size: z.enum(SIZE).optional(),
  colour: optionalText(60),
  story: z.string().trim().min(30, 'Tell their story — at least 30 characters').max(4000),
  personality: z.array(z.string().trim().max(30)).max(8).default([]),
  photos: z.array(z.string().url()).min(1, 'At least one photo, please').max(8),
  vaccinated: z.boolean().default(false),
  sterilised: z.boolean().default(false),
  dewormed: z.boolean().default(false),
  specialNeeds: optionalText(500),
  goodWith: z.array(z.enum(['kids', 'dogs', 'cats', 'seniors', 'apartments'])).max(5).default([]),
  adoptionFee: z.coerce.number().min(0).max(100000).default(0),
  fosterOnly: z.boolean().default(false),
  rescueId: uuid.optional(),
  city: optionalText(80),
  pincode: pincode.optional(),
  lat: latitude.optional(),
  lng: longitude.optional(),
});

export const updateAnimalSchema = createAnimalSchema.partial().extend({
  status: z.enum(ANIMAL_STATUS).optional(),
});

export const animalQuerySchema = geoQuery.partial({ lat: true, lng: true }).extend({
  species: csvEnum(SPECIES),
  sex: csvEnum(SEX),
  size: csvEnum(SIZE),
  maxAgeMonths: z.coerce.number().int().min(0).max(360).optional(),
  orgId: uuid.optional(),
  q: optionalText(80),
});

export const adoptionApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone,
  email,
  homeType: z.enum(['apartment', 'independent_house', 'farm', 'other']).optional(),
  household: optionalText(200),
  hasOtherPets: z.boolean().default(false),
  otherPets: optionalText(300),
  experience: optionalText(1000),
  message: z.string().trim().min(20, 'Say hello properly — at least 20 characters').max(1500),
});

export const applicationDecisionSchema = z.object({
  status: z.enum(APPLICATION_STATUS),
  note: optionalText(500),
});

/* -------------------------------------------------------------------------- */
/* Giving                                                                     */
/* -------------------------------------------------------------------------- */

export const createCampaignSchema = z.object({
  title: z.string().trim().min(5).max(120),
  summary: z.string().trim().min(20).max(300),
  story: z.string().trim().min(100, 'Donors give to stories — write at least 100 characters').max(8000),
  coverUrl: z.string().url().optional(),
  photos,
  goalAmount: z.coerce.number().min(500, 'Set a goal of at least ₹500').max(10_000_000),
  currency: z.string().length(3).default('INR'),
  deadline: z.coerce.date().min(new Date(), 'Pick a date in the future').optional(),
  animalId: uuid.optional(),
  rescueId: uuid.optional(),
  status: z.enum(CAMPAIGN_STATUS).default('active'),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const donationSchema = z.object({
  amount: z.coerce.number().min(10, 'Minimum donation is ₹10').max(1_000_000),
  donorName: z.string().trim().min(2).max(80).optional(),
  donorEmail: email.optional(),
  message: optionalText(300),
  anonymous: z.boolean().default(false),
});

/* -------------------------------------------------------------------------- */
/* Volunteering                                                               */
/* -------------------------------------------------------------------------- */

export const createOpportunitySchema = z
  .object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(30).max(3000),
    skills: z.array(z.string().trim().max(40)).max(10).default([]),
    commitment: optionalText(120),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    slots: z.coerce.number().int().min(1).max(500).default(1),
    remote: z.boolean().default(false),
    address: optionalText(240),
    city: optionalText(80),
    pincode: pincode.optional(),
    lat: latitude.optional(),
    lng: longitude.optional(),
  })
  .refine((v) => v.remote || (v.lat !== undefined && v.lng !== undefined), {
    message: 'Pick a location on the map, or mark this opportunity as remote',
    path: ['lat'],
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    message: 'The end date cannot be before the start date',
    path: ['endsAt'],
  });

export const volunteerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone,
  email,
  message: optionalText(1000),
  availability: optionalText(200),
});

/* -------------------------------------------------------------------------- */
/* Lost & found                                                               */
/* -------------------------------------------------------------------------- */

export const lostFoundSchema = z.object({
  kind: z.enum(POST_KIND),
  petName: optionalText(60),
  species: z.enum(SPECIES).default('dog'),
  breed: optionalText(80),
  colour: optionalText(60),
  sex: z.enum(SEX).default('unknown'),
  description: z.string().trim().min(20).max(2000),
  distinguishing: optionalText(500),
  photos: z.array(z.string().url()).min(1, 'A photo makes a reunion far more likely').max(6),
  seenAt: z.coerce.date().max(new Date(), 'That date is in the future'),
  address: optionalText(240),
  city: optionalText(80),
  pincode: pincode.optional(),
  lat: latitude,
  lng: longitude,
  contactName: optionalText(80),
  contactPhone: phone,
  reward: z.coerce.number().min(0).max(1_000_000).optional(),
});

export const lostFoundQuerySchema = geoQuery.partial({ lat: true, lng: true }).extend({
  kind: z.enum(POST_KIND).optional(),
  species: csvEnum(SPECIES),
  status: z.enum(POST_STATUS).optional(),
});

/* -------------------------------------------------------------------------- */
/* Uploads                                                                    */
/* -------------------------------------------------------------------------- */

export const uploadRequestSchema = z.object({
  bucket: z.enum(STORAGE_BUCKETS),
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
  /** Only used to preserve a sensible extension; never trusted as a path. */
  filename: z.string().trim().max(200).optional(),
});

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type CreateRescueInput = z.input<typeof createRescueSchema>;
export type CreateAnimalInput = z.input<typeof createAnimalSchema>;
export type CreateOrganizationInput = z.input<typeof createOrganizationSchema>;
export type CreateCampaignInput = z.input<typeof createCampaignSchema>;
export type CreateOpportunityInput = z.input<typeof createOpportunitySchema>;
export type LostFoundInput = z.input<typeof lostFoundSchema>;
export type AdoptionApplicationInput = z.input<typeof adoptionApplicationSchema>;
export type VolunteerApplicationInput = z.input<typeof volunteerApplicationSchema>;
export type DonationInput = z.input<typeof donationSchema>;
