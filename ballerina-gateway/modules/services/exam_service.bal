// ===========================================================================
// modules/services/exam_service.bal — Exam session lifecycle management.
// ===========================================================================
import ballerina/log;
import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.types;

public function startSession(string candidateId, string invitationId,
                             string jobId) returns types:StartSessionResponse|error {
    string sessionId = check repositories:createExamSession(candidateId, invitationId, jobId);

    log:printInfo("Exam session started",
                  sessionId  = sessionId,
                  candidateId = candidateId,
                  jobId       = jobId);

    return {sessionId: sessionId, status: constants:SESSION_IN_PROGRESS};
}
