# SQLite Redesign and Migrations

## Target Tables
- transactions
- transaction_sources
- banks
- accounts
- upis
- merchants
- categories
- budgets
- rules
- duplicate_logs
- notifications
- sms_messages
- settings
- analytics_cache
- sync_outbox

## Migration Strategy
The database now uses versioned migrations in code via PRAGMA user_version.

- Version 1:
  - Creates redesigned tables with foreign keys.
  - Includes legacy-compatible transaction columns so existing repository code continues to work.
- Version 2:
  - Detects legacy transactions schema and rebuilds transactions into FK-based schema.
- Version 3:
  - Creates performance indexes.
  - Backfills transaction_source_id from legacy source text where possible.

## Foreign Key Design
- accounts.bank_id -> banks.id
- upis.account_id -> accounts.id
- merchants.category_hint_id -> categories.id
- transactions.category_id -> categories.id
- transactions.merchant_id -> merchants.id
- transactions.bank_id -> banks.id
- transactions.account_id -> accounts.id
- transactions.upi_ref_id -> upis.id
- transactions.transaction_source_id -> transaction_sources.id
- budgets.category_id -> categories.id
- duplicate_logs.transaction_id -> transactions.id
- duplicate_logs.matched_transaction_id -> transactions.id
- notifications.transaction_id -> transactions.id
- sms_messages.linked_transaction_id -> transactions.id

## Indexes
- transactions:
  - idx_txn_date
  - idx_txn_type
  - idx_txn_category
  - idx_txn_merchant_id
  - idx_txn_source_id
  - idx_txn_account_id
  - idx_txn_upi_ref_id
  - idx_txn_fingerprint
  - idx_txn_type_date
  - idx_txn_source_external_ref (unique partial)
- accounts: idx_accounts_bank_id
- upis: idx_upis_account_id
- merchants: idx_merchants_category_hint_id
- budgets: idx_budgets_category_period
- rules: idx_rules_enabled_priority
- duplicate_logs: idx_duplicate_logs_txn
- notifications: idx_notifications_status_received
- sms_messages: idx_sms_received_status
- sync_outbox: idx_sync_outbox_unsynced

## Notes
- SMS table is schema-ready only; parsing and ingestion logic can be added later.
- transaction_sources is seeded with: manual, sms, notification, csv, pdf, api, cloud.
