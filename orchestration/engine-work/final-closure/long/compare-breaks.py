"""Page-opening and text-coverage comparison of an editor measurement against the source Word PDF.

Usage: compare-breaks.py <SRC id> <measure dir> <out.json>

Inputs: <measure dir>/<id>.pages.json (editor words per physical page, orchestration/engine-work/mission07/extract.js) and
orchestration/engine-work/mission01/references/<id>/word.pdf (real Word render). The comparison is an ORDER-AWARE alignment of the
two normalized token streams (difflib), not a first-30-characters search: a repeated TOC line, a repeated table
cell or a duplicated phrase cannot be mistaken for a page start.

* openings: for every Word page the position of its first token inside the editor stream. The page is aligned
  when the token sits within MARKER_TOLERANCE tokens of an editor page start (Word prints list bullets and page
  numbers as separate leading tokens that the editor draws as markers or in the chrome). Anything else is a
  misaligned page opening: the editor breaks the page elsewhere than Word.
* coverage: share of Word's normalized characters found in the editor in order. Tokens the alignment could not
  pair are compared once more character by character inside their own small region, so a word the editor
  splits into spans ("k riterini") still counts as present while a missing or extra word does not.
Totals alone are never a pass: the verdict needs pages equal, zero misaligned openings and coverage >= COVERAGE_MIN.
"""
import bisect
import difflib
import json
import re
import sys
import unicodedata

import fitz

MARKER_TOLERANCE = 2
COVERAGE_MIN = 0.995
BODY_TOP, BODY_BOTTOM = 58, 790  # Word text outside this band is running header/footer chrome

doc_id, measure_dir, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
ours = json.load(open(f"{measure_dir}/{doc_id}.pages.json", encoding="utf8"))
word = fitz.open(sys.argv[4] if len(sys.argv) > 4 else f"orchestration/engine-work/mission01/references/{doc_id}/word.pdf")


def normalize(text):
    return re.sub(r"[\W_]+", "", unicodedata.normalize("NFKC", text).lower())


def tokens(words):
    return [t for t in (normalize(w) for w in words) if t]


O, OP = [], []
for index, page in enumerate(ours):
    page_tokens = tokens(w for _, w in sorted(page["words"], key=lambda item: item[0]))
    O += page_tokens
    OP += [index] * len(page_tokens)
W, WP = [], []
for index, page in enumerate(word):
    page_tokens = tokens(w[4] for w in page.get_text("words", sort=True) if BODY_TOP < w[1] < BODY_BOTTOM)
    W += page_tokens
    WP += [index] * len(page_tokens)

matcher = difflib.SequenceMatcher(None, O, W, autojunk=False)
blocks = [b for b in matcher.get_matching_blocks() if b.size]
matched = sum(b.size for b in blocks)

# Character-level pass over the regions the token alignment left open.
word_chars = sum(len(t) for t in W)
covered_chars = sum(len(t) for b in blocks for t in W[b.b:b.b + b.size])
ours_extra = sum(len(t) for t in O) - sum(len(t) for b in blocks for t in O[b.a:b.a + b.size])
previous_a = previous_b = 0
for b in blocks + [difflib.Match(len(O), len(W), 0)]:
    if b.a > previous_a and b.b > previous_b:
        left, right = "".join(O[previous_a:b.a]), "".join(W[previous_b:b.b])
        if len(left) * len(right) <= 4_000_000:
            inner = difflib.SequenceMatcher(None, left, right, autojunk=False)
            found = sum(m.size for m in inner.get_matching_blocks())
            covered_chars += found
            ours_extra -= found
    previous_a, previous_b = b.a + b.size, b.b + b.size

b_starts = [b.b for b in blocks]


def editor_index(word_index):
    k = bisect.bisect_right(b_starts, word_index) - 1
    if k >= 0 and word_index < blocks[k].b + blocks[k].size:
        return blocks[k].a + (word_index - blocks[k].b)
    return None


first_of_page = {}
for index, page in enumerate(OP):
    first_of_page.setdefault(page, index)
word_page_starts = {}
for index, page in enumerate(WP):
    word_page_starts.setdefault(page, index)
openings = []
for word_page, start in sorted(word_page_starts.items()):
    index, skipped = start, 0
    while index < len(W) and WP[index] == word_page:
        mapped = editor_index(index)
        if mapped is not None:
            break
        index, skipped = index + 1, skipped + 1
    else:
        mapped = None
    if mapped is None:
        openings.append({"wordPage": word_page + 1, "editorPage": None, "offsetTokens": None})
        continue
    page = OP[mapped]
    offset = (mapped - skipped) - first_of_page[page]
    openings.append({"wordPage": word_page + 1, "editorPage": page + 1, "offsetTokens": offset})
misaligned = [row for row in openings if row["editorPage"] is None or abs(row["offsetTokens"]) > MARKER_TOLERANCE]
# Add small diagnostic windows from the alignment already computed above.
# This avoids another Word render or a new whole-document token search when
# investigating a failed opening. It changes neither tolerances nor verdicts.
for row in misaligned:
    start = word_page_starts.get(row["wordPage"] - 1, 0)
    row["wordOpening"] = " ".join(W[start:start + 16])
    if row["editorPage"] is not None:
        first = first_of_page[row["editorPage"] - 1]
        row["editorOpening"] = " ".join(O[first:first + 16])
coverage = covered_chars / word_chars if word_chars else 0.0
report = {
    "id": doc_id,
    "wordPages": len(word),
    "editorPages": len(ours),
    "wordTokens": len(W),
    "editorTokens": len(O),
    "matchedTokens": matched,
    "wordCharacters": word_chars,
    "wordCharactersFoundInOrder": covered_chars,
    "textCoverage": round(coverage, 5),
    "editorExtraCharacters": max(0, ours_extra),
    "openingsChecked": len(openings),
    "misalignedOpenings": len(misaligned),
    "misalignedPhysicalPages": sum(row["editorPage"] != row["wordPage"] for row in misaligned),
    "misalignedStartsOnSamePage": sum(row["editorPage"] == row["wordPage"] for row in misaligned),
    "firstMisaligned": misaligned[:80],
    "markerTolerance": MARKER_TOLERANCE,
    "coverageMin": COVERAGE_MIN,
}
report["status"] = "PASS" if (report["wordPages"] == report["editorPages"] and not misaligned and coverage >= COVERAGE_MIN) else "FAIL"
json.dump(report, open(out_path, "w", encoding="utf8"), indent=2, ensure_ascii=False)
print(json.dumps({k: report[k] for k in ("id", "status", "wordPages", "editorPages", "textCoverage", "openingsChecked", "misalignedOpenings")}, ensure_ascii=False))
sys.exit(0 if report["status"] == "PASS" else 1)
