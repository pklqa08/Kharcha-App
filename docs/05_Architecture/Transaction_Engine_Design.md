# Transaction Engine Design

## Scope
Design-only architecture for a transaction ingestion and enrichment engine.

Supported ingestion channels in design:
- Manual Entry
- SMS (planned, intentionally not implemented)
- Notification
- CSV
- PDF
- Future APIs
- Cloud

Core intelligence and processing in design:
- Duplicate Detection
- Merchant Recognition
- AI Categorization

## Placement
Primary contracts live in:
- frontend/src/domain/interfaces/transaction-engine.types.ts

This keeps engine behavior framework-agnostic and ready for multiple adapters.

## Pipeline
1. Source Adapter Ingest
- Source-specific payload is converted into one or more IngestionEnvelope objects.

2. Normalization
- Envelope payload becomes NormalizedTransactionCandidate using a shared canonical draft shape.

3. Duplicate Detection
- Candidate is matched against existing records.
- Decision can keep, replace, merge, drop, or send for manual review.

4. Enrichment
- Merchant recognition standardizes merchant naming.
- AI categorization proposes category with confidence and reason.

5. Persistence and Sync Hook
- Persist via ITransactionPersistencePort.
- Optional cloud queue via ITransactionCloudPort.

## Extensibility Model
The engine is open for extension via interfaces:
- ITransactionSourceAdapter
- ITransactionNormalizer
- IDuplicateDetector
- IMerchantRecognizer
- IAICategorizationService
- ITransactionPersistencePort
- ITransactionCloudPort

New channels can be added by:
- Extending TransactionSourceKind
- Adding payload to SourcePayloadMap
- Registering a new adapter in TransactionEngineConfig

## SMS Constraint
SMS appears in TransactionSourceKind and catalog as planned.
- implementationStatus: planned
- enabledByDefault: false

No SMS adapter implementation is provided in this design.

## Suggested Next Implementation Steps
1. Build Manual adapter and normalizer first.
2. Implement duplicate detector with amount/date/reference heuristics.
3. Add merchant recognizer dictionary and regex provider.
4. Integrate AI categorization provider with confidence threshold fallback.
5. Add CSV and PDF adapters.
6. Add notification adapter.
7. Add API and cloud connectors.
8. Implement SMS only when explicitly approved.
