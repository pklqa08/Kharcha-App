# TASK-301.5 — Bank Engine

**Phase:** 3  
**Status:** Planned  
**Priority:** High

---

# Objective

Introduce a normalized Bank Engine into the transaction architecture.

The Bank Engine provides a canonical representation of financial institutions used by transactions. Instead of storing arbitrary bank names in every transaction, transactions will reference reusable Bank entities.

The implementation must follow the same architectural pattern established by the Merchant Engine and Category Engine.

---

# Problem Statement

Currently, transactions may contain inconsistent or duplicated bank names.

Examples:

- SBI
- State Bank
- State Bank of India
- STATE BANK OF INDIA

These should all resolve to a single canonical Bank entity.

The Bank Engine will:

- normalize bank names
- reuse existing banks
- avoid duplicate bank records
- prepare the application for future bank synchronization and analytics

---

# Scope

## Included

- Bank domain entity
- Bank normalization
- IBankRepository
- SQLite repository
- Bank Resolution Service
- Transaction integration

## Excluded

- Bank account management
- Bank synchronization
- Open Banking APIs
- OCR integration
- Import engine
- UI redesign

---

# Dependencies

Requires:

- Universal Transaction Model
- Transaction Service
- Merchant Engine
- Category Engine

Must exist before implementation:

- Repository pattern
- Clean Architecture
- SQLite infrastructure

---

# Architecture

```
                 Transaction
                      │
      ┌───────────────┼───────────────┐
      │               │               │
 Merchant         Category         Bank
      │               │               │
 Resolution      Resolution      Resolution
      │               │               │
 Repository      Repository      Repository
      │               │               │
 SQLite          SQLite          SQLite
```

---

# Stage A — Domain

## Objective

Create the Bank domain foundation.

## Deliverables

### Domain Entity

Bank

### Repository Interface

IBankRepository

### Normalization Service

bank-normalization.ts

### Barrel Export

repository/index.ts

---

## Suggested Repository Interface

Methods should include:

- list()
- get(id)
- create()
- update()
- remove()

Future methods may include:

- findByNormalizedName()
- search()

---

## Normalization Rules

Normalize:

- Trim whitespace
- Collapse repeated spaces
- Convert to lowercase
- Unicode normalization

Examples

```
SBI
→ sbi

State Bank Of India
→ state bank of india

 ICICI   BANK
→ icici bank
```

Return `null` for:

- null
- undefined
- empty string

---

## Rules

Do NOT:

- import SQLite
- import React
- import Expo
- import Providers

---

## Validation

- TypeScript builds
- Domain isolated
- No circular dependencies

Status

☐ Not Started

---

# Stage B — Repository

## Objective

Implement SQLite persistence.

## Deliverables

- banks.sqlite.repository.ts

Implement:

- list()
- get()
- create()
- update()
- remove()

Reuse:

- Existing SQLite connection
- Existing repository patterns

---

## Rules

Repository contains persistence only.

Do not implement:

- normalization
- business rules
- transaction integration

---

## Validation

- CRUD works
- Existing schema preserved
- TypeScript passes

Status

☐ Not Started

---

# Stage C — Bank Resolution Service

## Objective

Resolve user input into canonical Bank entities.

Create:

```
bank-resolution.service.ts
```

Dependencies:

- IBankRepository
- bank-normalization.ts

---

## Algorithm

1. Normalize input

2. Empty input

Return:

```
null
```

3. Search existing banks

4. Match found

Return existing Bank.

5. Match not found

Create new Bank.

6. Return canonical Bank.

---

## Rules

Do NOT:

- import SQLite
- depend on UI
- perform database-specific logic

Use repository abstraction only.

---

## Validation

- Existing banks reused
- Duplicate banks prevented
- TypeScript passes

Status

☐ Not Started

---

# Stage D — Transaction Integration

## Objective

Integrate Bank Resolution into Transaction Service.

Flow

```
TransactionInput
        │
Merchant Resolution
        │
Category Resolution
        │
Bank Resolution
        │
Repository Save
```

---

## Requirements

If resolution succeeds:

```
bankId = resolvedBank.id
```

If resolution returns null:

Preserve existing:

```
input.bankId
```

Never overwrite existing IDs with null.

---

## Validation

Verify:

- Existing transactions still work
- Merchant integration unaffected
- Category integration unaffected
- No regression

Status

☐ Not Started

---

# Stage E — Verification

## Architecture Review

Verify:

- Clean Architecture
- Dependency direction
- Repository abstraction
- No infrastructure leakage

---

## Compatibility Review

Ensure:

- Existing data preserved
- Existing IDs preserved
- Existing APIs unchanged

---

## Validation Checklist

Run:

```bash
yarn tsc --noEmit
```

```bash
git diff --check
```

```bash
git status
```

Manual tests:

- Create transaction
- Edit transaction
- Existing bank reused
- New bank created
- Empty bank handled
- Merchant still works
- Category still works

Status

☐ Not Started

---

# Acceptance Criteria

The Bank Engine is complete when:

- [ ] Stage A complete
- [ ] Stage B complete
- [ ] Stage C complete
- [ ] Stage D complete
- [ ] Stage E complete

Additionally:

- [ ] TypeScript passes
- [ ] No architecture violations
- [ ] Backward compatibility preserved
- [ ] Manual regression testing completed

---

# Expected Files

## New Files

```
application/
    services/
        bank-resolution.service.ts

domain/
    repository/
        bank.repository.interface.ts

domain/
    services/
        bank-normalization.ts
```

---

## Modified Files

```
repository/
    index.ts

infrastructure/
    repositories/
        banks.sqlite.repository.ts

application/
    services/
        transaction.service.ts
```

---

# Risks

Potential Risks

- Duplicate bank records
- Breaking transaction creation
- Repository coupling
- Inconsistent normalization

Mitigation

- Normalize before lookup
- Preserve existing IDs
- Reuse repository abstraction
- Validate after every stage

---

# Copilot Implementation Rules

Before every stage:

1. Review repository structure.
2. Review existing implementation.
3. Perform gap analysis.
4. Implement one stage only.
5. Validate.

Never:

- Skip stages.
- Implement multiple stages together.
- Modify unrelated modules.
- Commit automatically.
- Push automatically.
- Merge automatically.

---

# Completion Notes

Implementation Summary

____________________________________

Verification Summary

____________________________________

Lessons Learned

____________________________________

Completed On

____________________

Implemented By

____________________