/**
 * @fileoverview Invitation types for candidate magic-link invites.
 */

/** Invitation delivery status. */
export type InvitationStatus = 'pending' | 'completed' | 'expired';

/**
 * Candidate invitation record (magic link sent for an interview).
 */
export interface Invitation {
  id?: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle?: string;
  organizationId: string;
  status: InvitationStatus;
  createdAt?: string;
}

/** Payload for creating an invitation (no id, status set by backend). */
export type CreateInvitationPayload = Omit<Invitation, 'id' | 'status'>;
