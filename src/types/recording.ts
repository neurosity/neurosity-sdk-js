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
