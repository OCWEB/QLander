#!/bin/bash
# scroll-world — credit-free ingest of manually-rendered clips.
# Reads a workspace's results/ folder (files named per the manual-queue filename
# contract), encodes them for scroll-scrubbing, extracts the boundary frames the
# Phase-2 connectors need, and (in phase 2) encodes the connectors. NO API CALLS.
#
# Usage:   bash ingest.sh <workspace-dir>
# Layout:  <workspace>/results/   (user drops rendered files here)
#          <workspace>/work/      (this script writes encoded clips + frames here)
#
# Filename contract (in results/):
#   still_{n}_{slug}.png            dive_{n}_{slug}.mp4
#   still_{n}_{slug}_m.png (opt)    dive_{n}_{slug}_m.mp4 (opt, native 9:16)
#   conn_{n}_{fromSlug}-{toSlug}.mp4   (+ _m variant, phase 2)
#
# Run it after Phase 1 (encodes dives, emits connector keyframes) and again after
# Phase 2 (encodes connectors). It only does what is present; safe to re-run.
set -e
WS="${1:-.}"
R="$WS/results"
W="$WS/work"
[ -d "$R" ] || { echo "no results/ dir at $R"; exit 1; }
mkdir -p "$W" "$W/phase2_keyframes"

# NOTE: -nostdin on every ffmpeg call — these run inside a `while read < manifest`
# loop, and ffmpeg otherwise consumes the loop's stdin and corrupts the reads.
enc_desktop () {  # in out
  ffmpeg -nostdin -y -loglevel error -i "$1" -an -vf "unsharp=5:5:0.8:5:5:0.0" \
    -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$2"
}
enc_mobile () {   # in out
  ffmpeg -nostdin -y -loglevel error -i "$1" -an -vf "scale=720:-2,unsharp=5:5:0.6:5:5:0.0" \
    -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
    -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart "$2"
}
first_frame () { ffmpeg -nostdin -y -loglevel error -ss 0 -i "$1" -frames:v 1 -q:v 2 "$2"; }
last_frame  () { ffmpeg -nostdin -y -loglevel error -sseof -0.12 -i "$1" -frames:v 1 -q:v 2 "$2"; }

# --- discover desktop dives -> ordered manifest "n<TAB>slug" ---------------
manifest="$W/scenes.tsv"; : > "$manifest"
for f in "$R"/dive_[0-9]*_*.mp4; do
  [ -e "$f" ] || continue
  b="$(basename "$f" .mp4)"
  case "$b" in *_m) continue;; esac                 # skip mobile here
  n="$(printf '%s' "$b" | sed -E 's/^dive_([0-9]+)_.*/\1/')"
  slug="$(printf '%s' "$b" | sed -E 's/^dive_[0-9]+_(.*)$/\1/')"
  printf '%s\t%s\n' "$n" "$slug" >> "$manifest"
done
sort -n -o "$manifest" "$manifest"
N="$(wc -l < "$manifest" | tr -d ' ')"
[ "$N" -gt 0 ] || echo "no dive_[n]_[slug].mp4 in results/ yet"

# --- Phase 1: encode dives + stills, extract boundary frames --------------
while IFS=$'\t' read -r n slug; do
  [ -n "$n" ] || continue
  echo "scene $n ($slug):"
  enc_desktop "$R/dive_${n}_${slug}.mp4" "$W/dive_${n}.mp4"
  first_frame "$W/dive_${n}.mp4" "$W/frame_dive${n}_first.png"
  last_frame  "$W/dive_${n}.mp4" "$W/frame_dive${n}_last.png"
  [ -f "$R/still_${n}_${slug}.png" ] && cp "$R/still_${n}_${slug}.png" "$W/still_${n}.png"
  if [ -f "$R/dive_${n}_${slug}_m.mp4" ]; then
    enc_mobile "$R/dive_${n}_${slug}_m.mp4" "$W/dive_${n}_m.mp4"
    first_frame "$W/dive_${n}_m.mp4" "$W/still_${n}_m.png"
  fi
  echo "  ok"
done < "$manifest"

# --- emit Phase-2 keyframes + connector map -------------------------------
: > "$W/phase2_keyframes/CONNECTOR_MAP.txt"
i=1
while [ "$i" -lt "$N" ]; do
  j=$((i+1))
  si="$(awk -v k="$i" 'NR==k{print $2}' "$manifest")"
  sj="$(awk -v k="$j" 'NR==k{print $2}' "$manifest")"
  [ -f "$W/frame_dive${i}_last.png" ]  && cp "$W/frame_dive${i}_last.png"  "$W/phase2_keyframes/conn_${i}_start.png"
  [ -f "$W/frame_dive${j}_first.png" ] && cp "$W/frame_dive${j}_first.png" "$W/phase2_keyframes/conn_${i}_end.png"
  echo "conn_${i}_${si}-${sj}.mp4  START=conn_${i}_start.png  END=conn_${i}_end.png" >> "$W/phase2_keyframes/CONNECTOR_MAP.txt"
  i=$j
done

# --- Phase 2: encode connectors if present --------------------------------
conn_found=0
for f in "$R"/conn_[0-9]*.mp4; do
  [ -e "$f" ] || continue
  conn_found=1
  b="$(basename "$f" .mp4)"
  idx="$(printf '%s' "$b" | sed -E 's/^conn_([0-9]+)_.*/\1/')"
  case "$b" in
    *_m) enc_mobile "$f" "$W/conn_${idx}_m.mp4"; echo "connector $idx (mobile) ok";;
    *)   enc_desktop "$f" "$W/conn_${idx}.mp4"; echo "connector $idx ok";;
  esac
done

echo
echo "== work/ =="
( cd "$W" && ls -1 | grep -E '^(dive|conn|still|frame)_' | sort ) || true
echo
if [ "$conn_found" -eq 0 ]; then
  echo "PHASE 1 done. Next: render the connectors in"
  echo "  $W/phase2_keyframes/CONNECTOR_MAP.txt"
  echo "using the conn_*_start.png / conn_*_end.png keyframes in that folder."
else
  echo "All present. Next: seam-qa.sh + walkthrough.py, then wire site/."
fi
