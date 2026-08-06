// Minimal navigation helpers over fast-xml-parser's `preserveOrder` output.
//
// A .docx is a ZIP of XML; `word/document.xml` holds the body as ordered
// `w:p` (paragraphs) and `w:tbl` (tables) nodes (Technical Architecture §2). We
// parse with preserveOrder so document reading order — which the IR's
// `documentOrder` depends on — is faithful. In that mode every node is an
// object with exactly one tag key (its children array) plus an optional ":@"
// attributes bag; text is a "#text" node.

/** A preserveOrder node: one tag key -> children array, optional ":@" attrs. */
export type OoxmlNode = Record<string, unknown> & { ":@"?: Record<string, string> };

/** The tag name of a node ("w:p", "w:tbl", "#text", ...). */
export function tagOf(node: OoxmlNode): string {
  for (const key of Object.keys(node)) {
    if (key !== ":@") return key;
  }
  return "";
}

/** Ordered children of a node (empty for text/self-closing nodes). */
export function childrenOf(node: OoxmlNode): OoxmlNode[] {
  const value = node[tagOf(node)];
  return Array.isArray(value) ? (value as OoxmlNode[]) : [];
}

/** Attribute bag for a node. */
export function attrsOf(node: OoxmlNode): Record<string, string> {
  return node[":@"] ?? {};
}

/** Direct children carrying a given tag. */
export function childrenNamed(node: OoxmlNode, tag: string): OoxmlNode[] {
  return childrenOf(node).filter((c) => tagOf(c) === tag);
}

/** First direct child with a given tag, or undefined. */
export function firstChild(node: OoxmlNode, tag: string): OoxmlNode | undefined {
  return childrenOf(node).find((c) => tagOf(c) === tag);
}

/** Depth-first search for the first descendant (or self) with a given tag. */
export function findDescendant(node: OoxmlNode, tag: string): OoxmlNode | undefined {
  if (tagOf(node) === tag) return node;
  for (const child of childrenOf(node)) {
    const hit = findDescendant(child, tag);
    if (hit) return hit;
  }
  return undefined;
}

/** True if `node` (or any descendant) contains a tag. */
export function hasDescendant(node: OoxmlNode, tag: string): boolean {
  return findDescendant(node, tag) !== undefined;
}

/** The raw text of a "#text" node, or "". */
export function textNodeValue(node: OoxmlNode): string {
  const v = (node as Record<string, unknown>)["#text"];
  return v === undefined || v === null ? "" : String(v);
}
