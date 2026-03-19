// ===========================================================================
// modules/utils/prompt_builder.bal — All Gemini prompt string builders.
// ===========================================================================

public function buildCvParsePrompt(string rawCvText) returns string {
    return string `You are an expert CV/Resume parser. Extract structured data from the following CV text.
Return a JSON object with these fields:
- "sections": { "education": [...], "work_experience": [...], "projects": [...] }
- "detectedStack": ["Python", "React", ...]  (technologies found)
- "experienceLevel": "Junior" | "Mid" | "Senior"  (estimated level)
- "piiMap": { "original_name": "[REDACTED_NAME]", "original_email": "[REDACTED_EMAIL]", ... }

IMPORTANT:
- Identify ALL personally identifiable information (PII) and include them in piiMap
- PII includes: names, emails, phone numbers, addresses, LinkedIn URLs, GitHub URLs, etc.
- Be thorough — missing PII is a privacy violation
- Return ONLY valid JSON, no markdown code fences

CV Text:
${rawCvText}`;
}

public function buildGradingPrompt(string candidateAnswer, string question,
                                    string sampleAnswer, string experienceLevel,
                                    string strictness) returns string {
    return string `You are a fair, unbiased technical interviewer. Grade the following candidate answer.

Question: ${question}
Expected Answer: ${sampleAnswer}
Candidate Answer: ${candidateAnswer}

Context:
- Experience Level: ${experienceLevel}
- Strictness: ${strictness}

Instructions:
1. Score from 0-10 based on technical accuracy, completeness, and clarity
2. Adjust expectations based on experience level
3. Provide constructive feedback focusing on growth areas
4. If the answer contains any PII (names, emails, etc.), redact it in your response
5. Return ONLY valid JSON with these fields:
   {"score": <number>, "feedback": "<string>", "redacted_answer": "<string>"}`;
}

public function buildRejectionEmailPrompt(string candidateName, string jobTitle,
                                           string summaryFeedback) returns string {
    return string `Write a professional, empathetic rejection email for a candidate.

Candidate: ${candidateName}
Position: ${jobTitle}
Assessment Feedback: ${summaryFeedback}

Guidelines:
- Be respectful and encouraging
- Mention specific areas for improvement based on the feedback
- Do not mention specific scores
- Keep it concise (2-3 paragraphs)
- End with encouragement to reapply in the future
- Return ONLY the email body text (no subject line, no greeting/signature — those are handled by the template)`;
}
