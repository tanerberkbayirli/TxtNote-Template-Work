> Belge kapsamı (25.10.2026): Tarihli ilerleme ve kabul notları geçmiş çalışmalara aittir; güncel test sonucu değildir. Kurallar [BASLA.md](../BASLA.md), açık işler [GOREVLER.md](../GOREVLER.md) içindedir. Eksik rapor atıfları doğrulama kanıtı sayılmaz.

# Document layout

The existing template compiler remains the source of resolved typography, sections,
metadata, generated indexes and page flow. `note.researchData.thesis.layout` is an
optional, versioned document customization; it never mutates the registry template.
Old notes need no migration. SQLite, IndexedDB and encrypted note persistence retain
this data through the existing researchData path.

Geometry uses millimetres; typography and paragraph spacing use points. Conversion
to CSS pixels, Word twips and DrawingML EMUs occurs at a renderer/export boundary
through `units.js`. Physical quantization is applied only at that boundary.

`layoutDocument.js` provides immutable element commands and resolution. Template
block identity is `sectionId:block:path`, where nested path components use dots.
Template paths do not change when an optional block becomes visible. User additions
have their own persistent identity. Deletion records a template override tombstone.

```js
const next = updateLayoutElements(thesis, [{
  id: "inner-cover:block:0",
  layoutMode: "absolute",
  xMm: 40, yMm: 42, widthMm: 140,
  style: { fontFamily: "Times New Roman", fontSizePt: 12, align: "center" },
}]);
```

Human interaction and declarative callers use these same commands. Flow elements
inherit their original browser layout. Moving an element explicitly stores its
page-relative geometry; absolute frames use the same resolved tree in the editor
and export. Selection, handles, rulers and guides are presentation state and must
never enter exported content.

Page rules cascade template → document → section → page. Nested margin and
header/footer rules merge by property. Typography resolves template → document → section →
element style. `locked` allows inspection while preventing accidental manipulation;
`editableContent` and `editableLayout` independently describe editing permissions.

Validation uses the real compiler and exporters. Unit tests cover conversion,
immutable commands, JSON persistence, inheritance and snap geometry. Browser and
packaged tests cover actual pointer/keyboard interactions and output. DOCX semantic
checks inspect the emitted OOXML; PDF checks inspect real text and geometry. A
semantic check never establishes Word rendering fidelity on its own.

The inspector leaves unset flow coordinates automatic and labels separately measured
screen geometry. A drag or coordinate edit explicitly materializes page geometry.
Layout history stores one transaction per gesture, and guide/page/style commands use
the same history. Content history in the existing body editor remains independent.
Physical page overrides are exposed only for standalone one-page sections; the
continuous body fragmentation renderer supports document and section page settings.

DOCX uses editable DrawingML frames for positioned text/images and normal paragraphs,
tables and inline figures for flowing content. Measured whole-block page transitions
are export-only hints. Table minimum row heights include the resolved line box,
padding and border; longer cell content can still grow. Physical Word validation
compares the real Word-rendered shapes/PDF against editor export geometry.

Custom PDF typography supports installed Arial and Times New Roman, verifies SFNT
family/PostScript identity and embedding permissions, and embeds their actual font
programs. Other custom families fail explicitly. DOCX point sizes must be representable
as half points; unsupported values fail instead of being silently rounded. Absolute
groups must be represented as individual positioned children for DOCX export.
