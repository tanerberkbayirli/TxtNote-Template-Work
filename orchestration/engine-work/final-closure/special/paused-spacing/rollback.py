import pathlib
body=pathlib.Path('engine/src/docx/body.js')
s=body.read_text(encoding='utf8')
old='''      const firstAtPageTop = children.length === 0 && context.sectionStartsPage
        && section.rules.lineSpacing?.suppressSpaceBeforeAtPageTop && !style.pageBreakBefore;
      const spacing = block.line ? { spaceBeforePt: 0, spaceAfterPt: 0 } : firstAtPageTop ? { spaceBeforePt: 0 } : {};'''
assert s.count(old)==1
body.write_text(s.replace(old,'      const spacing = block.line ? { spaceBeforePt: 0, spaceAfterPt: 0 } : {};'),encoding='utf8')
p=pathlib.Path('TxtNote/frontend/src/lib/thesisDocxSpacing.test.js');s=p.read_text(encoding='utf8')
start=s.index('  it("the page-top spacing opt-in suppresses')
end=s.index('  it("a caption below a table',start)
p.write_text(s[:start]+s[end:],encoding='utf8')
