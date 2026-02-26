# EquiHire-Core API Reference & Postman Guide

This document outlines all the REST API endpoints available in the EquiHire-Core system, including the Ballerina Gateway and Python AI Engine, with detailed instructions on how to test them using Postman.

## Base URLs
- **Gateway API (Public & Admin)**: `http://localhost:9092/api`
- **Python AI Engine (Internal Vault)**: `http://localhost:8000`

---

## 1. Ballerina Gateway Endpoints (Port 9092)

### 1.1. Organizations

#### Create Organization
- **URL**: `POST http://localhost:9092/api/organizations`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "name": "Tech Corp",
      "industry": "Software",
      "size": "Start-up",
      "userId": "user_123",
      "userEmail": "admin@techcorp.com"
    }
    ```

#### Get Organization by User ID
- **URL**: `GET http://localhost:9092/api/me/organization?userId=user_123`
- **Postman Details**:
  - Method: `GET`

#### Update Organization
- **URL**: `PUT http://localhost:9092/api/organization?userId=user_123`
- **Postman Details**:
  - Method: `PUT`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "id": "org_555",
      "name": "Tech Corp",
      "industry": "FinTech",
      "size": "11-50"
    }
    ```

### 1.2. Jobs

#### Create Job
- **URL**: `POST http://localhost:9092/api/jobs`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "title": "Senior Backend Engineer",
      "description": "5+ years experience in Python and Go.",
      "requiredSkills": ["Python", "Go", "AWS"],
      "organizationId": "org_555",
      "recruiterId": "user_123"
    }
    ```

#### Get All Jobs for Recruiter
- **URL**: `GET http://localhost:9092/api/jobs?userId=user_123`
- **Postman Details**:
  - Method: `GET`

#### Update Job
- **URL**: `PUT http://localhost:9092/api/jobs/{jobId}`
- **Postman Details**:
  - Method: `PUT`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "title": "Lead Backend Engineer",
      "description": "Updated Description",
      "requiredSkills": ["Python", "Go", "AWS", "Kubernetes"]
    }
    ```

#### Delete Job
- **URL**: `DELETE http://localhost:9092/api/jobs/{jobId}`
- **Postman Details**:
  - Method: `DELETE`

### 1.3. Questions

#### Create Job Questions (Bulk)
- **URL**: `POST http://localhost:9092/api/jobs/questions`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "questions": [
        {
          "jobId": "job_111",
          "questionText": "Explain REST vs GraphQL.",
          "sampleAnswer": "REST is architectural, GraphQL is a query language...",
          "keywords": ["endpoints", "query", "over-fetching"],
          "type": "paragraph"
        }
      ]
    }
    ```

#### Get Questions for Job
- **URL**: `GET http://localhost:9092/api/jobs/{jobId}/questions`
- **Postman Details**:
  - Method: `GET`

#### Update Question
- **URL**: `PUT http://localhost:9092/api/questions/{questionId}`
- **Postman Details**:
  - Method: `PUT`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "questionText": "Explain REST vs GraphQL in depth.",
      "sampleAnswer": "Updated Answer",
      "keywords": ["endpoints", "query", "over-fetching", "caching"],
      "type": "paragraph"
    }
    ```

#### Delete Question
- **URL**: `DELETE http://localhost:9092/api/questions/{questionId}`
- **Postman Details**:
  - Method: `DELETE`

### 1.4. Invitations

#### Create Invitation (Magic Link)
- **URL**: `POST http://localhost:9092/api/invitations`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "recruiterId": "user_123",
      "organizationId": "org_555",
      "jobId": "job_111",
      "candidateEmail": "candidate@example.com",
      "candidateName": "John Doe",
      "interviewDate": "2024-03-01T10:00:00Z"
    }
    ```

#### Get All Invitations for Recruiter
- **URL**: `GET http://localhost:9092/api/invitations?userId=user_123`
- **Postman Details**:
  - Method: `GET`

#### Validate Invitation Token
- **URL**: `GET http://localhost:9092/api/invitations/validate/{token}`
- **Postman Details**:
  - Method: `GET`

### 1.5. Candidates & Uploads

#### Get Presigned Upload URL
- **URL**: `GET http://localhost:9092/api/candidates/upload-url`
- **Postman Details**:
  - Method: `GET`

#### Complete Upload (Triggers AI Parsing)
- **URL**: `POST http://localhost:9092/api/candidates/complete-upload`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "candidateId": "cand_999",
      "objectKey": "candidates/cand_999/resume.pdf",
      "jobId": "job_111"
    }
    ```

#### Reveal Candidate ID (Unmask)
- **URL**: `GET http://localhost:9092/api/candidates/{candidateId}/reveal`
- **Postman Details**:
  - Method: `GET`

#### Evaluate Candidate Answer (Proxy to AI)
- **URL**: `POST http://localhost:9092/api/evaluate`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "candidateAnswer": "REST uses standard HTTP methods.",
      "question": "Explain REST",
      "modelAnswer": "REST is an architectural style utilizing HTTP methods...",
      "experienceLevel": "Junior",
      "strictness": "Moderate"
    }
    ```

#### Get Organization Candidates
- **URL**: `GET http://localhost:9092/api/organizations/{organizationId}/candidates`
- **Postman Details**:
  - Method: `GET`

#### Submit Candidate Decision
- **URL**: `POST http://localhost:9092/api/candidates/{candidateId}/decide`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "threshold": 70.0
    }
    ```

### 1.6. Templates & Audits

#### Get Evaluation Templates
- **URL**: `GET http://localhost:9092/api/organizations/{organizationId}/evaluation-templates`
- **Postman Details**:
  - Method: `GET`

#### Create Evaluation Template
- **URL**: `POST http://localhost:9092/api/evaluation-templates`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
        "organizationId": "org_555",
        "name": "Frontend Standard",
        "description": "Standard template for frontend devs.",
        "type": "react",
        "prompt_template": "Evaluate React proficiency..."
    }
    ```

#### Update Evaluation Template
- **URL**: `PUT http://localhost:9092/api/evaluation-templates/{id}`
- **Postman Details**:
  - Method: `PUT`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
        "name": "Frontend Standard V2",
        "description": "Updated standard template.",
        "prompt_template": "Evaluate React proficiency with hooks..."
    }
    ```

#### Delete Evaluation Template
- **URL**: `DELETE http://localhost:9092/api/evaluation-templates/{id}?organizationId={org_id}`
- **Postman Details**:
  - Method: `DELETE`

#### Get Audit Logs
- **URL**: `GET http://localhost:9092/api/organizations/{organizationId}/audit-logs`
- **Postman Details**:
  - Method: `GET`

---

## 2. Python AI Engine Endpoints (Port 8000)
*(Usually internal, but accessible for testing)*

#### Health Check
- **URL**: `GET http://localhost:8000/`
- **Postman Details**:
  - Method: `GET`

#### Parse CV
- **URL**: `POST http://localhost:8000/parse/cv`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "candidate_id": "cand_999",
      "r2_object_key": "candidates/cand_999/resume.pdf",
      "job_id": "job_111",
      "required_skills": ["Python", "FastAPI"]
    }
    ```

#### Evaluate Answer & Privacy Redaction
- **URL**: `POST http://localhost:8000/evaluate`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "candidate_answer": "I worked at Google in New York.",
      "question": "Where did you work?",
      "model_answer": "They worked at a tech company.",
      "experience_level": "Junior",
      "strictness": "Moderate"
    }
    ```

#### Generate Rejection Email
- **URL**: `POST http://localhost:8000/generate/rejection-email`
- **Postman Details**:
  - Method: `POST`
  - Body Type: `raw` (JSON)
  - Payload:
    ```json
    {
      "candidate_name": "John Doe",
      "job_title": "Senior Backend Engineer",
      "summary_feedback": "Lacked experience with Microservices and Kubernetes deployment."
    }
    ```

#### Reveal Secure Candidates PDF Link
- **URL**: `GET http://localhost:8000/reveal/{candidate_id}`
- **Postman Details**:
  - Method: `GET`
