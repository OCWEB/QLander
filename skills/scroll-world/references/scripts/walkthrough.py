#!/usr/bin/env python3
# scroll-world — build a crossfaded walkthrough preview of the whole flight from
# the encoded clips in <workspace>/work/. This is the "what scrolling plays" video.
# Usage:  python3 walkthrough.py <workspace-dir> [--mobile]
# Output: <workspace>/walkthrough.mp4  (or walkthrough_mobile.mp4)
import subprocess, os, sys, json, glob, re

ws = sys.argv[1] if len(sys.argv) > 1 else "."
mobile = "--mobile" in sys.argv
W = os.path.join(ws, "work")
suf = "_m" if mobile else ""
X = 0.3  # crossfade seconds
W_, H_ = (720, 1280) if mobile else (1280, 720)

# discover scene count from dive files
idxs = sorted(int(re.search(r"dive_(\d+)%s\.mp4$" % suf, os.path.basename(p)).group(1))
              for p in glob.glob(os.path.join(W, f"dive_*{suf}.mp4"))
              if re.search(r"dive_(\d+)%s\.mp4$" % suf, os.path.basename(p)))
if not idxs:
    print(f"no dive_*{suf}.mp4 in {W}"); sys.exit(1)

# interleave dive_i, conn_i, dive_{i+1}, ...  (skip missing connectors)
order = []
for k, i in enumerate(idxs):
    order.append(f"dive_{i}{suf}.mp4")
    if k < len(idxs) - 1:
        c = f"conn_{i}{suf}.mp4"
        if os.path.exists(os.path.join(W, c)):
            order.append(c)

def dur(fn):
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","json",os.path.join(W,fn)])
    return float(json.loads(out)["format"]["duration"])

durs = [dur(f) for f in order]
inputs = []
for f in order:
    inputs += ["-i", os.path.join(W, f)]
parts = [f"[{k}:v]scale={W_}:{H_}:force_original_aspect_ratio=increase,crop={W_}:{H_},fps=24,setsar=1[v{k}]"
         for k in range(len(order))]
chain, cum, prev = [], durs[0], "v0"
for k in range(1, len(order)):
    off = cum - X
    chain.append(f"[{prev}][v{k}]xfade=transition=fade:duration={X}:offset={off:.3f}[x{k}]")
    cum += durs[k] - X
    prev = f"x{k}"
filt = ";".join(parts + chain)
out = os.path.join(ws, f"walkthrough{'_mobile' if mobile else ''}.mp4")
subprocess.check_call(["ffmpeg","-y","-loglevel","error", *inputs, "-filter_complex", filt,
    "-map", f"[{prev}]", "-c:v","libx264","-preset","slow","-crf","20" if not mobile else "22",
    "-pix_fmt","yuv420p","-movflags","+faststart", out])
total = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nk=1:nw=1",out]).decode().strip()
print(f"{os.path.basename(out)}: {float(total):.1f}s  {os.path.getsize(out)} bytes  ({len(order)} clips)")
