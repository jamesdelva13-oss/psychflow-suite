/**
 * Serializable form-view types shared by the server (which computes them via
 * the engine) and the client renderer (which holds NO engine code). These are
 * pure types — safe to import from a client component.
 */
export type FormAnswer = string | string[];
export type FormResponseMap = Record<string, FormAnswer>;

export type FieldResponseType =
  | "single_select"
  | "multi_select"
  | "open_text"
  | "yes_no"
  | "likert";

export interface FormField {
  key: string; // response-map / draft key (e.g. "TCH-BEH-G01::avoidance")
  prompt: string;
  helpText?: string;
  responseType: FieldResponseType;
  options?: { value: string; label: string }[];
  required: boolean;
  groupLabel?: string; // repeat-group option context, when present
}

export interface FormGroup {
  moduleId: string;
  displayLabel: string;
  intro?: string;
  fields: FormField[];
}

export interface PendingFollowUpView {
  followUpId: string;
  prompt: string;
  description: string;
}

export interface FormView {
  groups: FormGroup[];
  pendingFollowUps: PendingFollowUpView[];
}
