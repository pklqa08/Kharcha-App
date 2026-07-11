Analyze the existing Kharcha project.

Locate the current Transaction entity or model.

Do not create a duplicate Transaction model.

Refactor the existing model into a Universal Transaction Entity.

Requirements:

1. Keep backward compatibility with existing screens.

2. Preserve all current functionality.

3. Add the following fields if they are missing:

- uuid
- source
- sourceId
- transactionStatus
- paymentMethod
- merchantId
- categoryId
- bankId
- accountId
- referenceNumber
- currency
- notes
- tags
- createdAt
- updatedAt

4. Use TypeScript interfaces and types where appropriate.

5. Do not add business logic.

6. Do not modify UI.

7. Do not modify repositories unless required for compatibility.

8. Explain which files will be modified before generating code.

9. Maintain Clean Architecture.

10. Keep the model extensible for future SMS Reader, Notification Listener, Duplicate Detection and AI Categorization.

Review the UniversalTransactionEntity that was just implemented.

Do NOT create a new entity.

Do NOT create new files.

Do NOT modify UI.

Do NOT modify repositories.

Do NOT modify services.

Do NOT modify providers.

Do NOT modify database schema.

Only improve the domain entity while maintaining backward compatibility.

Perform the following review and improvements.

-----------------------------------------
1. TransactionSource Review
-----------------------------------------

Review the TransactionSource type.

Only values that represent an actual origin of a transaction should exist.

Valid transaction sources should include:

- manual
- sms
- notification
- csv
- pdf
- ocr
- api
- cloud

If values such as

- duplicate_detection
- ai_categorization
- import

exist as sources, move them out of TransactionSource because they are processing stages rather than transaction origins.

Maintain backward compatibility where possible.

-----------------------------------------
2. Processing Status
-----------------------------------------

Instead of using TransactionSource for processing information, introduce separate fields if they do not already exist.

Examples:

processingStatus

Possible values:

- pending
- parsed
- categorized
- validated
- duplicated
- synced

Do not implement business logic.

Only define the type.

-----------------------------------------
3. External Source Identifier
-----------------------------------------

Rename

sourceId

to

externalSourceId

if it improves readability.

If renaming would break existing code, keep sourceId and add a comment explaining that it represents the external identifier from SMS, Notification, CSV, PDF, OCR, API or Cloud.

Do not break backward compatibility.

-----------------------------------------
4. Currency
-----------------------------------------

Replace

currency?: string

with

currency: CurrencyCode

Create a CurrencyCode type if it does not already exist.

Default currency will be INR but future currencies must be supported.

Do not hardcode values.

-----------------------------------------
5. Notes
-----------------------------------------

Keep notes optional.

Allow null.

-----------------------------------------
6. Tags
-----------------------------------------

Replace

string[] | string | null

with

string[] | null

A transaction should always contain an array of tags.

Avoid multiple data representations.

-----------------------------------------
7. Status Review
-----------------------------------------

Review transactionStatus.

If it is currently

string

replace it with a proper union type or enum.

Example

pending

completed

failed

cancelled

reversed

Do not add business logic.

-----------------------------------------
8. Documentation
-----------------------------------------

Add concise comments explaining the purpose of these fields:

uuid

source

externalSourceId (or sourceId)

transactionStatus

processingStatus

merchantId

bankId

accountId

referenceNumber

createdAt

updatedAt

Keep comments short.

-----------------------------------------
9. Validation
-----------------------------------------

Run TypeScript validation.

The project must compile without errors.

-----------------------------------------
10. Output
-----------------------------------------

Before making changes explain:

- What will change
- Why
- Which file will be modified

After changes provide a summary.

Do not modify any file except the existing Transaction entity.
Review the existing UniversalTransactionEntity.

Do not modify repositories, services, providers, UI, or database.

Improve only the domain model.

Apply these refinements:

1. Make uuid mandatory if it does not break backward compatibility. Otherwise document why it is optional.

2. Make createdAt and updatedAt mandatory if possible. Otherwise document why they remain optional.

3. Replace CurrencyCode = string & {} with a strongly typed CurrencyCode union containing:
INR, USD, EUR, GBP, AED, JPY.

4. If PaymentMode is already a defined type, remove "| string" from paymentMethod.

5. If TransactionStatus is already strongly typed, remove "| string" where safe.

6. Add optional display fields to support future SMS and Notification parsing before entity resolution:

- merchantName?: string | null;
- categoryName?: string | null;
- bankName?: string | null;
- accountName?: string | null;

These fields are temporary display values until IDs are resolved by the Merchant, Category, Bank, and Account engines.

7. Do not introduce business logic.

8. Keep full backward compatibility.

9. Explain every change before modifying the code.