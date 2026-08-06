// Derived global text stream.
//
// The IR stores only per-element local anchors (see ir/types.ts). Some
// consumers need a single flat text with document-global positions — notably
// the future Layer B evidence-grounding guard, which string-matches a returned
// quote against the actual document text (Technical Architecture §6). Rather
// than store global offsets (which could drift from the canonical local
// anchors), we DERIVE the stream and a position map from the element list on
// demand. Because it is computed from the same elements the anchors point into,
// the two views can never disagree.

import type { IRElement } from "./types.js";

/** One element's placement inside the derived global stream. */
export interface StreamSegment {
  elementId: string;
  /** Inclusive global start offset of this element's text. */
  start: number;
  /** Length of this element's text (end = start + length, exclusive). */
  length: number;
}

export interface GlobalTextStream {
  text: string;
  segments: StreamSegment[];
}

/** Separator inserted between elements in the derived stream. */
const SEPARATOR = "\n";

/**
 * Build the global text stream by concatenating element texts in document
 * order, separated by a single newline. Elements are sorted defensively so the
 * stream is stable regardless of input ordering.
 */
export function buildGlobalTextStream(elements: IRElement[]): GlobalTextStream {
  const ordered = [...elements].sort((a, b) => a.documentOrder - b.documentOrder);
  const segments: StreamSegment[] = [];
  let cursor = 0;
  const parts: string[] = [];
  ordered.forEach((el, i) => {
    if (i > 0) cursor += SEPARATOR.length;
    segments.push({ elementId: el.id, start: cursor, length: el.text.length });
    parts.push(el.text);
    cursor += el.text.length;
  });
  return { text: parts.join(SEPARATOR), segments };
}

/** Map a local anchor (elementId, localOffset) to a global offset. */
export function localToGlobal(
  stream: GlobalTextStream,
  elementId: string,
  localOffset: number,
): number {
  const seg = stream.segments.find((s) => s.elementId === elementId);
  if (!seg) throw new Error(`unknown elementId in stream: ${elementId}`);
  if (localOffset < 0 || localOffset > seg.length) {
    throw new Error(
      `local offset ${localOffset} out of range for ${elementId} (len ${seg.length})`,
    );
  }
  return seg.start + localOffset;
}

/** Map a global offset back to the local anchor (elementId, localOffset). */
export function globalToLocal(
  stream: GlobalTextStream,
  globalOffset: number,
): { elementId: string; localOffset: number } {
  for (const seg of stream.segments) {
    if (globalOffset >= seg.start && globalOffset <= seg.start + seg.length) {
      return { elementId: seg.elementId, localOffset: globalOffset - seg.start };
    }
  }
  throw new Error(`global offset ${globalOffset} falls outside every element`);
}
