/**
 * @suite/ui — the DESIGN-SYSTEM.md §5 component vocabulary plus tokens.css
 * and ui.css. Writer-era components arrive with the stages that use them, so
 * no component exists before its states can be real: VS-2 shipped the
 * shell-and-workspace subset, VS-3 adds AIProposal (Proposal variant) and
 * DraftSection, and EvidenceChip plus AssistantPanel remain VS-4.
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
export { AIProposal, GateNoticeBlock, type GateNotice } from "./ai-proposal";
export {
  DraftSection,
  DocumentBody,
  DocumentBlocks,
  ScoreTable,
  SectionOutline,
  wordCount,
  type DraftStatus,
  type DocBlock,
} from "./draft-section";
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
