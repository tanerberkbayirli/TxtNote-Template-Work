"""Minimal unit tests for the comparison / tolerance logic: python -m unittest orchestration/tools/test_conformance.py"""
import json, os, sys, tempfile, unittest, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conformance import compare, drawn_font_names, open_end, rle, run_check
from pdfmeasure import open_pdf, MM2PT, spans


class CompareTests(unittest.TestCase):
    def test_visible_geometry_ignores_outer_spaces_but_preserves_internal_spacing(self):
        import pymupdf
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((100, 100), '  visible text   ', fontsize=12)
        row = spans(page)[0]
        leading = pymupdf.get_text_length('  ', fontsize=12)
        width = pymupdf.get_text_length('visible text', fontsize=12)
        self.assertAlmostEqual(row['x0'] * MM2PT, 100 + leading, places=3)
        self.assertAlmostEqual((row['x1'] - row['x0']) * MM2PT, width, places=3)
        self.assertEqual(row['text'], '  visible text   ')
        doc.close()

    def test_font_text_scope_retains_wrong_fonts_in_selected_prose(self):
        class Fixture:
            def pages(self, selector):
                return [1]
            def lines(self, page, with_page_numbers):
                return [{'text': 'Prose evidence', 'spans': [{'font': 'ABCDEF+WrongFont'}]},
                        {'text': '𝐸=𝑚𝑐', 'spans': [{'font': 'CambriaMath'}]}]
        self.assertEqual(drawn_font_names(Fixture(), {}), {'WrongFont', 'CambriaMath'})
        self.assertEqual(drawn_font_names(Fixture(), {'regex': '[A-Za-z]{2,}'}), {'WrongFont'})
        self.assertEqual(drawn_font_names(Fixture(), {'ignore': '^Prose'}), {'CambriaMath'})
        self.assertEqual(drawn_font_names(Fixture(), {'regex': '^Absent$'}), set())

    def test_within_tolerance(self):
        self.assertEqual(compare(35.0, 35.4, 0.5), (True, 0.4))

    def test_exactly_on_tolerance_passes(self):
        self.assertTrue(compare(35.0, 35.5, 0.5)[0])

    def test_outside_tolerance_fails_with_signed_delta(self):
        # AGENTS.md section 4: expected 35.00, measured 35.82 must FAIL at 0.5 mm
        ok, d = compare(35.0, 35.82, 0.5)
        self.assertFalse(ok)
        self.assertAlmostEqual(d, 0.82)
        self.assertAlmostEqual(compare(35.0, 34.0, 0.5)[1], -1.0)

    def test_missing_actual_fails(self):
        self.assertEqual(compare(1, None), (False, None))

    def test_lists_elementwise_and_length(self):
        self.assertTrue(compare([1, 2], [1.2, 2.4], 0.5)[0])
        self.assertFalse(compare([1, 2], [1.2, 2.6], 0.5)[0])
        self.assertFalse(compare([1, 2], [1], 0.5)[0])

    def test_strings_and_bools_exact(self):
        self.assertTrue(compare("a", "a")[0])
        self.assertFalse(compare("a", "b")[0])
        self.assertFalse(compare(1, True)[0])

    def test_rle_labels(self):
        self.assertEqual(rle(["", "", "i", "ii", "1"]), "none x2, i, ii, 1")

    def test_open_end_labels(self):
        self.assertEqual(open_end("none x2, ii, iii, 1, 2, 3"), "none x2, ii, iii, 1..N")
        self.assertEqual(open_end("i, 1"), "i, 1")  # a single trailing page stays exact
        self.assertEqual(open_end("1, 2, 5, 6"), "1, 2, 5..N")  # a gap breaks the run


class LandmarkTests(unittest.TestCase):
    def setUp(self):
        import pymupdf
        self.tmp = tempfile.TemporaryDirectory()
        self.pdf = os.path.join(self.tmp.name, 'test.pdf')
        doc = pymupdf.open()
        page = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        page.insert_text((30 * MM2PT, 40 * MM2PT), 'Evidence heading', fontsize=12)
        page.insert_text((30 * MM2PT, 275 * MM2PT), 'ii', fontsize=12)
        doc.save(self.pdf)
        doc.close()
        self.layout = os.path.join(self.tmp.name, 'test.layout.json')
        self.report = {'version': 1, 'pages': [{'page': 1, 'landmarks': [
            {'id': 'body:heading:1', 'kind': 'heading', 'text': 'Evidence heading',
             'xMm': 30, 'yMm': 36, 'widthMm': 30, 'heightMm': 4, 'firstBaselineMm': 40,
             'lastBaselineMm': 40, 'fontSizePt': 12}], 'textOps': [
                 {'id': 'run1', 'landmarkId': 'body:heading:1', 'text': 'Evidence heading',
                  'xMm': 30, 'baselineMm': 40, 'fontSizePt': 12}]}]}
        self.ctx = {'variants': {'default': {'pdf': self.pdf, 'layout': self.layout}}}

    def tearDown(self):
        for doc in self.ctx.get('_docs', {}).values():
            doc.pdf.close()
        self.tmp.cleanup()

    def check(self, kind, params=None, expected=0):
        with open(self.layout, 'w', encoding='utf8') as f:
            json.dump(self.report, f)
        self.ctx.pop('_layouts', None)
        return run_check(self.ctx, {'id': 'test', 'kind': kind, 'params': params or {},
                                    'expected': expected, 'tolerance': .25})

    def test_actual_pdf_crosscheck_rejects_tampered_layout_and_missing_text(self):
        self.assertEqual(self.check('layout_pdf_consistency')['status'], 'PASS')
        self.report['pages'][0]['textOps'][0]['baselineMm'] = 40.26
        self.assertEqual(self.check('layout_pdf_consistency')['status'], 'FAIL')
        self.report['pages'][0]['textOps'][0]['text'] = 'Invented text'
        self.assertEqual(self.check('layout_pdf_consistency')['status'], 'FAIL')

    def test_landmark_location_and_page_use_source_expectations(self):
        self.assertEqual(self.check('landmark_x', {'id': 'body:heading:1'}, 30)['status'], 'PASS')
        self.assertEqual(self.check('landmark_y', {'regex': 'Evidence'}, 40)['status'], 'PASS')
        self.assertEqual(self.check('page_of', {'kind': 'heading'}, 1)['status'], 'PASS')
        self.assertEqual(self.check('landmark_x', {'id': 'missing'}, 30)['status'], 'FAIL')

    def test_page_number_search_region_can_find_number_outside_bottom_25mm(self):
        from conformance import Doc
        doc = Doc(self.pdf)
        self.assertEqual(doc.page_num(1)['text'], 'ii')
        self.assertIsNone(doc.page_num(1, {'yMinMm': 280, 'yMaxMm': 297}))
        doc.pdf.close()

    def test_page_label_each_checks_labels_without_inventing_page_count(self):
        self.assertEqual(self.check('page_labels', {'each': True}, 'ii')['status'], 'PASS')
        self.assertEqual(self.check('page_labels', {'each': True}, '')['status'], 'FAIL')
        self.assertEqual(self.check('page_labels', {'each': True, 'pages': {'find': '^Absent$'}}, '')['status'], 'FAIL')

    def test_toc_labels_accept_centered_rows_without_leaders_only_when_declared(self):
        import pymupdf
        doc = pymupdf.open()
        first = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        first.insert_text((30 * MM2PT, 40 * MM2PT), 'ICINDEKILER', fontname='hebo')
        first.insert_text((30 * MM2PT, 60 * MM2PT), 'GIRIS', fontname='hebo')
        first.insert_text((177 * MM2PT, 60 * MM2PT), '1', fontname='hebo')
        first.insert_text((100 * MM2PT, 285 * MM2PT), 'iv')
        second = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        second.insert_text((30 * MM2PT, 40 * MM2PT), 'GIRIS')
        second.insert_text((100 * MM2PT, 285 * MM2PT), '1')
        doc.save(self.pdf)
        doc.close()
        params = {'toc_title': '^ICINDEKILER$'}
        self.assertEqual(self.check('toc_labels', params)['status'], 'FAIL')
        result = self.check('toc_labels', {**params, 'leader': 'none'})
        self.assertEqual(result['status'], 'PASS', result)
        self.assertEqual(result['actual'], '1/1')

    def test_toc_labels_use_only_declared_source_index_for_unprinted_counted_pages(self):
        import pymupdf
        doc = pymupdf.open()
        toc = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        toc.insert_text((30 * MM2PT, 40 * MM2PT), 'ICINDEKILER', fontname='hebo')
        toc.insert_text((30 * MM2PT, 60 * MM2PT), 'TEZ KABUL VE ONAY SAYFASI')
        toc.insert_text((177 * MM2PT, 60 * MM2PT), 'ii')
        approval = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        approval.insert_text((30 * MM2PT, 40 * MM2PT), 'TEZ KABUL VE ONAY SAYFASI')
        ethics = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        ethics.insert_text((30 * MM2PT, 40 * MM2PT), 'BILIMSEL ETIK BILDIRIMI')
        arabic = doc.new_page(width=210 * MM2PT, height=297 * MM2PT)
        arabic.insert_text((30 * MM2PT, 40 * MM2PT), 'GIRIS')
        arabic.insert_text((100 * MM2PT, 285 * MM2PT), '1')
        doc.save(self.pdf)
        doc.close()
        params = {
            'toc_title': '^ICINDEKILER$', 'leader': 'none',
            'hidden_index_labels': [{'title_regex': '^TEZ KABUL VE ONAY SAYFASI$', 'label': 'ii'}],
        }
        result = self.check('toc_labels', params)
        self.assertEqual(result['status'], 'PASS', result)
        self.assertIn('ii (unprinted)', result['note'])

        # A declared source label never masks a wrong contents number or a newly printed page numeral.
        wrong = pymupdf.open(self.pdf)
        wrong_page = wrong[0]
        wrong_page.draw_rect(pymupdf.Rect(176 * MM2PT, 56 * MM2PT, 184 * MM2PT, 63 * MM2PT), color=(1, 1, 1), fill=(1, 1, 1))
        wrong_page.insert_text((177 * MM2PT, 60 * MM2PT), 'iv')
        wrong.save(self.pdf + '.bad')
        wrong.close()
        self.ctx['variants']['default']['pdf'] = self.pdf + '.bad'
        result = self.check('toc_labels', params)
        self.assertEqual(result['status'], 'FAIL', result)

    def test_balanced_counts_do_not_allow_orphan_end_or_paragraph_in_fldsimple(self):
        xml = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:fldChar w:fldCharType="end"/><w:fldChar w:fldCharType="begin"/></w:r></w:p><w:fldSimple><w:p/></w:fldSimple></w:body></w:document>'
        path = os.path.join(self.tmp.name, 'bad.docx')
        with zipfile.ZipFile(path, 'w') as z:
            z.writestr('word/document.xml', xml)
        self.ctx['variants']['default']['docx'] = path
        result = self.check('docx_no_undefined')
        self.assertEqual(result['status'], 'FAIL')
        self.assertTrue(any('orphan' in hit for hit in result['actual']))
        self.assertTrue(any('fldSimple' in hit for hit in result['actual']))

    def test_footer_paragraph_sequence_rejects_missing_extra_or_reordered_blank(self):
        path = os.path.join(self.tmp.name, 'footer.docx')
        self.ctx['variants']['default']['docx'] = path
        field = '<w:p><w:r><w:instrText> PAGE </w:instrText></w:r></w:p>'
        blank = '<w:p><w:r><w:t> </w:t></w:r></w:p>'
        for rows, status in [(field + blank, 'PASS'), (field, 'FAIL'),
                             (blank + field, 'FAIL'), (field + blank + blank, 'FAIL'), (blank, 'FAIL')]:
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('word/footer1.xml', f'<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">{rows}</w:ftr>')
            result = self.check('docx_paragraph_sequence',
                                {'part_regex': '^word/footer', 'require_field': 'PAGE'},
                                [{'field_regex': 'PAGE', 'empty': False}, {'empty': True}])
            self.assertEqual(result['status'], status)


class FieldDumpTests(unittest.TestCase):
    """fields_cached_match compares per kind: TOC text, SEQ/PAGE in order, PAGEREF per bookmark; TOC-internal PAGEREF rebuilds are ignored."""
    def run_dump(self, before, after, np_cached='7', np_after='7'):
        import conformance
        with tempfile.TemporaryDirectory() as tmp:
            dump, docx = os.path.join(tmp, 'f.json'), os.path.join(tmp, 'a.docx')
            json.dump({'before': before, 'after': after}, open(dump, 'w'))
            footer = ('<w:p><w:r><w:instrText> NUMPAGES</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>'
                      '<w:r><w:t>%s</w:t></w:r></w:p>') % np_cached
            with zipfile.ZipFile(docx, 'w') as z:
                z.writestr('word/footer1.xml', footer)
            ctx = {'variants': {'default': {'wordFieldDump': dump, 'docx': docx}}}
            return conformance.k_fields_cached_match(ctx, {'params': {}})

    def row(self, code, result, part='body'):
        return {'part': part, 'type': 0, 'code': code, 'result': result}

    def test_equal_and_toc_rebuild_ignored(self):
        before = [self.row('TOC \h', 'A	1'), self.row('PAGEREF _ref_a \h', '1'), self.row('SEQ Tablo', '1')]
        after = [self.row('TOC \h', 'A	1'), self.row('PAGEREF _Toc1 \h', '1'), self.row('SEQ Tablo', '1'), self.row('NUMPAGES', '7', 'footer1.1')]
        self.assertTrue(self.run_dump(before, after)['pass'])

    def test_changed_seq_or_numpages_fail(self):
        self.assertFalse(self.run_dump([self.row('SEQ Tablo', '1')], [self.row('SEQ Tablo', '2')])['pass'])
        self.assertFalse(self.run_dump([self.row('PAGE', '1', 'footer1.1')], [self.row('PAGE', '1', 'footer1.1'), self.row('NUMPAGES', '9', 'footer1.1')], np_cached='7')['pass'])


if __name__ == "__main__":
    unittest.main()
