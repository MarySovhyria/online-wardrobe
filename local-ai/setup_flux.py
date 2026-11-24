"""Download the pre-quantized model once; inference stays offline."""
from pathlib import Path
import shutil
from huggingface_hub import snapshot_download

root = Path(__file__).resolve().parent.parent / '.local-ai'
root.mkdir(exist_ok=True)
model = root / 'flux2-klein-4b'
marker = model / '.ready'
revision = '860e87183ceb29e39627c0612ebd66d8ea66e68c'
required = [
    'text_encoder/0.safetensors', 'text_encoder/1.safetensors',
    'text_encoder/model.safetensors.index.json',
    'transformer/0.safetensors', 'transformer/1.safetensors',
    'transformer/model.safetensors.index.json',
    'vae/0.safetensors', 'vae/model.safetensors.index.json',
    'tokenizer/tokenizer.json', 'tokenizer/tokenizer_config.json',
    'tokenizer/chat_template.jinja',
]
complete = all((model / name).is_file() and (model / name).stat().st_size > 0 for name in required)
if marker.exists() and marker.read_text() == revision and complete:
    print('FLUX.2 Klein is already installed.')
else:
    if shutil.disk_usage(root).free < 7 * 1024**3:
        raise SystemExit('Free at least 7 GB of disk space, then retry setup.')
    snapshot_download(
        repo_id='mlx-community/flux2-klein-4b-4bit',
        revision=revision,
        local_dir=model,
        allow_patterns=['text_encoder/*', 'transformer/*', 'vae/*', 'tokenizer/*'],
        max_workers=2,
    )
    marker.write_text(revision)
    print('FLUX.2 Klein 4B (4-bit) is ready. No API key needed.')
