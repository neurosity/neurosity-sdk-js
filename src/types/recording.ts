import { Observable } from "rxjs";

export interface RecordingOptions {
  /** Human-readable name for the recording */
  name?: string;
  /** Label for categorization (e.g. "eyes-closed", "focus-training") */
  label: string;
  /** Duration in milliseconds (max 30 minutes / 1,800,000ms) */
  duration: number;
  /** Optional experiment identifier */
  experimentId?: string;
}

export interface StartRecordingOptions {
  /** Human-readable name for the recording */
  name?: string;
  /** Label for categorization (e.g. "eyes-closed", "focus-training") */
  label: string;
  /** Maximum duration in milliseconds (max 30 minutes / 1,800,000ms) */
  maxDuration: number;
  /** Optional experiment identifier */
  experimentId?: string;
}

export interface RecordingResult {
  /** Whether the recording was saved successfully */
  ok: boolean;
  /** Firestore memory record ID */
  id?: string;
  /** Whether the recording was uploaded to cloud storage */
  cloudUpload?: boolean;
  /** Error message if recording failed */
  error?: string;
}

export interface RecordingHandle {
  /** Observable of elapsed milliseconds since recording started (~1Hz) */
  elapsed$: Observable<number>;
  /** Stop and save the recording */
  stop(): Promise<RecordingResult>;
  /** Cancel the recording without saving */
  cancel(): Promise<void>;
  /** Promise that resolves when the recording is stopped or cancelled */
  result: Promise<RecordingResult>;
}
