"""Verify UTF-8 stream corruption hypothesis against source assets."""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(__file__).parent / "02-generated-report.pdf"
LOGO = ROOT / "packages/shared/src/pdf-v2/assets/clinic-logo.jpg"


def utf8_via_js_pipeline(data: bytes) -> bytes:
    """Mirror pdf-writer: binaryToLatin1 + TextEncoder UTF-8."""
    return data.decode("latin1").encode("utf-8")


def extract_stream(pdf: bytes, obj_num: int, offset: int) -> tuple[int, bytes]:
    start = pdf.find(f"{obj_num} 0 obj".encode(), offset - 5 if offset else 0)
    chunk = pdf[start : start + 2000000]
    decl = int(re.search(rb"/Length\s+(\d+)", chunk).group(1))
    sm = re.search(rb"stream\r?\n", chunk)
    em = chunk.find(b"endstream", sm.end())
    return decl, chunk[sm.end() : em]


pdf = PDF.read_bytes()
logo_src = LOGO.read_bytes()
offsets = [9, 450709, 459055, 459246, 460738, 466337, 466470, 579591]

lines = []
lines.append(f"source_logo_len={len(logo_src)} head={logo_src[:4].hex()}")

decl1, font_stream = extract_stream(pdf, 1, offsets[0])
decl4, cid_stream = extract_stream(pdf, 4, offsets[3])
decl7, logo_stream = extract_stream(pdf, 7, offsets[6])

lines.append(f"pdf_font declared={decl1} extracted={len(font_stream)}")
lines.append(f"pdf_cidmap declared={decl4} extracted={len(cid_stream)} expected_raw={(0x24F+1)*2}")
lines.append(f"pdf_logo declared={decl7} extracted={len(logo_stream)} head={logo_stream[:4].hex()}")

# Build expected CID map from known algorithm: load font via base64 from TS file is heavy; use declared length as proxy
lines.append(f"logo_src_utf8_corrupt_len={len(utf8_via_js_pipeline(logo_src))}")
lines.append(f"logo_match={'yes' if len(utf8_via_js_pipeline(logo_src)) == len(logo_stream) else 'no'}")

# If logo corrupts via utf8, first bytes of corrupt should match pdf
corrupt_logo = utf8_via_js_pipeline(logo_src)
lines.append(f"corrupt_logo_head={corrupt_logo[:4].hex()} pdf_logo_head={logo_stream[:4].hex()}")
lines.append(f"corrupt_logo_matches_pdf={corrupt_logo[:32] == logo_stream[:32]}")

# CID map: regenerate raw from font if we can get font size from obj1 declared length
decl_font = decl1
# font source should be decl_font bytes - verify first 4 bytes in pdf vs expected TTF
lines.append(f"pdf_font_head={font_stream[:4].hex()} expected_ttf=00010000")
lines.append(f"pdf_font_starts_with_ttf={font_stream[:4] == bytes.fromhex('00010000')}")

# Check high-byte expansion ratio
def expansion_ratio(raw: bytes, embedded: bytes) -> float:
    return len(embedded) / len(raw) if raw else 0

# For CID map, simulate with raw length 1184
raw_cid = bytes(1184)  # placeholder zeros - ratio still works for random binary from font cmap
# use actual first 1184 of what decl says - the DECLARED length is RAW length
# embedded should equal utf8_corrupt(raw_cid) if hypothesis holds - but we don't have raw. 
# Instead verify: declared lengths match RAW source sizes, extracted lengths match UTF-8 corrupt

lines.append(f"logo_expansion={expansion_ratio(logo_src, logo_stream):.4f}")
lines.append(f"font_expansion_if_raw_is_decl={expansion_ratio(bytes(decl1), font_stream):.4f}")

# GID corruption at CID 0x021B
cid = 0x021B
off = cid * 2
gid_pdf = (cid_stream[off] << 8) | cid_stream[off + 1]
lines.append(f"GID_at_021B_in_pdf={gid_pdf} (0x{gid_pdf:04x})")

# Simulate correct map: if bytes were 0x01 0xF3 (499), utf8 corrupt would be...
sample_gid_bytes = bytes([0x01, 0xF3])
lines.append(f"sample_gid_499_utf8_corrupt={utf8_via_js_pipeline(sample_gid_bytes).hex()}")

# Find 0x0219 mapping - should be reasonable
for cp in [0x0219, 0x021B, 0x0103]:
    o = cp * 2
    g = (cid_stream[o] << 8) | cid_stream[o + 1]
    lines.append(f"CID {cp:#06x} GID={g}")

out = Path(__file__).parent / "utf8-corruption-check.txt"
out.write_text("\n".join(lines), encoding="utf-8")
print(out.read_text(encoding="utf-8"))
