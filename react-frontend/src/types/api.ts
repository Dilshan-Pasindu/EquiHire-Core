/**
 * @fileoverview API response and request payload types (e.g. candidate from backend).
 */

/**
 * Base candidate shape from API (may differ from dashboard ExtendedCandidate).
 */
export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cvUrl: string;
  overallScore?: number;
  evaluationResults?: unknown;
}

/** Answer submission for candidate evaluation. */
export interface CandidateAnswerPayload {
  questionId: string;
  answerText: string;
}

/** Validate-invitation API response. */
export interface ValidateInvitationResponse {
  valid: boolean;
  message?: string;
  candidateEmail?: string;
  candidateName?: string;
  jobTitle?: string;
  organizationId?: string;
  jobId?: string;
}
