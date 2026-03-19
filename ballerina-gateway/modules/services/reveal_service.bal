// ===========================================================================
// modules/services/reveal_service.bal — Candidate identity reveal logic.
// ===========================================================================
import ballerina/log;
import equihire/gateway.config;
import equihire/gateway.utils;
import equihire/gateway.types;

public function revealCandidate(string candidateId) returns types:RevealResponse|error {
    string objectKey = string `cvs/${candidateId}.pdf`;

    string|error presignedUrl = utils:generateR2PresignedUrl(
        config:r2AccessKey,
        config:r2SecretKey,
        config:r2AccountId,
        config:r2BucketName,
        objectKey,
        "GET",
        3600
    );

    if presignedUrl is error {
        log:printError("Failed to generate reveal URL",
                       'error      = presignedUrl,
                       candidateId = candidateId);
        return {url: (), status: "error"};
    }

    log:printInfo("Reveal URL generated", candidateId = candidateId);
    return {url: presignedUrl, status: "ready"};
}
