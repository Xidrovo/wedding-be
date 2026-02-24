import { Timestamp } from 'firebase-admin/firestore';

export enum InvitationStatus {
  NOT_OPEN = 'not_open',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class WeddingGuest {
  id: string;
  name: string;
  plus_ones_allowed?: number;

  // Status of the RSVP
  status: InvitationStatus;

  // Timestamp of last visit
  last_visit_at?: Timestamp | null;

  guest_url?: string;
  token?: string;

  plus_ones_confirmed?: number;
  accepted_at?: Timestamp | null;

  created_at?: Timestamp;
  limit_date?: Timestamp;
  updated_at?: Timestamp;
}
