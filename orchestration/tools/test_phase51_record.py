import unittest
from orchestration.tools.phase51_record import retained_failure_unchanged


class RegressionGateTests(unittest.TestCase):
    def test_same_failure_id_cannot_hide_changed_measurement(self):
        before = {'status': 'FAIL', 'actual': {'pdf': '40', 'word': '41'}}
        self.assertTrue(retained_failure_unchanged(before, dict(before)))
        self.assertFalse(retained_failure_unchanged(before, {'status': 'FAIL', 'actual': {'pdf': '40', 'word': '42'}}))
        self.assertFalse(retained_failure_unchanged(before, {'status': 'SKIPPED', 'actual': None}))


if __name__ == '__main__':
    unittest.main()
