import io
import json
from pathlib import Path
import subprocess
import sys
import unittest
import numpy as np
from PIL import Image
from engine import labels_to_mask


class MaskTests(unittest.TestCase):
    def test_upper_clothing_excludes_skin_hair_and_bottoms(self):
        labels = np.array([[0, 2, 4, 6, 11, 14, 15]], dtype=np.uint8)
        self.assertEqual(np.asarray(labels_to_mask(labels, 'upper')).tolist(), [[0, 0, 255, 0, 0, 0, 0]])

    def test_shoes_include_both_feet_but_not_legs(self):
        labels = np.array([[9, 10, 12, 13]], dtype=np.uint8)
        self.assertEqual(np.asarray(labels_to_mask(labels, 'shoes')).tolist(), [[255, 255, 0, 0]])

    def test_skirt_and_trousers_stay_separate(self):
        labels = np.array([[5, 6]], dtype=np.uint8)
        self.assertEqual(np.asarray(labels_to_mask(labels, 'skirt')).tolist(), [[255, 0]])
        self.assertEqual(np.asarray(labels_to_mask(labels, 'pants')).tolist(), [[0, 255]])

    def test_worker_rejects_invalid_images_before_model_loading(self):
        worker = Path(__file__).with_name('extract.py')
        for data in [b'invalid', self.oversized_image()]:
            result = subprocess.run([sys.executable, str(worker), 'worn', 'upper'], input=data, capture_output=True, check=True)
            self.assertEqual(json.loads(result.stdout), {'error': 'processing_failed'})

    @staticmethod
    def oversized_image():
        data = io.BytesIO()
        Image.new('RGB', (1601, 10)).save(data, format='WEBP')
        return data.getvalue()


if __name__ == '__main__':
    unittest.main()
