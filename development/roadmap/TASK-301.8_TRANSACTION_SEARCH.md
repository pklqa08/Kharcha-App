# TASK-301.8 — Transaction Search Engine

Status: Planned

Phase: Phase 3

---

# Objective

Introduce a centralized Transaction Search Engine responsible for querying transactions using reusable search criteria.

The Search Engine must orchestrate transaction retrieval while keeping SQL isolated inside the repository layer.

This engine is responsible only for searching.

It must not:

- normalize entities
- validate transactions
- modify transactions
- persist transactions

---

# Scope

This task introduces:

- Transaction Search Service
- Search Criteria model
- Search Result model
- Repository search methods
- TransactionService search integration

This task does NOT introduce:

- UI changes
- Provider changes
- Validation logic
- Entity Resolution
- Reporting
- Filtering
- Sorting

---

# Dependencies

Completed

✓ Universal Transaction Model

✓ Transaction Engine

✓ Merchant Engine

✓ Category Engine

✓ Bank Engine

✓ Account Engine

✓ Transaction Validation

---

# Architecture

Current Read Flow

UI

↓

TransactionService

↓

TransactionRepository

↓

SQLite

New Flow

UI

↓

TransactionService

↓

TransactionSearchService

↓

TransactionRepository

↓

SQLite

---

# Search Responsibilities

The Search Engine is responsible for:

- keyword search
- merchant search
- category search
- bank search
- account search
- notes search
- description search
- amount search
- date range search
- transaction type search

The Search Engine MUST NOT

- update data
- normalize data
- validate data
- resolve entities

---

# Stage A

Domain

Create

application/models/search-criteria.ts

application/models/search-result.ts

SearchCriteria

Example fields

- keyword
- merchantId
- categoryId
- bankId
- accountId
- transactionType
- startDate
- endDate
- minAmount
- maxAmount

SearchResult

Fields

- items
- totalCount

No repository implementation.

No services.

---

# Stage B

Repository

Extend TransactionRepository.

Add

search(criteria)

Repository implementation performs SQL querying.

Repository is responsible only for persistence.

No business logic.

---

# Stage C

Application

Create

application/services/transaction-search.service.ts

Responsibilities

- validate search criteria
- delegate to repository
- return SearchResult

No SQL.

No SQLite.

No UI.

---

# Stage D

Integration

Integrate TransactionSearchService into

transaction.service.ts

Expose

search(criteria)

Flow

UI

↓

TransactionService

↓

TransactionSearchService

↓

Repository

↓

SQLite

---

# Stage E

Review

Verify

✓ Clean Architecture

✓ Repository isolation

✓ Dependency direction

✓ No SQL outside repository

✓ TypeScript

✓ Backward compatibility

---

# Acceptance Criteria

✓ Search isolated

✓ Repository owns SQL

✓ TransactionService orchestrates

✓ No UI changes

✓ No provider changes

✓ TypeScript passes

✓ Existing features continue working

---

# Risks

Repository receiving business logic.

Mitigation

Search Service performs orchestration.

Repository performs persistence only.

---

# Copilot Rules

Implement one stage only.

Never continue automatically.

Always stop after every stage.

Run

yarn tsc --noEmit

git diff --check

after every stage.

Never modify unrelated files.

Never refactor unrelated code.

Wait for review before continuing.

---

# Expected Files

New

application/models/search-criteria.ts

application/models/search-result.ts

application/services/transaction-search.service.ts

Modified

transaction.repository.interface.ts

transactions.sqlite.repository.ts

transaction.service.ts

No UI changes.

No Provider changes.

No Entity Resolution changes.

No Validation changes.