"""Temporary PDF investigation script — not part of application code."""
import re
from pathlib import Path

PDF = Path(__file__).parent / "02-generated-report.pdf"
OUT = Path(__file__).parent / "pdf-analysis.txt"

data = PDF.read_bytes()
lines: list[str] = []

lines.append(f"file_size={len(data)}")
lines.append(f"header={data[:8]!r}")

offsets = [0, 9, 450709, 459055, 459246, 460738, 466337, 466470, 579591, 607085, 607143, 607303]
for i, off in enumerate(offsets[1:], 1):
    chunk = data[off : off + 120]
    lines.append(f"OBJ {i} @ {off}: {chunk!r}")

# Object 5 — CIDFont with /W
off = offsets[5]
obj5 = data[off : data.find(b"endobj", off)]
wm = re.search(rb"/W\s+(.+)>>", obj5, re.S)
if wm:
    w = wm.group(1).decode("latin1").strip()
    groups = re.findall(r"(\d+)\[\s*([^\]]*)\s*\]", w)
    max_cid = 0
    total_widths = 0
    for start, widths in groups:
        start_i = int(start)
        n = len(widths.split())
        total_widths += n
        max_cid = max(max_cid, start_i + n - 1)
    lines.append(f"W len_chars={len(w)} groups={len(groups)} total_widths={total_widths}")
    lines.append(f"W max_cid={max_cid} expected_max=0x24f={0x24F}")
    lines.append(f"W first_group={groups[0] if groups else None}")
    lines.append(f"W last_group={groups[-1] if groups else None}")

# Object 4 — CIDToGIDMap
off4 = offsets[4]
obj4 = data[off4 : data.find(b"endobj", off4)]
sm = re.search(rb"stream\r?\n", obj4)
em = obj4.rfind(b"endstream")
cid_map = obj4[sm.end() : em]
decl = int(re.search(rb"/Length\s+(\d+)", obj4).group(1))
lines.append(f"CIDToGIDMap declared={decl} actual={len(cid_map)} expected={(0x24F + 1) * 2}")

# Object 1 — FontFile2
off1 = offsets[1]
obj1 = data[off1 : data.find(b"endobj", off1)]
sm = re.search(rb"stream\r?\n", obj1)
em = obj1.rfind(b"endstream")
font_stream = obj1[sm.end() : em]
decl1 = int(re.search(rb"/Length\s+(\d+)", obj1).group(1))
lines.append(f"FontFile2 declared={decl1} actual={len(font_stream)}")
lines.append(f"FontFile2 endstream_inside={font_stream.count(b'endstream')}")
if decl1 != len(font_stream):
    lines.append("*** FontFile2 LENGTH MISMATCH — stream truncated at first endstream ***")

# Object 7 — Logo JPEG
off7 = offsets[7]
obj7 = data[off7 : data.find(b"endobj", off7)]
sm = re.search(rb"stream\r?\n", obj7)
em = obj7.rfind(b"endstream")
logo = obj7[sm.end() : em]
lines.append(f"Logo head={logo[:4].hex()} is_jpeg={logo[:2]==bytes([0xFF,0xD8])} len={len(logo)}")

# Content stream hex strings
off8 = offsets[8]
obj8 = data[off8 : data.find(b"endobj", off8)]
content = obj8.split(b"stream\n", 1)[1].rsplit(b"\nendstream", 1)[0]
hexes = re.findall(rb"<([0-9A-F]+)>\s*Tj", content)
lines.append(f"content Tj count={len(hexes)}")

# ToUnicode
off2 = offsets[2]
obj2 = data[off2 : data.find(b"endobj", off2)]
touni = obj2.split(b"stream\n", 1)[1].rsplit(b"\nendstream", 1)[0].decode("latin1")
lines.append(f"ToUnicode len={len(touni)} has_0219={'0219' in touni} has_0103={'0103' in touni}")

def gid_for_cid(cid: int) -> int:
    return (cid_map[cid * 2] << 8) | cid_map[cid * 2 + 1]

for cp in [0x61, 0x0103, 0x0219, 0x021B, 0x00EE, 0x00E2]:
    gid = gid_for_cid(cp) if cp <= 0x24F else -1
    lines.append(f"CID {cp:#06x} -> GID {gid}")

# Check if W covers Romanian diacritics
for cp in [0x0103, 0x0219, 0x021B]:
    covered = cp <= max_cid
    lines.append(f"W covers CID {cp:#06x}: {covered}")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT}")
