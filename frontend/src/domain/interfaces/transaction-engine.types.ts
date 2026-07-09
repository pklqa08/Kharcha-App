import { TransactionInput, TxnType } from "@/src/domain/entities/models";

export type TransactionSourceKind =
  | "manual"
  | "sms"
  | "notification"
  | "csv"
  | "pdf"
  | "api"
  | "cloud";

export type SourceImplementationStatus = "implemented" | "planned" | "disabled";

export interface SourceDefinition {
  kind: TransactionSourceKind;
  label: string;
  implementationStatus: SourceImplementationStatus;
  enabledByDefault: boolean;
  metadata?: Record<string, unknown>;
}

export interface EngineSourceCatalog {
  manual: SourceDefinition;
  sms: SourceDefinition;
  notification: SourceDefinition;
  csv: SourceDefinition;
  pdf: SourceDefinition;
  api: SourceDefinition;
  cloud: SourceDefinition;
}

export const DEFAULT_TRANSACTION_SOURCE_CATALOG: EngineSourceCatalog = {
  manual: {
    kind: "manual",
    label: "Manual Entry",
    implementationStatus: "implemented",
    enabledByDefault: true,
  },
  sms: {
    kind: "sms",
    label: "SMS",
    implementationStatus: "planned",
    enabledByDefault: false,
    metadata: {
      note: "Do not implement yet. Kept in the contract for future activation.",
    },
  },
  notification: {
    kind: "notification",
    label: "Notification",
    implementationStatus: "planned",
    enabledByDefault: false,
  },
  csv: {
    kind: "csv",
    label: "CSV",
    implementationStatus: "planned",
    enabledByDefault: false,
  },
  pdf: {
    kind: "pdf",
    label: "PDF",
    implementationStatus: "planned",
    enabledByDefault: false,
  },
  api: {
    kind: "api",
    label: "Future APIs",
    implementationStatus: "planned",
    enabledByDefault: false,
  },
  cloud: {
    kind: "cloud",
    label: "Cloud",
    implementationStatus: "planned",
    enabledByDefault: false,
  },
};

export interface ManualEntryPayload {
  draft: TransactionInput;
  actorId?: string;
}

export interface SmsPayload {
  sender: string;
  body: string;
  receivedAtIso: string;
  messageId?: string;
}

export interface NotificationPayload {
  appPackage: string;
  title: string;
  body: string;
  postedAtIso: string;
  notificationId?: string;
}

export interface CsvPayload {
  filename: string;
  header: string[];
  rows: string[][];
  importedAtIso: string;
}

export interface PdfPayload {
  filename: string;
  extractedText: string;
  importedAtIso: string;
  pageCount?: number;
}

export interface ApiPayload {
  provider: string;
  records: Record<string, unknown>[];
  pulledAtIso: string;
}

export interface CloudPayload {
  provider: string;
  records: Record<string, unknown>[];
  pulledAtIso: string;
  cursor?: string;
}

export interface SourcePayloadMap {
  manual: ManualEntryPayload;
  sms: SmsPayload;
  notification: NotificationPayload;
  csv: CsvPayload;
  pdf: PdfPayload;
  api: ApiPayload;
  cloud: CloudPayload;
}

export interface IngestionEnvelope<TKind extends TransactionSourceKind = TransactionSourceKind> {
  source: TKind;
  externalId?: string;
  receivedAtIso: string;
  payload: SourcePayloadMap[TKind];
  metadata?: Record<string, unknown>;
}

export interface NormalizedTransactionCandidate {
  draft: TransactionInput;
  source: TransactionSourceKind;
  externalId?: string;
  fingerprintBasis: {
    amount: number;
    dateIso: string;
    merchantRaw?: string | null;
    referenceNumber?: string | null;
    utr?: string | null;
    rrn?: string | null;
  };
  trace?: Record<string, unknown>;
}

export interface DuplicateCandidate {
  transactionId: string;
  similarity: number;
  reasons: string[];
}

export type DuplicateDecisionType = "keep" | "replace" | "merge" | "drop" | "manual_review";

export interface DuplicateDecision {
  decision: DuplicateDecisionType;
  existingTransactionId?: string;
  mergedDraft?: Partial<TransactionInput>;
  reason: string;
}

export interface MerchantRecognitionResult {
  rawMerchant?: string | null;
  canonicalMerchant?: string | null;
  confidence: number;
  tags?: string[];
}

export interface CategorySuggestion {
  categoryId: string | null;
  categoryTypeHint: TxnType;
  confidence: number;
  reason?: string;
}

export interface EnrichedTransactionCandidate extends NormalizedTransactionCandidate {
  merchantRecognition?: MerchantRecognitionResult;
  categorySuggestion?: CategorySuggestion;
}

export interface EngineValidationIssue {
  code: string;
  level: "warning" | "error";
  message: string;
  field?: string;
}

export interface EnginePersistedRecord {
  transactionId: string;
  source: TransactionSourceKind;
  externalId?: string;
  dedupeDecision: DuplicateDecisionType;
}

export interface EngineProcessResult {
  accepted: EnginePersistedRecord[];
  rejected: Array<{
    envelope: IngestionEnvelope;
    issues: EngineValidationIssue[];
  }>;
  stats: {
    totalReceived: number;
    totalAccepted: number;
    totalRejected: number;
  };
}

export interface ITransactionSourceAdapter<TKind extends TransactionSourceKind = TransactionSourceKind> {
  readonly source: TKind;
  readonly status: SourceImplementationStatus;
  ingest(input: SourcePayloadMap[TKind], meta?: Record<string, unknown>): Promise<IngestionEnvelope<TKind>[]>;
}

export interface ITransactionNormalizer {
  normalize(envelope: IngestionEnvelope): Promise<NormalizedTransactionCandidate[]>;
}

export interface IDuplicateDetector {
  findDuplicates(candidate: NormalizedTransactionCandidate): Promise<DuplicateCandidate[]>;
  decide(candidate: NormalizedTransactionCandidate, matches: DuplicateCandidate[]): Promise<DuplicateDecision>;
}

export interface IMerchantRecognizer {
  recognize(candidate: NormalizedTransactionCandidate): Promise<MerchantRecognitionResult>;
}

export interface IAICategorizationService {
  suggestCategory(candidate: EnrichedTransactionCandidate): Promise<CategorySuggestion>;
}

export interface ITransactionPersistencePort {
  create(draft: TransactionInput): Promise<{ id: string }>;
  update(id: string, patch: Partial<TransactionInput>): Promise<void>;
}

export interface ITransactionCloudPort {
  queueForSync(transactionId: string, source: TransactionSourceKind): Promise<void>;
}

export interface TransactionEngineConfig {
  sources: Partial<Record<TransactionSourceKind, ITransactionSourceAdapter>>;
  normalizer: ITransactionNormalizer;
  duplicateDetector: IDuplicateDetector;
  merchantRecognizer?: IMerchantRecognizer;
  aiCategorization?: IAICategorizationService;
  persistence: ITransactionPersistencePort;
  cloud?: ITransactionCloudPort;
}

export interface ITransactionEngine {
  process(envelopes: IngestionEnvelope[]): Promise<EngineProcessResult>;
  processFromSource<TKind extends TransactionSourceKind>(
    source: TKind,
    input: SourcePayloadMap[TKind],
    metadata?: Record<string, unknown>
  ): Promise<EngineProcessResult>;
}
