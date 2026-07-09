# KHARCHA - SPEC-000

## Feature

Project Folder Structure Refactoring

---

## Goal

Refactor the existing Kharcha project into a professional enterprise project structure.

This task MUST NOT change application behavior.

This task MUST NOT change UI.

This task MUST NOT change navigation.

This task MUST NOT modify business logic.

Only improve project organization.

---

## Context

Kharcha is an Enterprise Personal Finance Management application.

The project will continue to grow for several years.

Future modules include

• SMS Reader

• Notification Listener

• Duplicate Detection

• Merchant Learning

• AI Categorization

• Analytics

• Cloud Sync

The project structure must support long-term scalability.

---

## Objective

Analyze the current project.

Identify existing folders.

Move files into a cleaner structure.

Update imports automatically.

Preserve functionality.

---

# TARGET PROJECT STRUCTURE

```
Kharcha-App

docs/

development/

frontend/

backend/

README.md
```

---

Inside development

```
development

architecture

roadmap

copilot

changelog
```

---

Inside copilot

```
copilot

master_prompt.md

prompts

completed

reviews
```

---

Inside prompts

```
prompts

phase3

phase4

phase5

phase6

phase7

phase8

phase9

phase10
```

---

Inside docs

```
docs

01_Project_Vision

02_PRD

03_SRS

04_Database

05_Architecture

06_UI_UX

07_API

08_Testing

09_Deployment

10_Developer_Guide
```

---

# FRONTEND STRUCTURE

Analyze the existing frontend.

Organize into

```
src

application

domain

infrastructure

presentation

shared

config

assets
```

---

Inside application

```
application

providers

usecases

services
```

---

Inside domain

```
domain

entities

interfaces

value_objects

repositories
```

---

Inside infrastructure

```
infrastructure

database

repositories

storage

network
```

---

Inside presentation

```
presentation

screens

components

navigation

hooks

theme
```

---

Inside shared

```
shared

constants

helpers

utils

types
```

---

# REVIEW EXISTING PROJECT

Do NOT blindly create folders.

First inspect the project.

Reuse existing folders whenever possible.

Only move files when it improves maintainability.

Avoid duplicate folders.

---

# REFACTORING RULES

Never break imports.

Never duplicate files.

Never change functionality.

Never delete code.

Never rename public APIs unnecessarily.

Move only when justified.

---

# DOCUMENTATION

After analysis provide

1. Existing Structure

2. Recommended Structure

3. Files to Move

4. Why Each Move Is Necessary

5. Files That Should Stay

6. Risks

7. Migration Steps

Wait for approval before moving files.

Do NOT immediately generate code.

First produce the migration plan.

---

# AFTER APPROVAL

Once the migration plan is approved

Perform the refactoring.

Update imports.

Ensure project compiles.

Ensure application behavior remains identical.

---

# ACCEPTANCE CRITERIA

✅ Application builds successfully

✅ No broken imports

✅ No UI changes

✅ No navigation changes

✅ Existing functionality preserved

✅ Cleaner folder hierarchy

✅ Ready for Phase 3

---

# RESPONSE FORMAT

Always respond in this order

1. Analysis

2. Current Structure

3. Proposed Structure

4. Migration Plan

5. Risks

6. Wait For Approval

Do not start moving files until approval is received.