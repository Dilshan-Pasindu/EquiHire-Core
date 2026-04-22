Introduction to EquiHire
The Problem

The technical recruitment landscape in Sri Lanka faces several systemic challenges that hinder fair and effective talent evaluation. These challenges can be categorized into three key bottlenecks:

1. The “Pedigree Effect” (Institutional Bias)

Recruitment decisions are often influenced by unconscious bias toward candidates from prestigious universities (e.g., University of Moratuwa, University of Colombo). As a result, highly capable candidates from regional institutions (e.g., Rajarata, Ruhuna) are frequently overlooked. This bias typically manifests at the CV screening stage, preventing skilled individuals from progressing to technical evaluation.

2. Inefficient Manual Screening

HR professionals are required to process a high volume of applications, leading to reliance on inefficient filtering techniques such as keyword matching or superficial metrics. These approaches fail to accurately assess a candidate’s true technical ability and problem-solving skills.

3. The “Black Box” of Rejection

Candidates who are rejected rarely receive meaningful feedback. This lack of transparency prevents them from understanding whether the rejection was due to insufficient technical knowledge or simply missing specific keywords, ultimately limiting opportunities for professional growth.

The Solution: Context-Aware Assessment Engine

EquiHire is an AI-native blind assessment platform designed to eliminate bias and improve the accuracy of technical hiring. It functions as an objective “Bias Firewall”, ensuring that hiring decisions are based solely on technical merit.

Instead of relying on traditional CV screening, candidates complete a secure, controlled technical assessment. The platform anonymizes candidate identity and evaluates responses using semantic analysis, ensuring fairness and objectivity throughout the process.

Core Feature: Context-Aware Assessment Engine

Technology Stack:
Ballerina Swan Lake, Google Gemini API, HuggingFace API

Functionality Overview

The Context-Aware Assessment Engine leverages robust service orchestration and AI-driven evaluation to deliver accurate and unbiased candidate assessments:

1. CV Parsing & Context Extraction
Raw CV data is extracted using Apache PDFBox.
The extracted text is processed by Google Gemini Flash.
Gemini structures the data into a standardized JSON format, identifying:
Personally Identifiable Information (PII)
Candidate experience level
Technical skill set
2. Zero-Shot Relevance Gate
Candidate responses are securely stored and pre-processed with PII redaction.
Responses are evaluated using HuggingFace’s bart-large-mnli model.
Answers with low relevance (confidence score < 0.45) are automatically scored zero.
This step optimizes system efficiency by filtering out irrelevant submissions before deeper analysis.
3. Adaptive Scoring & Feedback
Relevant responses are evaluated by Google Gemini in the context of the candidate’s experience level.
The system generates:
A final redacted answer
A technical score
A personalized Growth Report with actionable feedback
System Architecture

The EquiHire platform is designed using a modular, scalable architecture aligned with the C4 Model (Container Diagram) approach.

The system consists of:

Microservices responsible for processing, orchestration, and evaluation
SaaS integrations for AI-powered analysis and document processing
A unified AI Engine that coordinates context extraction, validation, scoring, and feedback generation

This architecture ensures high reliability, scalability, and seamless integration between components while maintaining strict data privacy and bias control.

```mermaid
graph TB
    %% --- USERS ---
    subgraph Users
        candidate[Candidate]
        recruiter[Recruiter]
        admin[IT Admin]
    end

    %% --- EXTERNAL SAAS ---
    subgraph External Managed Services
        auth[WSO2 Asgardeo<br/>(Identity & Access Mgmt)]
        storage[(Cloudflare R2<br/>Secure Object Storage)]
        db[(PostgreSQL<br/>Supabase Managed DB)]
        gemini[Google Gemini API<br/>(CV Parse, Scoring & Feedback)]
        huggingface[HuggingFace API<br/>(bart-large-mnli Relevance Gate)]
    end

    %% --- INTERNAL SYSTEM ---
    subgraph EquiHire Cloud Environment [WSO2 Choreo Environment]
        
        %% Frontend Container
        webapp[Frontend SPA<br/>React + Vite + Tailwind]
        
        %% Backend Containers
        subgraph Backend Microservice
            gateway[Unified API & AI Integrator<br/>Ballerina Swan Lake]
        end
    end

    %% --- CONNECTIONS ---

    %% 1. Authentication Flow
    candidate -- "1. Auth / Magic Link" --> auth
    recruiter -- "Auth (OIDC)" --> auth
    auth -- "JWT Token" --> webapp

    %% 2. User Interactions
    candidate -- "2. Takes Lockdown Exam<br/>(HTTPS/WSS)" --> webapp
    recruiter -- "Views Dashboard / Grades<br/>(HTTPS)" --> webapp
    admin -- "Configures Bias Blocklist<br/>(HTTPS)" --> webapp

    %% 3. Frontend to Gateway
    webapp -- "3. API Calls (REST/JSON)<br/>with Bearer Token" --> gateway

    %% 4. Backend Processing
    gateway -- "Read/Write Job/Exam Data" --> db

    %% 5. Secure Storage & Extraction
    gateway -- "Generate Presigned URL" --> webapp
    webapp -- "5a. Direct Secure Upload (CV PDF)" --> storage
    gateway -- "5b. Read CV & PDFBox Text Extraction" --> storage
    gateway -- "5c. Core CV Parse & PII Map" --> gemini
    gemini -- "5d. Parsed Sections & Context JSON" --> gateway

    %% 6. Grading AI Processing Flow
    gateway -- "6a. Pre-redact & Relevance Gate" --> huggingface
    huggingface -- "6b. Relevance Confidence Score" --> gateway
    gateway -- "7a. Single-Shot Grading Call (If relevant)" --> gemini
    gemini -- "7b. Scoring & Feedback JSON" --> gateway

    %% 7. Data Persistence Flow
    gateway -- "8. Validate JSON & Save Redacted Text, Limits, Cheats & Scores" --> db

    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px,color:black;
    classDef saas fill:#d4edda,stroke:#28a745,stroke-width:2px,color:black;
    classDef container fill:#cce5ff,stroke:#007bff,stroke-width:2px,color:black;
    classDef component fill:#e2e3e5,stroke:#6c757d,stroke-width:1px,color:black;

    class candidate,recruiter,admin user;
    class auth,storage,db,gemini saas;
    class webapp,gateway,IntelligenceEngine container;
    class controller,wrapper component;
```

### Architectural Highlights

1.  **Hybrid Cloud Approach:** We adopted a Hybrid Cloud architecture deployed on **WSO2 Choreo**, separating core logic from managed SaaS providers (Supabase, external AI APIs) to ensure scalability and security.
2.  **Unified Microservice Core:**
    *   **Ballerina Backend:** Acts as a powerful integration hub, handling high-concurrency API traffic, Java interoperability (Apache PDFBox for PDF reading), routing, and identity management with WSO2 Asgardeo. It heavily utilizes Ballerina's native JSON data-binding for strict schema enforcement and retry logic across LLM boundaries.
3.  **Composite AI Layer:** An integration of varied models including **HuggingFace** connector models (`bart-large-mnli`) for fast zero-shot candidate answer screening alongside **Google Gemini Flash** for deep structural extraction (CV parsing) and final adaptive scoring feedback.
4.  **Zero-Trust "Vault" Data Flow:** CVs are uploaded directly to **Cloudflare R2** via Presigned URLs. Raw answers are saved in an isolated answer vault *before* any AI processing begins, guaranteeing no candidate data is lost to downstream generation failures.

