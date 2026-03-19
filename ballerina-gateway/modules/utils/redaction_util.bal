// ===========================================================================
// modules/utils/redaction_util.bal — PII masking and string replacement.
// ===========================================================================

// Masks PII in text using the redaction map from CV parsing.
// Each key in the map is the original PII value, its value is the redaction token.
public function maskPii(string text, map<json> piiMap) returns string {
    string result = text;
    foreach [string, json] [original, redacted] in piiMap.entries() {
        string replacement = redacted.toString();
        // Simple string replacement without regex
        while result.includes(original) {
            int? idx = result.indexOf(original);
            if idx is int {
                string before = idx > 0 ? result.substring(0, idx) : "";
                string after = result.substring(idx + original.length());
                result = before + replacement + after;
            }
        }
    }
    return result;
}

// Replaces redaction tokens back to original values (for recruiter reveal).
public function unmaskPii(string text, map<json> piiMap) returns string {
    string result = text;
    foreach [string, json] [original, redacted] in piiMap.entries() {
        string token = redacted.toString();
        while result.includes(token) {
            int? idx = result.indexOf(token);
            if idx is int {
                string before = idx > 0 ? result.substring(0, idx) : "";
                string after = result.substring(idx + token.length());
                result = before + original + after;
            }
        }
    }
    return result;
}
