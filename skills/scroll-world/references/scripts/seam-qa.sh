#!/bin/bash
# scroll-world — seam QA. SSIM between each connector's endpoints and the
# neighbouring dive frames. Same-scene shifts read ~0.5-0.85 on dense 3D scenes
# and blend fine under a crossfade; a hard content jump reads much lower.
# Usage: bash seam-qa.sh <workspace-dir>
set -e
WS="${1:-.}"
W="$WS/work"
[ -d "$W" ] || { echo "no work/ dir at $W (run ingest.sh first)"; exit 1; }
tmp="$W/.seam_tmp"; mkdir -p "$tmp"

ssim () {  # a b label
  v=$(ffmpeg -hide_banner -loglevel error -i "$1" -i "$2" -lavfi "ssim=stats_file=-" -f null - 2>&1 | grep -oE 'All:[0-9.]+' | head -1)
  printf "%-28s %s\n" "$3" "$v"
}

i=1
echo "== seams (dive_i end -> conn_i start,  conn_i end -> dive_{i+1} start) =="
while [ -f "$W/conn_${i}.mp4" ]; do
  j=$((i+1))
  ffmpeg -y -loglevel error -ss 0      -i "$W/conn_${i}.mp4" -frames:v 1 -q:v 2 "$tmp/c${i}_first.png"
  ffmpeg -y -loglevel error -sseof -0.12 -i "$W/conn_${i}.mp4" -frames:v 1 -q:v 2 "$tmp/c${i}_last.png"
  [ -f "$W/frame_dive${i}_last.png" ]  && ssim "$W/frame_dive${i}_last.png"  "$tmp/c${i}_first.png" "A$i dive${i}->conn${i}"
  [ -f "$W/frame_dive${j}_first.png" ] && ssim "$tmp/c${i}_last.png" "$W/frame_dive${j}_first.png" "B$i conn${i}->dive${j}"
  i=$j
done
[ "$i" -eq 1 ] && echo "(no encoded connectors yet — run Phase 2 first)"
rm -rf "$tmp"
