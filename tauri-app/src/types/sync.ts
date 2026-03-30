export type SyncKind = "full" | "incremental";
export type SyncStatus = "running" | "completed" | "failed";

export interface SyncProgressEvent {
  accountId: string;
  jobId: string;
  kind: SyncKind;
  status: SyncStatus;
  scannedPages: number;
  insertedRows: number;
  updatedRows: number;
  message: string | null;
}
