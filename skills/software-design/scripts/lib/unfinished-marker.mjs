// "todo" is ordinary Spanish prose ("está todo definido", "TODO EL ALCANCE"), so a
// TODO counts as an unfinished-work marker only in marker syntax: uppercase TODO
// followed directly by a colon or an owner in parentheses (TODO:, TODO(owner):), or
// bracketed as [TODO] or <TODO>. Case alone never makes a word a marker, and a TODO
// inside a longer word such as MÉTODO is not one. TBD is not a Spanish word and keeps
// its case-insensitive match where each checker uses it.
// Word characters include combining marks, so decomposed (NFD) "MÉTODO" stays
// one word exactly like precomposed (NFC) "MÉTODO".
export const TODO_MARKER_PATTERN = /(?<![\p{L}\p{M}\p{N}_])TODO(?=[:(])|\[TODO\]|<TODO>/u;

// A field holding only TODO and optional punctuation, such as a slideshow caption.
const TODO_FIELD_PATTERN = /^TODO[^\p{L}\p{M}\p{N}_]*$/u;

export const hasTodoMarker = (text) => TODO_MARKER_PATTERN.test(String(text || ""));

export const isTodoField = (text) => TODO_FIELD_PATTERN.test(String(text || "").trim());
