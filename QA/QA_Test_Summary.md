# QA Test Summary: Beerenberg Time Management System

**Owner:** Hasitha (QA & Test Automation)
**Scope:** Sprints 0 to 3, kiosk clocking, Award Rules Engine, supervisor override

## 1. QA approach
- Test plan defined in Sprint 0 (SCRUM-15) and executed per sprint.
- Black-box API testing of the kiosk endpoints with curl and MySQL Workbench evidence.
- UI testing of the admin portal and kiosk flows.
- Defects are raised in Jira as BUG tickets and linked to the sprint ticket.

## 2. Test areas
| Area | Sprint | Jira | Notes |
|------|--------|------|-------|
| Admin portal core (API and UI) | 1 | SCRUM-22 | Login, roles, staff management |
| Kiosk UI identification and clocking | 2 | SCRUM-28 | PIN verify, clock in/out, breaks |
| Overtime, penalties, supervisor override | 3 | SCRUM-34 | Break rule, 8 h cap, PIN override |

## 3. Key business rules verified
- A break longer than 20 minutes is unpaid and is deducted from net hours.
- Standard hours are capped at 8.0 per day; hours above that are overtime and flagged.
- The weekly threshold comes from the contract, with a default of 38 hours.
- A supervisor override needs a valid PIN and a mandatory reason, and it is recorded as a manual entry.

## 4. Known issues found by QA
See the BUG tickets linked to SCRUM-34 in Jira. Each has steps to reproduce, expected vs actual result, and evidence.

## 5. How to run the manual checks
1. Start the stack with `docker compose up`.
2. Open the admin portal on port 5173 and the kiosk on port 5174.
3. Follow the test cases in the Master Test Plan.

## 6. Limitations
- Timing and performance were not measured.
- The camera and QR flow is out of scope for this release.
