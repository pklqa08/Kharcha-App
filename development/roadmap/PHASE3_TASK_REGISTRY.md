# PHASE 3 – Transaction Engine Roadmap

**Project:** Kharcha
**Phase:** 3
**Status:** Active

---

# Objective

Phase 3 transforms the application from a basic expense tracker into a fully normalized transaction engine.

All transaction-related functionality must be implemented through clean architecture using:

- Domain layer
- Application layer
- Repository abstraction
- Infrastructure implementation
- UI integration only after engine completion

Every engine follows the same staged implementation model:

- Stage A — Domain
- Stage B — Repository
- Stage C — Resolution/Application Service
- Stage D — Transaction Integration
- Stage E — Verification

---

# Completed Tasks

## TASK-301.1 — Universal Transaction Model

Status

✅ Complete

Purpose

Defines the canonical transaction model shared across the application.

Includes

- Transaction entity
- Transaction interfaces
- Domain model
- Repository contract

---

## TASK-301.2 — Transaction Service

Status

✅ Complete

Purpose

Implements transaction CRUD using repository abstraction.

Includes

- Create
- Update
- Delete
- Read
- Repository integration

---

## TASK-301.3 — Merchant Engine

Status

✅ Complete

Stages

- ✅ Stage A — Merchant Domain
- ✅ Stage B — Merchant Repository
- ✅ Stage C — Merchant Resolution
- ✅ Stage D — Transaction Integration
- ✅ Stage E — Verification

Features

- Merchant normalization
- Merchant repository
- Merchant resolution
- Canonical merchant IDs
- Transaction merchant integration

---

## TASK-301.4 — Category Engine

Status

✅ Complete

Stages

- ✅ Stage A — Category Domain
- ✅ Stage B — Category Repository
- ✅ Stage C — Category Resolution
- ✅ Stage D — Transaction Integration
- ✅ Stage E — Verification

Features

- Category normalization
- Category repository
- Category resolution
- Canonical category IDs
- Transaction category integration

---

# Current Tasks

---

## TASK-301.5 — Bank Engine

Status

Planned

Purpose

Normalize banks used by transactions.

Stages

### Stage A

- Bank domain entity
- Bank normalization
- IBankRepository

### Stage B

- SQLite Bank Repository

### Stage C

- Bank Resolution Service

### Stage D

- Transaction Integration

### Stage E

- Verification

Deliverables

- Canonical bank IDs
- Bank normalization
- Bank reuse
- Repository abstraction

---

## TASK-301.6 — Account Engine

Status

Planned

Purpose

Normalize user accounts.

Stages

### Stage A

- Account domain
- Account repository contract

### Stage B

- SQLite repository

### Stage C

- Account resolution

### Stage D

- Transaction integration

### Stage E

- Verification

Deliverables

- Canonical account IDs
- Account reuse
- Repository abstraction

---

## TASK-301.7 — Transaction Sources

Status

Planned

Purpose

Track where a transaction originated.

Examples

- Manual
- SMS
- OCR
- CSV
- Import
- Bank Sync
- API

Deliverables

- Source entity
- Source metadata
- Source persistence

---

## TASK-301.8 — Transaction Validation

Status

Planned

Purpose

Centralize transaction validation.

Includes

- Required fields
- Amount validation
- Date validation
- Duplicate checks
- Domain rules

---

## TASK-301.9 — Transaction Search

Status

Planned

Purpose

Provide full transaction search.

Includes

- Merchant
- Category
- Bank
- Account
- Notes
- Amount
- Date

---

## TASK-301.10 — Transaction Filtering

Status

Planned

Includes

- Date range
- Category
- Merchant
- Bank
- Account
- Tags
- Status

---

## TASK-301.11 — Transaction Sorting

Status

Planned

Includes

- Date
- Amount
- Merchant
- Category
- Created
- Updated

Ascending and descending.

---

## TASK-301.12 — Transaction History

Status

Planned

Purpose

Provide audit history.

Includes

- Create
- Update
- Delete
- Restore
- Version history

---

# Architecture Rules

Every engine must follow:

```
Domain
        ↓
Application
        ↓
Repository Interface
        ↓
SQLite Repository
        ↓
Transaction Service
        ↓
UI
```

Never reverse dependencies.

---

# Clean Architecture Rules

Allowed

- Domain depends on nothing.
- Application depends on domain.
- Infrastructure depends on domain.
- UI depends on application.

Forbidden

- Domain → SQLite
- Domain → React
- Domain → Expo
- Domain → Provider
- Application → SQLite
- UI → Repository

---

# Backward Compatibility Rules

Every stage must preserve:

- Existing transaction IDs
- Existing merchant IDs
- Existing category IDs
- Existing bank IDs
- Existing account IDs

Never introduce breaking schema changes during an engine implementation.

No migration unless explicitly planned.

---

# Copilot Implementation Rules

Every implementation begins with:

1. Repository inspection
2. Architecture review
3. Gap analysis

Then implement only one stage.

Never implement multiple stages together.

Every stage ends with:

- TypeScript validation
- git diff --check
- Architecture review
- Compatibility review

No commits.

No pushes.

No merges.

---

# Phase Completion Criteria

Phase 3 is complete when:

- Universal Transaction Model
- Transaction Service
- Merchant Engine
- Category Engine
- Bank Engine
- Account Engine
- Transaction Sources
- Transaction Validation
- Transaction Search
- Transaction Filtering
- Transaction Sorting
- Transaction History

are fully implemented, verified, and integrated.