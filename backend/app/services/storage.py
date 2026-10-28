import os
import uuid
import hashlib
from io import BytesIO
from typing import Tuple
from PIL import Image
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024

def compute_dhash(image: Image.Image, hash_size: int = 8) -> str:
    """Calculates difference hash (dHash) for fast visual deduplication."""
    # Resize to (hash_size + 1, hash_size) and convert to greyscale
    resized = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    # Compare adjacent pixels
    diff = []
    for row in range(hash_size):
        for col in range(hash_size):
            pixel_left = pixels[row * (hash_size + 1) + col]
            pixel_right = pixels[row * (hash_size + 1) + col + 1]
            diff.append("1" if pixel_left > pixel_right else "0")
    # Convert binary list to hex string
    binary_str = "".join(diff)
    return hex(int(binary_str, 2))[2:].zfill(hash_size * hash_size // 4)

class StorageService:
    @staticmethod
    async def process_and_save_image(file: UploadFile) -> Tuple[str, str, int, str, str]:
        """
        Validates, strips EXIF, re-encodes, and saves the image.
        Returns: (relative_storage_path, mime_type, file_size, sha256_hex, phash_hex)
        """
        contents = await file.read()
        if len(contents) > MAX_FILE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded image exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB"
            )

        # Compute sha256 of raw upload
        sha256_hex = hashlib.sha256(contents).hexdigest()

        # Validate with Pillow
        try:
            raw_image = Image.open(BytesIO(contents))
            raw_image.verify()  # Check magic bytes and header validity
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a valid image format (JPEG, PNG, or WebP required)."
            )

        # Reopen to convert & strip EXIF
        image = Image.open(BytesIO(contents))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        phash_hex = compute_dhash(image)

        # Re-encode as clean JPEG without EXIF
        filename = f"{uuid.uuid4().hex}.jpg"
        save_path = os.path.join(settings.UPLOAD_DIR, filename)

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=85, optimize=True)
        cleaned_bytes = buffer.getvalue()

        with open(save_path, "wb") as f:
            f.write(cleaned_bytes)

        relative_path = f"uploads/{filename}"
        return relative_path, "image/jpeg", len(cleaned_bytes), sha256_hex, phash_hex

storage_service = StorageService()
