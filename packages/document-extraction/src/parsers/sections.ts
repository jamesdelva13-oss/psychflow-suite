// Semantic, heading-based section detection (decided for this repo).
//
// Report sections are detected from heading signals — paragraph styles, and
// short standalone lines that are bold or all-caps — never from OOXML sectPr
// layout boundaries. Each section carries a confidence state: a styled heading
// is a strong signal (parsed_ok); a heuristic bold/caps/short line is weaker
// (parsed_low_confidence). When no reliable heading is found we emit ONE
// implicit section spanning the document rather than guessing boundaries; a
// check keyed on section identity can then see it is low-confidence and cap at
// Review suggested. `documentOrder` on elements is untouched by any of this —
// sections are an overlay, not a reorder.

import type { IRElement, ParagraphElement, ParserConfidence, Section } from "../ir/types.js";
import { isParagraph } from "../ir/types.js";

interface HeadingVerdict {
  isHeading: boolean;
  confidence: ParserConfidence;
}

function classifyHeading(p: ParagraphElement): HeadingVerdict {
  const s = p.heading;
  if (!s || p.text.trim().length === 0) return { isHeading: false, confidence: "parsed_ok" };
  if (s.styledHeading) return { isHeading: true, confidence: "parsed_ok" };
  if (s.shortStandalone && (s.allBold || s.allCaps)) {
    return { isHeading: true, confidence: "parsed_low_confidence" };
  }
  return { isHeading: false, confidence: "parsed_ok" };
}

export function detectSections(elements: IRElement[]): Section[] {
  const ordered = [...elements].sort((a, b) => a.documentOrder - b.documentOrder);
  const sections: Section[] = [];
  let current: Section | null = null;
  let seq = 0;

  const openImplicitLeading = (): Section => {
    const sec: Section = {
      id: `s${seq++}`,
      title: null,
      headingElementId: null,
      confidence: "parsed_low_confidence",
      implicit: true,
      elementIds: [],
    };
    sections.push(sec);
    return sec;
  };

  for (const el of ordered) {
    if (isParagraph(el)) {
      const verdict = classifyHeading(el);
      if (verdict.isHeading) {
        current = {
          id: `s${seq++}`,
          title: el.text.trim(),
          headingElementId: el.id,
          confidence: verdict.confidence,
          implicit: false,
          elementIds: [el.id],
        };
        sections.push(current);
        continue;
      }
    }
    if (!current) current = openImplicitLeading();
    current.elementIds.push(el.id);
  }

  if (sections.length === 0) {
    sections.push({
      id: "s0",
      title: null,
      headingElementId: null,
      confidence: "parsed_low_confidence",
      implicit: true,
      elementIds: [],
    });
  }
  return sections;
}
