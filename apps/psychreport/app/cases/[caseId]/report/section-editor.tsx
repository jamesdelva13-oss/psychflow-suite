"use client";

import { useState } from "react";
import { Button, DocumentBlocks, type DocBlock } from "@suite/ui";
import { editSection } from "./actions";

/**
 * Inline editing for one section (§5.4 Proposal state "editing").
 *
 * The editor column carries the document and nothing else, so editing is a
 * textarea over the same column at the same measure — what the clinician
 * edits is what the export carries.
 *
 * Editing does not mutate the proposal. Saving inserts a new clinician
 * version that supersedes it, which is why the adjudicated text survives the
 * edit (migration 0009).
 */
export function SectionEditor({
  caseId,
  sectionKey,
  blocks,
  prose,
}: {
  caseId: string;
  sectionKey: string;
  /** The whole composition — rendered blocks included. */
  blocks: DocBlock[];
  /** Just the prose, which is the only part the clinician edits here. */
  prose: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prose);

  if (!editing) {
    return (
      <>
        <DocumentBlocks blocks={blocks} />
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </>
    );
  }

  return (
    <form action={editSection} className="stack-sm">
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="sectionKey" value={sectionKey} />
      <label className="sr-only" htmlFor={`edit-${sectionKey}`}>
        Section text
      </label>
      {/* Only prose is editable. Rendered blocks are re-rendered, never
          hand-edited, and survive the edit (see replaceProse). */}
      <textarea
        id={`edit-${sectionKey}`}
        name="content"
        className="doc-editor"
        rows={Math.max(8, prose.split("\n").length + 4)}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="ai-proposal__actions">
        <Button type="submit" variant="primary">
          Save your version
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setDraft(prose);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
