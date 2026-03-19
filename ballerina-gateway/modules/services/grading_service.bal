// ===========================================================================
// modules/services/grading_service.bal — Assessment submission and grading.
// Raw answer vault write ALWAYS completes before async pipeline starts.
// ===========================================================================
import ballerina/http;
import ballerina/log;
import avi0ra/huggingface;
import equihire/gateway.clients;
import equihire/gateway.config;
import equihire/gateway.constants;
import equihire/gateway.repositories;
import equihire/gateway.types;
import equihire/gateway.utils;

public function submitAssessment(string candidateId,
                                 types:SubmitAssessmentPayload payload) returns json|error {
    logCheatEvents(candidateId, payload.sessionId, payload.cheatEvents);

    // Safety contract: raw answers MUST be written before async grading starts
    map<string> rawVaultIds = check writeRawAnswers(candidateId, payload);

    error? sessErr = repositories:updateExamSession(
        payload.sessionId, constants:SESSION_GRADING, payload.submissionType);
    if sessErr is error {
        log:printError("Failed to update session to grading",
                       'error = sessErr, sessionId = payload.sessionId);
    }

    _ = start runGradingPipeline(candidateId, payload, rawVaultIds);

    logAuditAsync(candidateId, payload.jobId, payload.answers.length());

    return {"status": "submitted", "candidateId": candidateId, "answersReceived": payload.answers.length()};
}

function logCheatEvents(string candidateId, string sessionId,
                        types:CheatEventItem[] events) {
    foreach types:CheatEventItem evt in events {
        error? err = repositories:insertCheatEvent(
            sessionId, candidateId, evt.eventType, evt.occurredAt, evt.details);
        if err is error {
            log:printError("insertCheatEvent failed",
                           'error = err, sessionId = sessionId, eventType = evt.eventType);
        }
    }
}

function writeRawAnswers(string candidateId,
                         types:SubmitAssessmentPayload payload) returns map<string>|error {
    map<string> vaultIds = {};
    foreach types:AnswerSubmission ans in payload.answers {
        int wordCount = ans.answerText.length() / 5;
        string|error rawId = repositories:insertRawAnswer(
            payload.sessionId, candidateId, ans.questionId,
            ans.answerText, ans.timeSpentSeconds, wordCount);
        if rawId is string {
            vaultIds[ans.questionId] = rawId;
        } else {
            log:printError("insertRawAnswer failed",
                           'error = rawId, candidateId = candidateId, questionId = ans.questionId);
        }
    }
    return vaultIds;
}

function runGradingPipeline(string candidateId, types:SubmitAssessmentPayload payload,
                            map<string> rawVaultIds) {
    types:QuestionItem[]|error questions = repositories:getJobQuestions(payload.jobId);
    if questions is error {
        log:printError("Pipeline: failed to fetch questions",
                       'error = questions, jobId = payload.jobId, candidateId = candidateId);
        return;
    }

    types:ContextTags|error tags = repositories:getContextTags(candidateId);
    string expLevel = tags is types:ContextTags ? tags.experienceLevel : constants:LEVEL_UNKNOWN;

    map<json>|error piiMapResult = repositories:getPiiRedactionMap(candidateId);
    map<json> piiMap = piiMapResult is map<json> ? piiMapResult : {};

    float totalScore = 0.0;
    int graded = 0;

    foreach types:AnswerSubmission ans in payload.answers {
        types:GradingResult|error result = gradeOneAnswer(
            payload.sessionId, candidateId, ans, questions, expLevel, piiMap, rawVaultIds);
        if result is types:GradingResult {
            totalScore += <float>result.score;
            graded += 1;
        }
    }

    aggregateAndFinalize(candidateId, payload.jobId, payload.sessionId, totalScore, graded);
}

function gradeOneAnswer(string sessionId, string candidateId,
                        types:AnswerSubmission ans,
                        types:QuestionItem[] questions, string expLevel,
                        map<json> piiMap, map<string> rawVaultIds) returns types:GradingResult|error {
    types:QuestionItem? matchedQ = findQuestion(ans.questionId, questions);
    if matchedQ is () {
        log:printWarn("Question not found for answer",
                      questionId = ans.questionId, sessionId = sessionId);
        return error("Question not found: " + ans.questionId);
    }

    string redactedAns = utils:maskPii(ans.answerText, piiMap);

    [boolean, float?] [passed, hfScore] = runHfGate(redactedAns, sessionId, ans.questionId);

    string? vaultId = rawVaultIds[ans.questionId];
    if vaultId is string {
        error? hfErr = repositories:markRawAnswerHfChecked(vaultId);
        if hfErr is error {
            log:printError("markRawAnswerHfChecked failed", 'error = hfErr, vaultId = vaultId);
        }
    }

    types:GradingResult result = buildGradingResult(
        sessionId, candidateId, ans.questionId, redactedAns,
        matchedQ, expLevel, passed, hfScore);

    error? insErr = repositories:insertGradingResult(result);
    if insErr is error {
        log:printError("insertGradingResult failed",
                       'error = insErr, candidateId = candidateId, questionId = ans.questionId);
    }
    return result;
}

function findQuestion(string questionId,
                      types:QuestionItem[] questions) returns types:QuestionItem? {
    foreach types:QuestionItem q in questions {
        if q.id == questionId { return q; }
    }
    return ();
}

function runHfGate(string redactedAns, string sessionId,
                   string questionId) returns [boolean, float?] {
    huggingface:ZeroShotClassificationRequest hfPayload = {
        inputs: redactedAns,
        parameters: {candidateLabels: [constants:HF_LABEL_RELEVANT, constants:HF_LABEL_IRRELEVANT]}
    };
    huggingface:ZeroShotClassificationResponse|error res =
        clients:hfClient->/hf\-inference/models/[constants:HF_ZERO_SHOT_MODEL]/zero\-shot\-classification.post(hfPayload);

    if res is error {
        log:printWarn("HF gate 503 fallback — proceeding to Gemini",
                      sessionId = sessionId, questionId = questionId);
        return [true, ()];
    }
    foreach var item in res {
        if item.label == constants:HF_LABEL_RELEVANT {
            float score = item.score ?: 0.0;
            return [score >= constants:HF_RELEVANCE_THRESHOLD, score];
        }
    }
    return [false, 0.0];
}

function buildGradingResult(string sessionId, string candidateId, string questionId,
                            string redactedAns, types:QuestionItem q, string expLevel,
                            boolean hfPassed, float? hfScore) returns types:GradingResult {
    if !hfPassed {
        return {
            sessionId: sessionId, candidateId: candidateId, questionId: questionId,
            redactedAnswer: redactedAns, score: constants:AUTO_ZERO_SCORE,
            feedback: constants:AUTO_ZERO_FEEDBACK, hfGatePassed: false,
            hfRelevanceScore: hfScore, wasFlagged: false
        };
    }
    return callGeminiGrader(sessionId, candidateId, questionId, redactedAns, q, expLevel, hfScore);
}

function callGeminiGrader(string sessionId, string candidateId, string questionId,
                          string redactedAns, types:QuestionItem q, string expLevel,
                          float? hfScore) returns types:GradingResult {
    string prompt = utils:buildGradingPrompt(
        redactedAns, q.questionText, q.sampleAnswer, expLevel, "Moderate");
    string url = string `/models/${constants:GEMINI_MODEL}:generateContent?key=${config:geminiApiKey}`;

    int finalScore = constants:AUTO_ZERO_SCORE;
    string finalFeedback = constants:GRADING_FAILED_FEEDBACK;
    boolean flagged = false;
    int attempts = 1;
    string finalRedacted = redactedAns;

    json|error aiEval = callGeminiRaw(url, prompt, candidateId, questionId, attempts);
    if aiEval is error {
        attempts = 2;
        aiEval = callGeminiRaw(url, prompt, candidateId, questionId, attempts);
    }

    if aiEval is map<json> {
        finalScore = parseScore(aiEval["score"]);
        finalFeedback = aiEval["feedback"] is string ? <string>aiEval["feedback"] : finalFeedback;
        if aiEval["redacted_answer"] is string { finalRedacted = <string>aiEval["redacted_answer"]; }
    } else {
        flagged = true;
        log:printError("Gemini grading failed after retry — flagging for manual review",
                       candidateId = candidateId, questionId = questionId, sessionId = sessionId);
    }

    return {
        sessionId: sessionId, candidateId: candidateId, questionId: questionId,
        redactedAnswer: finalRedacted, score: finalScore, feedback: finalFeedback,
        hfGatePassed: true, hfRelevanceScore: hfScore,
        geminiModel: constants:GEMINI_MODEL, gradingAttempt: attempts, wasFlagged: flagged
    };
}

function callGeminiRaw(string url, string prompt, string candidateId,
                       string questionId, int attempt) returns json|error {
    json reqPayload = {"contents": [{"parts": [{"text": prompt}]}]};
    http:Response res = check clients:geminiClient->post(url, reqPayload);
    if res.statusCode < 200 || res.statusCode >= 300 {
        log:printError("Gemini grading HTTP error",
                       statusCode = res.statusCode, attempt = attempt,
                       candidateId = candidateId, questionId = questionId);
        return error("Gemini HTTP " + res.statusCode.toString());
    }
    json rp = check res.getJsonPayload();
    string text = check extractGeminiTextGrading(rp, candidateId, questionId);
    return cleanAndParseJsonGrading(text);
}

function extractGeminiTextGrading(json rp, string candidateId,
                                  string questionId) returns string|error {
    map<json> top = <map<json>>rp;
    if top.hasKey("error") {
        string msg = (<map<json>>top["error"])["message"].toString();
        log:printError("Gemini API error in response",
                       errorMessage = msg, candidateId = candidateId, questionId = questionId);
        return error("Gemini error: " + msg);
    }
    var cands = top["candidates"];
    if cands is json[] && cands.length() > 0 {
        var content = (<map<json>>cands[0])["content"];
        if content is map<json> {
            json[] parts = <json[]>content["parts"];
            if parts.length() > 0 {
                var p = parts[0];
                if p is map<json> {
                    var t = p["text"];
                    if t is string { return t; }
                }
            }
        }
    }
    return error("Gemini returned no content for candidate " + candidateId + ", question " + questionId);
}

function cleanAndParseJsonGrading(string raw) returns json|error {
    string c = raw.trim();
    if c.startsWith("```") {
        int? nl = c.indexOf("\n");
        int? lb = c.lastIndexOf("```");
        if nl is int && lb is int && nl < lb {
            c = c.substring(nl + 1, lb).trim();
        }
    }
    return c.fromJsonString();
}

function parseScore(json scoreVal) returns int {
    if scoreVal is int   { return scoreVal; }
    if scoreVal is float { return <int>scoreVal; }
    if scoreVal is string {
        int|error p = int:fromString(scoreVal);
        if p is int { return p; }
    }
    return constants:AUTO_ZERO_SCORE;
}

function aggregateAndFinalize(string candidateId, string jobId,
                              string sessionId, float total, int count) {
    if count > 0 {
        float avg = (total / <float>count) * constants:SCORE_SCALE_FACTOR;
        string recStatus = avg >= constants:PASS_THRESHOLD
            ? constants:STATUS_SHORTLISTED : constants:STATUS_REJECTED;
        string summary = "Automated interview assessment completed. Candidate scored " + avg.toString() + "/100.";
        error? evalErr = repositories:insertEvaluationResult(candidateId, jobId, avg, summary, recStatus);
        if evalErr is error {
            log:printError("insertEvaluationResult failed",
                           'error = evalErr, candidateId = candidateId, sessionId = sessionId);
        }
    }
    error? sessErr = repositories:updateExamSession(sessionId, constants:SESSION_GRADED, ());
    if sessErr is error {
        log:printError("Failed to mark session graded",
                       'error = sessErr, sessionId = sessionId, candidateId = candidateId);
    }
}

function logAuditAsync(string candidateId, string jobId, int answerCount) {
    string|error orgId = repositories:getOrgIdByJob(jobId);
    if orgId is string {
        _ = start repositories:createAuditLog(
            orgId, (), constants:AUDIT_SUBMIT_ASSESSMENT, "Candidate", candidateId,
            {"jobId": jobId, "answerCount": answerCount});
    }
}
