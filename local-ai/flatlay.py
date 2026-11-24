"""Generate a reviewable garment image. Input and output photos stay in memory."""
import base64
import contextlib
import io
import json
import os
from pathlib import Path
import platform
import secrets
import sys
import warnings

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / '.local-ai/flux2-klein-4b'
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['MFLUX_CACHE_DIR'] = str(ROOT / '.local-ai/mflux-cache')
os.environ['MPLCONFIGDIR'] = str(ROOT / '.local-ai/matplotlib')
GARMENTS = {
    'upper': 'upper-body garment',
    'jacket': 'outermost jacket or coat, without the top underneath',
    'pants': 'trousers or shorts',
    'skirt': 'skirt',
    'shoes': 'matching pair of shoes',
}


def main():
    if platform.system() != 'Darwin' or platform.machine() != 'arm64':
        return {'error': 'unsupported_platform'}
    if not (MODEL / '.ready').is_file():
        return {'error': 'setup_required'}
    if len(sys.argv) != 2 or sys.argv[1] not in GARMENTS:
        return {'error': 'invalid_image'}
    from PIL import Image
    raw = sys.stdin.buffer.read(3 * 1024 * 1024 + 1)
    if not raw or len(raw) > 3 * 1024 * 1024:
        return {'error': 'invalid_image'}
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as source:
            if source.format != 'WEBP' or max(source.size) > 1600 or min(source.size) < 32:
                return {'error': 'invalid_image'}
            source.load()
            reference = source.convert('RGB')
    reference.thumbnail((512, 512), Image.Resampling.LANCZOS)
    from worker_lock import model_lock
    from filelock import Timeout
    try:
        with model_lock():
            # Library progress must never corrupt the JSON protocol.
            with contextlib.redirect_stdout(sys.stderr):
                import mlx.core as mx
                from mflux.models.common.config import ModelConfig
                from mflux.models.flux2.variants import Flux2KleinEdit
                from mflux.callbacks.instances.memory_saver import MemorySaver
                mx.set_cache_limit(128 * 1024**2)
                model = Flux2KleinEdit(model_config=ModelConfig.flux2_klein_4b(), model_path=str(MODEL))
                model.callbacks.register(MemorySaver(model=model, keep_transformer=False, cache_limit_bytes=128 * 1024**2))
                garment = GARMENTS[sys.argv[1]]
                prompt = (
                    f'Remove the person and background, keeping only the exact {garment} in the input photo. '
                    'Show this same item as a front-facing flat-lay product photo, upright, centered on white, '
                    'with the entire item visible and a small margin around it. '
                    'Preserve its garment type, sleeve length, neckline, silhouette, exact color, fabric and design. '
                    'Fill only the hidden fabric to complete the item. No person, mannequin, hanger or other items.'
                )
                # MFLUX ImageUtil accepts PIL images directly: no temporary photo files.
                result = model.generate_image(seed=secrets.randbelow(2**31), prompt=prompt,
                    image_paths=[reference], num_inference_steps=4, width=512, height=512, guidance=1.0)
                output = io.BytesIO()
                result.image.save(output, format='PNG')
            return {'image': 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode('ascii')}
    except Timeout:
        return {'error': 'busy'}


if __name__ == '__main__':
    try:
        result = main()
    except (ImportError, FileNotFoundError):
        result = {'error': 'setup_required'}
    except Exception:
        result = {'error': 'processing_failed'}
    print(json.dumps(result))
