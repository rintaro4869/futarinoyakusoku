import struct, zlib, os

def create_png(width, height, r, g, b):
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    row = b'\x00' + bytes([r, g, b] * width)
    idat = chunk(b'IDAT', zlib.compress(row * height))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

base = os.path.dirname(os.path.abspath(__file__))

files = {
    'icon.png':          (1024, 1024, 236, 72, 153),   # ピンク
    'splash-icon.png':   (1024, 1024, 253, 242, 248),  # 薄ピンク
    'adaptive-icon.png': (1024, 1024, 236, 72, 153),   # ピンク
    'favicon.png':       (64,   64,   236, 72, 153),   # ピンク
}

for name, (w, h, r, g, b) in files.items():
    path = os.path.join(base, name)
    with open(path, 'wb') as f:
        f.write(create_png(w, h, r, g, b))
    print(f'✓ {name} を生成しました')

print('完了')
