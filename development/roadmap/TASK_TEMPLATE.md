# TASK-XXX.X — <Task Name>

**Phase:** 3  
**Status:** Planned | In Progress | Complete  
**Priority:** High | Medium | Low

---

# Objective

Describe the purpose of this task.

Explain:

- Why it exists
- Which problem it solves
- What functionality it introduces

---

# Scope

Included

-

-

-

Excluded

-

-

-

---

# Dependencies

Must be completed before this task:

-

-

Required interfaces:

-

-

Required services:

-

-

---

# Architecture

This task must follow Clean Architecture.

```
Domain
        ↓
Application
        ↓
Repository Interface
        ↓
Infrastructure Repository
        ↓
Application Service
        ↓
UI
```

Never violate dependency direction.

---

# Stage A — Domain

Objective

Create the domain foundation.

Deliverables

- Domain entity
- Value objects (if required)
- Repository interface
- Domain services
- Barrel exports

Rules

- No SQLite
- No React
- No Expo
- No Provider
- No Infrastructure

Validation

- TypeScript builds
- No circular dependencies
- Domain layer isolated

Status

☐ Not Started

☐ Complete

---

# Stage B — Repository

Objective

Implement persistence.

Deliverables

- SQLite repository
- Mapping
- CRUD operations

Reuse

- Existing database
- Existing helpers
- Existing repository conventions

Rules

- No UI
- No Provider
- No Application logic

Validation

- TypeScript builds
- Existing persistence preserved
- No schema change unless planned

Status

☐ Not Started

☐ Complete

---

# Stage C — Application Service

Objective

Implement business logic.

Deliverables

- Resolution service
- Lookup service
- Validation service
- Domain orchestration

Rules

Application depends only on:

- Domain
- Repository interfaces

Never import SQLite.

Validation

- Deterministic behavior
- Unit-testable
- No UI dependency

Status

☐ Not Started

☐ Complete

---

# Stage D — Integration

Objective

Integrate with the existing application.

Examples

- Transaction Service
- Import Service
- Sync Service

Rules

- Preserve backward compatibility
- Preserve existing IDs
- Preserve existing data
- No schema change

Validation

- Existing workflows continue working
- Integration tested

Status

☐ Not Started

☐ Complete

---

# Stage E — Verification

Verify

- Architecture
- Compatibility
- TypeScript
- Build
- git diff --check

Regression checklist

- Existing functionality unchanged
- New functionality works
- No unrelated files changed

Status

☐ Not Started

☐ Complete

---

# Acceptance Criteria

The task is complete when:

- [ ] All stages completed
- [ ] TypeScript passes
- [ ] No architecture violations
- [ ] Backward compatibility preserved
- [ ] Manual testing completed
- [ ] Documentation updated

---

# Files

Expected New Files

-

-

-

Expected Modified Files

-

-

-

---

# Risks

Potential risks

-

-

Mitigation

-

-

---

# Copilot Rules

Before implementation

1. Read the relevant roadmap document.
2. Inspect the existing implementation.
3. Perform a gap analysis.
4. Implement only one stage.
5. Validate.

Never

- Implement multiple stages together.
- Modify unrelated modules.
- Redesign architecture without approval.
- Commit automatically.
- Push automatically.
- Merge automatically.

---

# Completion Notes

Implementation Summary

-

-

Verification Summary

-

-

Lessons Learned

-

-

Date Completed

_____________

Implemented By

_____________