Identity Lifecycle (Asgardeo Integration)

This document outlines the identity lifecycle within EquiHire, focusing on how WSO2 Asgardeo manages Identity and Access Management (IAM) for both Recruiters and Candidates. The workflow ensures secure, role-based access while maintaining a seamless and minimal-friction user experience.

Phase 1: Organization Setup

Before any interview session can be conducted, an organization must be established within the system.

1. Enterprise Sign-Up
Action: The Lead Recruiter (Admin) accesses the EquiHire web portal and selects “Sign Up for Enterprise.”

Asgardeo’s Role:
Redirects the user to the Asgardeo authentication interface
Supports Single Sign-On (SSO) for enterprise users
Technology: Authentication is handled via OpenID Connect (OIDC)
Verifies corporate identity and securely authenticates the Admin

3. Organization Provisioning
Action: After successful authentication, the Admin creates the organization profile within EquiHire
Asgardeo’s Role:
Assigns the authenticated user the “Organization Admin” role
Enables role-based access control (RBAC) for subsequent actions
Phase 2: Recruiter Workflow (Interview Creation)

1. Recruiter Login
Action: The Recruiter logs in using their corporate credentials
Asgardeo’s Role:
Authenticates the user
Issues a JWT (JSON Web Token) containing scoped roles and permissions
EquiHire Backend:
Validates the JWT
Loads the organization-specific dashboard based on assigned roles

3. Interview Session Scheduling
Action: The Recruiter initiates a new interview session via the dashboard
Inputs:
Job Role
Candidate Email
Scheduled Date and Time
Trigger Event:
Upon clicking “Send Invite,” the Ballerina API Gateway initiates the candidate invitation workflow
Phase 3: Secure Invitation Mechanism

To reduce friction, candidates are not required to create traditional accounts or manage passwords.

1. Backend Processing (Ballerina Service)
Receives the invitation request (e.g., Invite candidate@gmail.com)
Generates a unique, time-bound Invitation Token
Stores the token securely in Supabase
This token operates independently from Asgardeo during initial access

3. Magic Link Distribution
Email Delivery:
The system sends an invitation email containing a secure link
Example: “You have been invited to participate in a Blind Interview. Click here to join.”
The link embeds the unique invitation token
Phase 4: Candidate Access Flow

1. Invitation Link Verification
Action: The candidate clicks the invitation link (/invite/{token})
Backend Validation:
Verifies token authenticity
Checks expiration status
Ensures the token has not been previously used

3. Candidate Lobby (Waiting Room)
Access Granted: Upon successful validation, the candidate enters a secure lobby
Session Handling:
A temporary Candidate Session is created (in-memory or short-lived storage)
Security Constraints:
Candidates are isolated from:
Recruiter dashboards
Other candidates
Ensures strict access boundaries
Phase 5: Assessment Execution (Secure Environment)

1. Assessment Initialization
Action: Candidate selects “Start Assessment”
Ballerina Gateway Responsibilities:
Validates the active Candidate Session
Initializes a secure Lockdown Environment
Agentic Security Layer:
All candidate submissions are intercepted in real-time
Personally Identifiable Information (PII) is detected and redacted using:
HuggingFace Named Entity Recognition (NER) models
Google Gemini processing
Ensures anonymized evaluation before persistence

3. Session Completion
Action: Assessment concludes
Token Lifecycle Management:
The Invitation Token is marked as used
Any subsequent access attempts with the same link will result in “Link Expired”
Summary

The identity lifecycle in EquiHire is designed to balance security, scalability, and usability:

Asgardeo handles enterprise-grade authentication and role-based access control
Ballerina services orchestrate secure workflows and token-based interactions
Passwordless candidate access ensures a frictionless experience
Real-time anonymization and validation enforce fairness and data protection

This approach enables a secure, bias-free recruitment process while maintaining a seamless experience for both recruiters and candidates.
