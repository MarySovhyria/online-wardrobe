"""Local-only model inference. Run setup.py once to download model files."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / '.local-ai'
os.environ['U2NET_HOME'] = str(MODEL_DIR / 'rembg')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ.setdefault('OMP_NUM_THREADS', '4')

import json
import numpy as np
from PIL import Image

# ATR labels from the SegFormer Clothes model card; skin/hair never selected.
GARMENTS = {'upper': (4,), 'pants': (6,), 'skirt': (5,), 'shoes': (9, 10)}
REPOSITORY = 'Xenova/segformer_b2_clothes'
REVISION = 'b5ddd0f'


def labels_to_mask(labels, piece):
    if piece not in GARMENTS:
        raise ValueError('invalid_piece')
    return Image.fromarray(np.isin(labels, GARMENTS[piece]).astype(np.uint8) * 255)


def segment_person(image, piece):
    import onnxruntime as ort
    model = MODEL_DIR / 'segformer' / 'onnx' / 'model.onnx'
    config_path = MODEL_DIR / 'segformer' / 'preprocessor_config.json'
    if not model.is_file() or not config_path.is_file():
        raise FileNotFoundError('models_missing')
    config = json.loads(config_path.read_text())
    resized = image.convert('RGB').resize(
        (config['size']['width'], config['size']['height']), Image.Resampling.BILINEAR)
    pixels = np.asarray(resized, dtype=np.float32) * config['rescale_factor']
    pixels = (pixels - np.array(config['image_mean'], dtype=np.float32)) / np.array(config['image_std'], dtype=np.float32)
    inputs = np.ascontiguousarray(pixels.transpose(2, 0, 1)[None])
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    session = ort.InferenceSession(str(model), sess_options=options, providers=['CPUExecutionProvider'])
    logits = session.run(None, {session.get_inputs()[0].name: inputs})[0][0]
    # Upsample logits before argmax (not labels) to preserve garment boundaries.
    best = np.full((image.height, image.width), -np.inf, dtype=np.float32)
    labels = np.zeros(best.shape, dtype=np.uint8)
    for label, scores in enumerate(logits):
        scores = np.asarray(Image.fromarray(scores).resize(image.size, Image.Resampling.BILINEAR))
        selected = scores > best
        labels[selected] = label
        best[selected] = scores[selected]
    return labels_to_mask(labels, piece)


def segment_standalone(image):
    from rembg import new_session, remove
    from rembg.sessions.u2net import U2netSession
    if U2netSession.resolve_existing('u2net.onnx') is None:
        raise FileNotFoundError('models_missing')
    session = new_session('u2net', providers=['CPUExecutionProvider'])
    return remove(image.convert('RGB'), session=session, only_mask=True).convert('L')
