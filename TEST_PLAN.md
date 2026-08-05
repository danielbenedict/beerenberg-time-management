# Beerenberg Time Management System — Master Test Plan & QA Strategy

## 1. Executive Summary & Strategy Scope
This Master Test Plan outlines the end-to-end Quality Assurance (QA) strategy for the Beerenberg Time Management System across all 5 implementation sprints. 

Because the system manages payroll compliance, operational clocking, and supervisor overrides, testing focuses heavily on **auditability**, **data integrity**, and **fault tolerance** across the whole architecture.

---

## 2. Testing Levels & Execution Framework

| Testing Level | Scope / Target | Primary Tooling | Trigger / Cadence |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | Individual backend controllers, utility functions, state logic. | Jest / Vitest | Automated on every local `git commit` and GitHub Actions CI. |
| **API Contract Testing** | REST endpoints (`/api/v1/*`), request/response schema validation, HTTP codes. | Postman / Supertest | Triggered on PR submission to `dev` or `main`. |
| **Kiosk UI Verification** | Touch navigation, PIN validation, camera capture timeout, offline queuing. | Playwright / Cypress | Automated E2E test runs prior to sprint reviews. |
| **Database Compliance** | Trigger execution, immutable `audit_logs`, timestamp precision. | Custom SQL Scripts | Scheduled during DB schema migration pushes. |

---

## 3. High-Priority Compliance & Edge-Case Matrix

| Test ID | Module | Scenario / Feature | Test Input / Action | Expected Outcome | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-KSK-01** | Kiosk | Clock In via Valid PIN | Enter 4-digit PIN and tap **Clock In**. | Record inserted into `clock_events` with server UTC timestamp; success feedback shown in < 1.5s. | **Critical** |
| **TC-KSK-02** | Kiosk | Camera Hardware Timeout | Disable camera or delay capture response > 3000ms during clock-in. | Kiosk gracefully falls back to PIN-only mode without crashing; logs warning flag to payload. | **High** |
| **TC-KSK-03** | Kiosk | Rapid Double-Tap | Tap **Clock In** twice in rapid succession (< 500ms apart). | UI debounces submit button; exactly **one** clock record is generated in backend. | **High** |
| **TC-ADM-01** | Admin Portal | Supervisor Manual Override | Supervisor edits an existing clock-in timestamp in Admin Portal with reason string. | Update succeeds in `clock_events`; trigger automatically writes original and new state into `audit_logs`. | **Critical** |
| **TC-ADM-02** | Admin Portal | Override Without Reason | Supervisor attempts to save timestamp edit with empty reason field. | Backend rejects request with `HTTP 400 Bad Request`; database update aborted. | **High** |
| **TC-SEC-01** | API | Unauthorized Access | Non-supervisor user attempts `PATCH /api/v1/clock-events/{id}`. | API returns `HTTP 403 Forbidden`; event flagged in security log. | **Critical** |
| **TC-SEC-02** | Database | Audit Log Immutability | Attempt to issue `DELETE` or `UPDATE` directly on `audit_logs` table. | Database engine rejects query via strict user permissions and triggers. | **Critical** |

---

## 4. Defect Severity Classifications
* **Blocker / Critical:** Core clock-in functionality down or audit log failure. Immediate fix required (SLA < 4 hrs).
* **High:** Administrative feature failing without manual workaround (SLA < 24 hrs).
* **Medium:** Non-critical UI glitch or validation feedback issue (Fix before Sprint end).
* **Low:** Minor cosmetic or alignment issue (Backlog).