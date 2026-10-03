"""Minimal unit tests for the comparison / tolerance logic: python -m unittest orchestration/tools/test_conformance.py"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conformance import compare, rle


class CompareTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
