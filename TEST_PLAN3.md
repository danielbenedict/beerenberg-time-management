# Beerenberg Time Management System — Master Test Plan & QA Strategy v02

## 1. Executive Summary & Strategy Scope
This Master Test Plan outlines the end-to-end Quality Assurance (QA) strategy for the Beerenberg Time Management System across all implementation sprints.

Because the system manages payroll compliance, Fair Work Australia award calculations, operational clocking, and supervisor overrides, testing focuses heavily on **auditability**, **data integrity**, **calculation precision**, and **fault tolerance** across the entire 3-tier architecture.

---

## 2. Testing Levels & Execution Framework

| Testing Level | Scope / Target | Primary Tooling | Trigger / Cadence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Unit & Integration Testing** | Individual controllers, Award Rules Engine (`getUserWorkHours`), math/penalty rules, utility functions. | Jest / Vitest / `curl` CLI and test directly on the interface and mysql | Automated on local `git commit` and GitHub Actions CI (`.github/workflows/ci.yml`). | **Active** |
| **API Contract Testing** | REST endpoints (`/api/v1/*`), request/response schema validation, HTTP status codes (`200 OK`, `400 Bad Request`, `403 Forbidden`). | Postman / `curl`and test directly on the interface and mysql / Supertest | Triggered on PR submission to `dev` or `main`. | **Active** |
| **Kiosk & Admin UI Verification** | Touch navigation, PIN validation, modal form submissions, state management, and real-time alert badges. | Browser DevTools (`F12`) / Playwright and test directly on the interface and mysql| Executed prior to sprint reviews and milestone sign-offs. | **Active** |
| **Database Compliance & Data Types** | Column length checks (`verification_method`), relational foreign key constraints, `is_manual_entry` flags, audit logging. | MySQL Workbench / Custom SQL Scripts | Scheduled during DB schema migrations and model updates. | **Active** |

---

## 3. High-Priority Compliance & Edge-Case Matrix (Sprints 1–4)

### **Sprint 1: Core Architecture, JWT Auth & Staff/Roster Management**

| Test ID | Module | Scenario / Feature | Test Input / Action | Expected Outcome | Actual Result | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ADM-02** | Admin Portal | Role ID Data Type Mapping | Submit **Add Staff** modal using role select dropdown. | Form sends integer `role_id` (e.g., `1`, `2`) instead of string (`'Staff'`), preventing MySQL `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` (`errno 1366`). | **PASSED** | **High** |

---

### **Sprint 2: Time Station Kiosk UI & Event Clocking**

| Test ID | Module | Scenario / Feature | Test Input / Action | Expected Outcome | Actual Result | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-KSK-01** | Kiosk | Clock In via Valid PIN | Enter 4-digit PIN and tap **Clock In**. | Record inserted into `clock_events` with server timestamp; success feedback shown in $< 1.5\text{s}$. | **PASSED** | **Critical** |
| **TC-KSK-02** | Kiosk | Camera Hardware Timeout | Disable camera or delay capture response $> 3000\text{ms}$. | Kiosk gracefully falls back to PIN-only mode without crashing; logs warning flag. | **PASSED** | **High** |
| **TC-KSK-03** | Kiosk | Rapid Double-Tap | Tap **Clock In** twice in rapid succession ($< 500\text{ms}$). | UI debounces submit button; exactly **one** clock record generated in backend. | **PASSED** | **High** |

---

### **Sprint 3: Work Rules Engine, Supervisor Overrides & Audit Trail**

| Test ID | Module | Scenario / Feature | Test Input / Action | Expected Outcome | Actual Result | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AWD-01** | Rules Engine | Unpaid Meal Break Deduction | Clock events spanning $> 20\text{ mins}$ break duration (e.g., 30-min lunch). | Rules Engine automatically categorizes break as unpaid and deducts $0.5\text{ hrs}$ from net worked hours. | **PASSED** | **Critical** |
| **TC-AWD-02** | Rules Engine | Daily Overtime Threshold | Net worked hours exceeding $8.0\text{ hrs}$ in a single workday (e.g., $9.0\text{ net hrs}$). | Standard hours capped at $8.0\text{ hrs}$; excess ($1.0\text{ hr}$) flagged as daily overtime (`isDailyOvertimeFlagged: true`). | **PASSED** | **Critical** |
| **TC-ADM-01** | Admin Portal | Supervisor Manual Override | Supervisor submits manual clock entry with target staff, adjusted date/time, audit reason, and supervisor PIN. | Override succeeds (`is_manual_entry = TRUE`, `verification_method = 'SUPERVISOR_OVERRIDE'`); audit entry written to database. | **PASSED** | **Critical** |
| **TC-SEC-01** | API Security | Invalid Supervisor PIN | Submit manual clock override with incorrect or non-supervisor PIN. | Backend rejects request with `HTTP 403 Forbidden`; DB insertion aborted. | **PASSED** | **Critical** |
| **TC-DB-01** | Database | Long String Column Expansion | Insert `'SUPERVISOR_OVERRIDE'` string into `verification_method`. | `ALTER TABLE clock_events MODIFY COLUMN verification_method VARCHAR(50)` prevents MySQL truncation warning (`WARN_DATA_TRUNCATED`, `errno 1265`). | **PASSED** | **Critical** |
| **TC-AUD-01** | Admin Portal | Audit Trail Read-Only View | Access **Clock Overrides** tab in Admin Portal (`http://localhost:5173`). | System fetches `GET /api/v1/kiosk/audit-logs` and renders immutable table displaying event ID, timestamp, staff name, event type, and mandatory audit reason. | **PASSED** | **High** |

---

### **Sprint 4: Exception Reporting, Payroll CSV Export & 7-Year Retention**

| Test ID | Module | Scenario / Feature | Test Input / Action | Expected Outcome | Actual Result | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-REP-01** | Reporting | Daily Exception Engine Query | Send `GET /api/v1/reports/exceptions?date=YYYY-MM-DD` with valid JWT token. | Engine aggregates missing clock-outs, unrostered clock-ins, and $> 5.0\text{h}$ break breaches into a structured JSON payload. | **PASSED** | **High** |
| **TC-EXP-01** | Payroll | CSV Stream Export Generation | Request `GET /api/v1/reports/export/csv?startDate=...&endDate=...` from Admin UI. | Server uses `json2csv` to stream structured CSV file directly to browser download (`Content-Type: text/csv`). | **PASSED** | **Critical** |
| **TC-BAC-01** | DevOps / DB | Local 7-Year Retention Backup | Execute `database/backup.bat` against running MySQL instance (`beerenberg-db`). | Generates timestamped SQL dump (`beerenberg_backup_TIMESTAMP.sql`) in persistent host volume path without password truncation or auth errors. | **PASSED** | **Critical** |

---

## 4. Defect Severity Classifications & SLA Matrix
* 🔴 **Critical / Blocker (SLA $< 4$ Hours):** Core clocking functionality down, security breach, rules engine calculation failure, or audit log write failure.
* 🟠 **High (SLA $< 24$ Hours):** Administrative feature broken without a manual workaround or database column width mismatch.
* 🟡 **Medium (Sprint End):** Non-critical UI glitch, layout alignment, or non-blocking validation message.
* 🟢 **Low (Backlog):** Minor cosmetic tweaks or non-functional enhancements.