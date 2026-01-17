# Project: Global Creator–Editor Marketplace (MVP)

## Vision
Build a fast, trusted platform where global creators get affordable, reliable video editors.
Core problems solved:
- Editor ghosting
- Late delivery
- Unsafe file sharing
- Expensive foreign editors

Primary market: Foreign creators
Primary supply: Indian editors

---

## Roles
1. Creator
2. Editor
3. Admin

---

## Core Workflow (FINAL – MVP)

### Creator Flow
1. Creator records video (example: 30–60 min raw footage).
2. Creator creates an order:
   - Uploads raw video directly (Drive/Dropbox Link)
   - OR pastes Drive/Dropbox link
   - Adds brief + reference video link
   - Sets deadline (e.g. 4 days)
   - Sets budget
3. Creator submits order → payment authorized (not released).
4. Creator waits for editor delivery.
5. Creator reviews preview inside browser.
6. Creator leaves timestamp-based comments.
7. Creator approves final version.
8. Final file unlocks / downloadable.

---

### Editor Flow
1. Editor browses OPEN orders.
2. Editor applies / accepts job.
3. Editor stake is locked (₹500–₹2000 equivalent).
4. Editor downloads raw footage via signed URL or Drive link.
5. Editor uploads preview (V1).
6. Editor fixes comments → uploads V2.
7. On approval → stake unlocks + payout triggered.

---

### Admin Flow
1. View all orders.
2. Assign editor manually if needed.
3. Handle disputes.
4. Manually release payment (MVP).
5. Penalize editor stake if ghosting.

---

## Order Status Flow
DRAFT → OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED → REVISION_REQUESTED → COMPLETED  
Fallback:
- CANCELLED
- DISPUTED

---

## MVP Features ONLY
- Auth: Email + Google
- Creator dashboard
- Editor dashboard
- Order workflow
- File upload (Drive/Dropbox Links)
- Drive/Dropbox link support
- In-order chat
- Admin panel
- Manual payment release

---

## Explicitly NOT in MVP
- Auto editor matching
- YouTube auto upload
- Watermarking
- ML matching
- Mobile app

---

## Tech Stack (LOCKED)
Frontend:
- React + Vite
- Tailwind CSS

Backend:
- Node.js
- Express
- Prisma ORM

Database:
- PostgreSQL

Storage:
- Zero Storage (Google Drive / Dropbox Links)

Payments:
- Razorpay
- Manual release for MVP

Realtime:
- Simple DB-based chat OR Firebase

---

## Existing Work
- Prisma schema already designed (shared separately).
- No folder structure generated yet.
- No APIs implemented yet.

---

## Rules for AI
- Do NOT over-engineer.
- MVP speed > perfection.
- One module at a time.
