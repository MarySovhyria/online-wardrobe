"""Binary WebP on stdin; one JSON response on stdout. Photos are never saved."""
import base64
import io
import json
import sys
import warnings


def main():
    from PIL import Image
    from engine import GARMENTS, segment_person, segment_standalone
    if len(sys.argv) != 3 or sys.argv[1] not in ('worn', 'standalone') or sys.argv[2] not in GARMENTS:
        raise ValueError('invalid_options')
    raw = sys.stdin.buffer.read(3 * 1024 * 1024 + 1)
    if not raw or len(raw) > 3 * 1024 * 1024:
        raise ValueError('invalid_image')
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as original:
            if original.format != 'WEBP' or max(original.size) > 1600:
                raise ValueError('invalid_image')
            original.load()
            image = original.convert('RGB')
    mask = segment_person(image, sys.argv[2]) if sys.argv[1] == 'worn' else segment_standalone(image)
    if not mask.getbbox():
        print(json.dumps({'error': 'no_clothing'}))
        return
    output = io.BytesIO()
    mask.save(output, format='PNG')
    print(json.dumps({'masks': ['data:image/png;base64,' + base64.b64encode(output.getvalue()).decode('ascii')]}))


if __name__ == '__main__':
    try:
        main()
    except (ImportError, FileNotFoundError):
        print(json.dumps({'error': 'setup_required'}))
    except Exception:
        # Never echo filenames, image data, environment variables or tracebacks.
        print(json.dumps({'error': 'processing_failed'}))
