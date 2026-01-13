import { Timestamp } from 'firebase-admin/firestore';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class WeddingGuest {
  id: string;
  nombre: string;
  adicionales?: number;
  
  // Status of the RSVP
  estado_invitacion: InvitationStatus; 
  
  // Timestamp of first visit (was "estado_invitacion" in original prompt, now separate)
  first_visit_at?: Timestamp | null;

  guest_url?: string;
  token?: string;
  
  plus_ones_selected?: number;
  accepted_at?: Timestamp | null;
  
  created_at?: Timestamp;
  updated_at?: Timestamp;

  // Legacy/Optional?
  // Need to take further loook if this is need it
  posible_invitado?: number;
  estado_aceptacion?: string; // Keeping just in case, or remove? Plan said "Remove/Ignore". I'll keep it optional but deprecated.
}
