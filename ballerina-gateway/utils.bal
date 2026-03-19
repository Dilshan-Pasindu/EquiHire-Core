
import ballerina/crypto;
import ballerina/http;
import ballerina/io;
import ballerina/lang.array;
import ballerina/time;
import ballerina/url;

import equihire/gateway.types;

// ===========================================================================
// Cloudflare R2 — AWS Signature V4 Utilities
// ===========================================================================

# Builds the AWS SigV4 timestamp strings from the current UTC time.
# Returns a tuple of (amzDate, dateStamp) e.g. ("20260319T094200Z", "20260319").
#
# + return - Tuple of [amzDate, dateStamp]
isolated function buildAmzTimestamp() returns [string, string] {
    time:Utc now = time:utcNow();
    time:Civil c = time:utcToCivil(now);

    string year  = c.year.toString().padZero(4);
    string month = c.month.toString().padZero(2);
    string day   = c.day.toString().padZero(2);
    string dateStamp = year + month + day;

    string hour   = c.hour.toString().padZero(2);
    string minute = c.minute.toString().padZero(2);
    int secondInt = <int>(c.second ?: 0d);
    string second = secondInt.toString().padZero(2);

    string amzDate = dateStamp + "T" + hour + minute + second + "Z";
    return [amzDate, dateStamp];
}

# Converts a byte array to a lowercase hex string (used for SigV4 hashes).
#
# + data   - Raw byte array to encode
# + return - Lowercase hex-encoded string
isolated function toHex(byte[] data) returns string {
    return array:toBase16(data).toLowerAscii();
}

# Directly uploads raw bytes to Cloudflare R2 using AWS Signature V4 (S3-compatible API).
# The object is stored at: https://{accountId}.r2.cloudflarestorage.com/{bucket}/{objectKey}
#
# + cfg       - R2 configuration (access key, secret key, accountId, bucketName, region)
# + content   - Raw file bytes to upload (e.g. PDF bytes)
# + objectKey - Destination path inside the bucket (e.g. "cvs/uuid.pdf")
# + r2Client  - Pre-initialised HTTP client pointed at the R2 base URL
# + return    - () on success, error on HTTP or signing failure
public isolated function uploadBytesToR2(
    types:R2Config cfg,
    byte[] content,
    string objectKey,
    http:Client r2Client
) returns error? {

    // ---- 1. Timestamps ----
    [string, string] [amzDate, dateStamp] = buildAmzTimestamp();

    // ---- 2. Canonical request components ----
    string awsService   = "s3";
    string region       = cfg.region;
    string host         = cfg.accountId + ".r2.cloudflarestorage.com";
    string canonicalUri = "/" + cfg.bucketName + "/" + objectKey;
    string contentType  = "application/pdf";

    // SHA-256 hash of the request payload (required by SigV4)
    byte[] payloadHashBytes = crypto:hashSha256(content);
    string hexPayloadHash   = toHex(payloadHashBytes);

    // Canonical headers must be sorted alphabetically by header name
    string canonicalHeaders =
        "content-type:" + contentType + "\n" +
        "host:" + host + "\n" +
        "x-amz-content-sha256:" + hexPayloadHash + "\n" +
        "x-amz-date:" + amzDate + "\n";
    string signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    string canonicalRequest =
        "PUT" + "\n" +
        canonicalUri + "\n" +
        "" + "\n" +         // empty query string
        canonicalHeaders + "\n" +
        signedHeaders + "\n" +
        hexPayloadHash;

    // ---- 3. String to sign ----
    string credentialScope = dateStamp + "/" + region + "/" + awsService + "/aws4_request";
    string hexCrHash = toHex(crypto:hashSha256(canonicalRequest.toBytes()));
    string stringToSign =
        "AWS4-HMAC-SHA256" + "\n" +
        amzDate + "\n" +
        credentialScope + "\n" +
        hexCrHash;

    // ---- 4. Signing key derivation (HMAC-SHA256 chain) ----
    byte[] kSecret  = ("AWS4" + cfg.secretAccessKey).toBytes();
    byte[] kDate    = check crypto:hmacSha256(dateStamp.toBytes(),       kSecret);
    byte[] kRegion  = check crypto:hmacSha256(region.toBytes(),          kDate);
    byte[] kService = check crypto:hmacSha256(awsService.toBytes(),      kRegion);
    byte[] kSigning = check crypto:hmacSha256("aws4_request".toBytes(),  kService);

    // ---- 5. Signature ----
    byte[] sigBytes  = check crypto:hmacSha256(stringToSign.toBytes(), kSigning);
    string signature = toHex(sigBytes);

    // ---- 6. Authorization header ----
    string credential = cfg.accessKeyId + "/" + credentialScope;
    string authorization =
        "AWS4-HMAC-SHA256 " +
        "Credential=" + credential + ", " +
        "SignedHeaders=" + signedHeaders + ", " +
        "Signature=" + signature;

    // ---- 7. PUT request ----
    http:Request req = new;
    req.setPayload(content);
    // Content-Length must be set explicitly — R2 returns HTTP 411 if omitted
    req.setHeader("Content-Length",        content.length().toString());
    req.setHeader("Content-Type",          contentType);
    req.setHeader("x-amz-date",            amzDate);
    req.setHeader("x-amz-content-sha256",  hexPayloadHash);
    req.setHeader("Authorization",         authorization);

    http:Response res = check r2Client->put(canonicalUri, req);

    if res.statusCode < 200 || res.statusCode >= 300 {
        string body = check res.getTextPayload();
        io:println("[R2] Upload failed — HTTP ", res.statusCode, " | ", body);
        return error(string `R2 upload failed: HTTP ${res.statusCode}`);
    }
}

// ===========================================================================
// Cloudflare R2 — Presigned URL (for client-side direct upload)
// ===========================================================================

# Generates a pre-signed URL for Cloudflare R2 (AWS S3-compatible).
# Useful for client-side direct uploads without proxying through the gateway.
#
# + accessKey  - R2 Access Key ID
# + secretKey  - R2 Secret Access Key
# + accountId  - Cloudflare Account ID
# + bucketName - Target bucket name
# + objectKey  - Object path inside the bucket
# + method     - HTTP method for the presigned URL (e.g. "PUT", "GET")
# + expiresIn  - Expiration in seconds (e.g. 3600 for 1 hour)
# + return     - Presigned URL string or an error
public function generateR2PresignedUrl(
    string accessKey,
    string secretKey,
    string accountId,
    string bucketName,
    string objectKey,
    string method,
    int expiresIn
) returns string|error {
    string region      = "auto";
    string serviceName = "s3";
    string host        = accountId + ".r2.cloudflarestorage.com";
    string uri         = "/" + bucketName + "/" + objectKey;
    string endpoint    = "https://" + host + uri;

    // ---- Date handling ----
    time:Utc currentUtc    = time:utcNow();
    string dateIso         = time:utcToString(currentUtc);
    string dateStamp       = dateIso.substring(0, 4) + dateIso.substring(5, 7) + dateIso.substring(8, 10);
    string timeStamp       = dateIso.substring(11, 13) + dateIso.substring(14, 16) + dateIso.substring(17, 19);
    string amzDateFormatted = dateStamp + "T" + timeStamp + "Z";

    // ---- Canonical query string (sorted, URL-encoded) ----
    string credential = check url:encode(accessKey + "/" + dateStamp + "/" + region + "/" + serviceName + "/aws4_request", "UTF-8");
    string signedHeadersEnc = check url:encode("host", "UTF-8");

    string canonicalQueryString =
        "X-Amz-Algorithm=AWS4-HMAC-SHA256" +
        "&X-Amz-Credential=" + credential +
        "&X-Amz-Date=" + amzDateFormatted +
        "&X-Amz-Expires=" + expiresIn.toString() +
        "&X-Amz-SignedHeaders=" + signedHeadersEnc;

    // ---- Canonical request ----
    string canonicalHeaders = "host:" + host + "\n";
    string canonicalRequest =
        method + "\n" +
        uri + "\n" +
        canonicalQueryString + "\n" +
        canonicalHeaders + "\n" +
        "host" + "\n" +
        "UNSIGNED-PAYLOAD";

    // ---- String to sign ----
    string credentialScope = dateStamp + "/" + region + "/" + serviceName + "/aws4_request";
    string hexCrHash = toHex(crypto:hashSha256(canonicalRequest.toBytes()));
    string stringToSign =
        "AWS4-HMAC-SHA256" + "\n" +
        amzDateFormatted + "\n" +
        credentialScope + "\n" +
        hexCrHash;

    // ---- Signing key ----
    byte[] kDate    = check crypto:hmacSha256(dateStamp.toBytes(),        ("AWS4" + secretKey).toBytes());
    byte[] kRegion  = check crypto:hmacSha256(region.toBytes(),           kDate);
    byte[] kService = check crypto:hmacSha256(serviceName.toBytes(),      kRegion);
    byte[] kSigning = check crypto:hmacSha256("aws4_request".toBytes(),   kService);

    // ---- Signature ----
    byte[] signatureBytes = check crypto:hmacSha256(stringToSign.toBytes(), kSigning);
    string signature = toHex(signatureBytes);

    return endpoint + "?" + canonicalQueryString + "&X-Amz-Signature=" + signature;
}
