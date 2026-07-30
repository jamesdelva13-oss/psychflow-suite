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
  | "likert"
  | "comparison_scale"
  | "frequency_scale"
  | "support_scale";

export interface FormField {
  key: string; // response-map / draft key (e.g. "TCH-BEH-G01::avoidance")
  prompt: string;
  helpText?: string;
  responseType: FieldResponseType;
  options?: { value: string; label: string }[];
  required: boolean;
  groupLabel?: string; // repeat-group option context, when present
  /**
   * Option value meaning "not enough opportunity to observe" (D-119). The
   * client renders it always-visible but set apart, and offers a domain-level
   * "mark remaining as not observed" action over fields that carry one.
   */
  observationEscapeValue?: string;
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

/** One respondent step (four-step flow, handoff 03). */
export interface FormStep {
  step: number;
  title: string;
  groups: FormGroup[];
}

export interface FormView {
  groups: FormGroup[];
  /**
   * Present when the bank declares steps (v1.5.0+): the same content grouped
   * into the four-step flow. Depth questions and repeat-group instances land
   * in step 3 ("Relevant follow-up") regardless of their module's step.
   */
  steps?: FormStep[];
  pendingFollowUps: PendingFollowUpView[];
}
