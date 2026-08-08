/**
 * @suite/ui — the DESIGN-SYSTEM.md §5 component vocabulary plus tokens.css
 * and ui.css. VS-2 ships the shell-and-workspace subset; writer-era
 * components (EvidenceChip, AIProposal, NeedsReview, DraftSection,
 * AssistantPanel) arrive with the stages that use them (VS-3/VS-4) so no
 * component exists before its states can be real.
 */

export { AppFrame, type NavItem } from "./app-frame";
export {
  Button,
  LinkButton,
  StatusPill,
  Panel,
  Eyebrow,
  Tabs,
  EmptyState,
  Skeleton,
  Field,
  type PillTone,
} from "./primitives";
export { CaseStatus } from "./case-status";
export { NeedsReview, NeedsReviewResolved } from "./needs-review";
export { SourceCard, type SourceCardState } from "./source-card";
export { CaseActivity, type ActivityEntry } from "./case-activity";
export { Drawer } from "./drawer";
export { CommandPalette, type PaletteItem } from "./command-palette";
export {
  IconHome,
  IconCases,
  IconLibrary,
  IconTemplate,
  IconDocument,
  IconInterview,
  IconCheck,
  IconWarn,
  IconClose,
  IconSearch,
  IconUser,
} from "./icons";
