# TASK-301.6 — Account Engine

**Phase:** 3
**Status:** Planned
**Priority:** High

---

# Objective

Introduce a normalized Account Engine into the transaction architecture.

The Account Engine provides a canonical representation of financial accounts used by transactions. Instead of storing arbitrary account names throughout the application, transactions will reference reusable Account entities.

The implementation must follow the same architectural pattern established by the Merchant Engine, Category Engine, and Bank Engine.

---

# Problem Statement

Currently, transactions may contain inconsistent or duplicated account names.

Examples

- Salary Account
- salary account
- SALARY ACCOUNT
- Salary A/C

These should resolve to a single canonical Account entity.

The Account Engine will:

- normalize account names
- reuse existing accounts
- avoid duplicate account records
- prepare the application for future account synchronization and reporting

---

# Scope

## Included

- Account domain entity
- Account normalization
- IAccountRepository
- SQLite repository
- Account Resolution Service
- Transaction integration

## Excluded

- Bank synchronization
- Open Banking APIs
- Balance reconciliation
- Statement import
- UI redesign
- Analytics enhancements

---

# Dependencies

Requires

- Universal Transaction Model
- Transaction Engine
- Merchant Engine
- Category Engine
- Bank Engine

Must already exist

- Repository pattern
- Clean Architecture
- SQLite infrastructure

---

# Architecture

```
                 Transaction
                      │
      ┌───────────────┼────────────────────┐
      │               │                    │
 Merchant         Category              Bank
      │               │                    │
      └───────────────┼────────────────────┘
                      │
                  Account
                      │
             Account Resolution
                      │
              IAccountRepository
                      │
              SQLite Repository
```

---

# Stage A — Domain

## Objective

Create the Account domain foundation.

## Deliverables

### Repository Interface

IAccountRepository

### Normalization Service

account-normalization.ts

### Repository Barrel Export

Update repository exports.

---

## Repository Interface

Implement:

- list()
- get()
- create()
- update()
- remove()

Future methods may include:

- search()
- findByNormalizedName()
- findByBank()

---

## Normalization Rules

Normalize by:

- trim whitespace
- collapse repeated spaces
- lowercase
- Unicode normalization

Return `null` for:

- null
- undefined
- empty string

Examples

```
Salary Account
→ salary account

 SAVINGS   ACCOUNT
→ savings account

Current A/C
→ current a/c
```

---

## Rules

Do NOT:

- import SQLite
- import React
- import Expo
- import Providers

---

## Validation

- TypeScript passes
- Domain isolated
- No circular dependencies

Status

☐ Not Started

---

# Stage B — Repository

## Objective

Implement SQLite persistence.

Create

```
accounts.sqlite.repository.ts
```

Implement

- list()
- get()
- create()
- update()
- remove()

Reuse

- existing SQLite helpers
- repository conventions
- existing schema where applicable

---

## Rules

Repository contains persistence only.

Do NOT implement

- normalization
- resolution
- transaction logic

---

## Validation

- CRUD operations verified
- TypeScript passes
- No schema redesign unless required

Status

☐ Not Started

---

# Stage C — Account Resolution Service

## Objective

Create

```
account-resolution.service.ts
```

Dependencies

- IAccountRepository
- account-normalization.ts

---

## Algorithm

1. Normalize input.

2. Empty value

Return:

```
null
```

3. Search existing accounts.

4. Existing account found

Return existing Account.

5. Otherwise

Create new Account.

6. Return canonical Account.

---

## Rules

Do NOT:

- import SQLite
- depend on UI
- modify repositories

Use repository abstraction only.

---

## Validation

- Existing accounts reused
- Duplicate accounts prevented
- TypeScript passes

Status

☐ Not Started

---

# Stage D — Transaction Integration

## Objective

Integrate Account Resolution into Transaction Service.

Flow

```
Transaction Input
        │
Merchant Resolution
        │
Category Resolution
        │
Bank Resolution
        │
Account Resolution
        │
Repository Save
```

---

## Requirements

If resolution succeeds

```
accountId = resolvedAccount.id
```

If resolution returns null

Preserve

```
input.accountId
```

Never overwrite an existing accountId with null.

Do NOT modify

- Merchant logic
- Category logic
- Bank logic
- UI
- Providers

---

## Validation

Verify

- Existing transaction creation
- Existing transaction update
- Merchant resolution
- Category resolution
- Bank resolution
- Account resolution

Status

☐ Not Started

---

# Stage E — Verification

## Architecture Review

Verify

- Clean Architecture
- Dependency direction
- Repository abstraction
- No infrastructure leakage

---

## Compatibility Review

Ensure

- Existing data preserved
- Existing IDs preserved
- Existing APIs unchanged

---

## Validation Checklist

Run

```bash
yarn tsc --noEmit
```

```bash
git diff --check
```

```bash
git status
```

Manual regression

- Create transaction
- Edit transaction
- Existing account reused
- New account created
- Empty account handled
- Merchant resolution works
- Category resolution works
- Bank resolution works

Status

☐ Not Started

---

# Acceptance Criteria

The Account Engine is complete when

- [ ] Stage A complete
- [ ] Stage B complete
- [ ] Stage C complete
- [ ] Stage D complete
- [ ] Stage E complete

Additionally

- [ ] TypeScript passes
- [ ] No architecture violations
- [ ] Backward compatibility preserved
- [ ] Manual regression completed

---

# Expected Files

## New Files

```
frontend/src/application/services/account-resolution.service.ts

frontend/src/domain/interfaces/repositories/account.repository.interface.ts

frontend/src/domain/services/account-normalization.ts

frontend/src/infrastructure/repositories/accounts.sqlite.repository.ts
```

---

## Modified Files

```
frontend/src/application/services/index.ts

frontend/src/application/services/transaction.service.ts

frontend/src/domain/interfaces/repositories/index.ts

frontend/src/infrastructure/repositories/repos.ts
```

---

# Risks

Potential Risks

- Duplicate account records
- Incorrect account normalization
- Transaction regression
- Repository coupling

Mitigation

- Normalize before lookup
- Preserve existing IDs
- Use repository abstraction only
- Validate every stage independently

---

# Copilot Implementation Rules

Before every stage

1. Read this roadmap document.
2. Review the existing repository.
3. Perform a gap analysis.
4. Implement one stage only.
5. Validate.

Never

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