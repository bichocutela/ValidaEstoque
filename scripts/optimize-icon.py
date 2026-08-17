from pathlib import Path
from PIL import Image

source = Path("/home/ubuntu/webdev-static-assets/validaestoque-icon.png")
target = Path("/home/ubuntu/validade-estoque/assets/images/validaestoque-storage.png")

with Image.open(source).convert("RGBA") as image:
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    image.save(target, "PNG", optimize=True, compress_level=9)

print(target)
