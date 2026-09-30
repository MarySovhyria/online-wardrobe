"""Download models once; inference does not require internet access."""
from engine import MODEL_DIR, REPOSITORY, REVISION
from huggingface_hub import hf_hub_download
from rembg import new_session

print('Downloading SegFormer Clothes (about 110 MB)…', flush=True)
for filename in ('preprocessor_config.json', 'onnx/model.onnx'):
    hf_hub_download(REPOSITORY, filename, revision=REVISION, local_dir=MODEL_DIR / 'segformer')
print('Downloading U2Net for standalone clothing (about 176 MB)…', flush=True)
new_session('u2net', providers=['CPUExecutionProvider'])
print('Local clothing extraction is ready. Start the app with npm run dev.', flush=True)
