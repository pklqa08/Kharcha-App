# TASK-301.7 — Transaction Validation Engine

Status: Planned

Phase: Phase 3

---

# Objective

Introduce a centralized Transaction Validation Engine responsible for validating a transaction after all entity resolution has completed and before persistence.

The Validation Engine must not modify transaction data.

It is responsible only for validating business rules and preventing invalid transactions from being persisted.

---

# Scope

This task introduces:

- Transaction Validation Service
- Validation Result model
- Validation integration into TransactionService

This task does NOT introduce:

- UI changes
- Provider changes
- Repository changes
- SQLite changes
- Merchant resolution changes
- Category resolution changes
- Bank resolution changes
- Account resolution changes

---

# Dependencies

Completed:

✓ Universal Transaction Model

✓ Transaction Engine

✓ Merchant Engine

✓ Category Engine

✓ Bank Engine

✓ Account Engine

---

# Architecture

Current flow

Transaction Input

↓

Merchant Resolution

↓

Category Resolution

↓

Bank Resolution

↓

Account Resolution

↓

Repository Save

New flow

Transaction Input

↓

Merchant Resolution

↓

Category Resolution

↓

Bank Resolution

↓

Account Resolution

↓

Transaction Validation

↓

Repository Save

---

# Validation Responsibilities

Validate:

• amount exists

• amount > 0

• transaction date exists

• merchant reference consistency

• category reference consistency

• bank reference consistency

• account reference consistency

• transaction type validity

The validation service MUST NOT:

- modify data
- normalize data
- resolve entities
- persist data

---

# Stage A

Domain

Create:

application/models/validation-result.ts

Define:

ValidationResult

Fields:

- valid
- errors

No implementation outside the model.

---

# Stage B

Application

Create:

application/services/transaction-validation.service.ts

Implement:

validate(transaction)

Return:

ValidationResult

Rules:

- amount > 0
- date exists
- transaction type exists
- resolved IDs remain valid
- return validation errors

No repository usage.

---

# Stage C

Integration

Integrate validation into:

transaction.service.ts

Flow

Merchant

↓

Category

↓

Bank

↓

Account

↓

Validation

↓

Save

If validation fails:

Stop.

Do not save.

Return validation errors.

---

# Stage D

Review

Verify:

✓ Clean Architecture

✓ Dependency direction

✓ Validation isolation

✓ No repository leakage

✓ No UI coupling

✓ TypeScript

---

# Acceptance Criteria

✓ Validation isolated

✓ Repository unchanged

✓ TransactionService only orchestrates

✓ No UI changes

✓ No Provider changes

✓ Validation before persistence

✓ Existing tests compile

✓ yarn tsc --noEmit passes

---

# Risks

Validation becoming business logic.

Mitigation:

Validation only verifies.

No mutations.

---

# Copilot Rules

Implement one stage only.

Never continue automatically.

Always stop after validation.

Run:

yarn tsc --noEmit

git diff --check

after every stage.

Never modify unrelated files.

Never refactor unrelated code.

Wait for review after every stage.

---

# Completion Notes

Expected new files

application/models/validation-result.ts

application/services/transaction-validation.service.ts

Modified

application/services/transaction.service.ts

No infrastructure changes.

No repository changes.

No database changes.

No provider changes.
