/**
 * The slice's one synthetic district-style template (directive §5.1 item 15,
 * VS-7 target). Data, not UI: VS-7 maps the approved report onto this
 * outline at export. Synthetic only — no real district's template.
 */

export interface ReportTemplate {
  id: string;
  name: string;
  origin: string;
  sections: string[];
}

export const TEMPLATES: ReportTemplate[] = [
  {
    id: "union-district-psychoed",
    name: "Union School District — psychoeducational evaluation report",
    origin: "Synthetic district-style template",
    sections: [
      "Identifying information",
      "Reason for referral",
      "Background and educational history",
      "Observations",
      "Assessment results",
      "Interpretation and summary",
      "Recommendations",
    ],
  },
];
