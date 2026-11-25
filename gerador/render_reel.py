"""Gera um Reel (1080x1920, 30fps, H.264) do Garimpo do Vinho a partir de um JSON de cenas.
uso: python3 render_reel.py spec.json saida.mp4 [--sem-audio]
"""
import json, subprocess, sys, pathlib
from playwright.sync_api import sync_playwright

FPS = 30
here = pathlib.Path(__file__).resolve().parent
spec_path, out = sys.argv[1], sys.argv[2]
audio = "--sem-audio" not in sys.argv
spec = json.load(open(spec_path))
html = (here / "reel.html").read_text().replace("__SPEC__", json.dumps(spec, ensure_ascii=False))
tmp = here / "_reel_tmp.html"
tmp.write_text(html)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--font-render-hinting=none"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto(tmp.as_uri())
    pg.wait_for_function("document.fonts.status === 'loaded'")
    total = pg.evaluate("window.TOTAL")
    n = int(round(total * FPS))
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-"]
    if audio:
        # trilha ambiente sintetizada aqui mesmo (sem direitos de terceiros): acorde suave Lá menor com 9ª
        notes = [110.0, 164.81, 196.0, 246.94, 261.63]
        expr = "+".join(f"0.18*sin(2*PI*{f}*t)*(0.6+0.4*sin(2*PI*{0.11 + i * 0.07:.2f}*t))" for i, f in enumerate(notes))
        cmd += ["-f", "lavfi", "-i", f"aevalsrc='{expr}':s=48000:d={total}",
                "-af", f"lowpass=f=1400,afade=t=in:d=1.5,afade=t=out:st={total - 2}:d=2,volume=0.35",
                "-c:a", "aac", "-b:a", "128k"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-movflags", "+faststart", "-shortest", out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        pg.evaluate(f"window.seek({i / FPS})")
        ff.stdin.write(pg.screenshot(type="jpeg", quality=93))
    ff.stdin.close(); ff.wait()
    b.close()
tmp.unlink()
print(out, f"{total:.1f}s", n, "frames")
