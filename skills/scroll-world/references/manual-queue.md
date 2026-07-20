# Manual queue — default generation mode

This is QLander's default Scroll World path. Instead of the agent
spending credits to generate stills and clips, the agent **emits a prompt queue** that the
user renders by hand in Magnific's slow/relax queue, then hands the files back. The
agent does only **local** work (encode, frame extraction, seam QA, walkthrough, wiring)
with the scripts in `references/scripts/` — **no generation API is called**.

Use this unless the user explicitly selects an automated/API generation path. Provider
availability, limits, and account charges remain governed by the user's live account; do
not describe the provider itself as free without verifying that account.

Before preparing Phase 2, confirm the selected video interface accepts both start and end
frames. If it does not, do not claim the connector workflow will be seamless; offer the
sequential forward-take workflow or an image-led QLander fallback.

## Workspace layout (one per client, in the scratchpad)

```
scroll-world-<client>/
  queue.md                 # agent writes this from the intake (see queue-template.md)
  queue.json               # machine-readable status; keep synchronized with queue.md
  results/                 # USER drops rendered files here, named per the contract
  work/                    # agent's encoded clips + extracted frames (ingest.sh writes)
    phase2_keyframes/      # start/end frames for the connectors + CONNECTOR_MAP.txt
  site/                    # final scrub-engine bundle
  walkthrough.mp4          # preview (walkthrough.py)
```

## Filename contract (how the folder handoff works)

The queue names the exact output file for every job; ingest matches by filename. `{n}` is the
1-based scene index, `{slug}` a short scene id (e.g. `clinic`).

| Job | Save into `results/` as |
|---|---|
| Scene still | `still_{n}_{slug}.png` |
| Dive clip | `dive_{n}_{slug}.mp4` |
| Connector | `conn_{n}_{fromSlug}-{toSlug}.mp4` |
| Mobile variant (opt-in) | same name + `_m` before the extension, rendered **native 9:16** |

Boundary frames the agent hands back for Phase 2 live in `work/phase2_keyframes/` as
`conn_{i}_start.png` / `conn_{i}_end.png` (mapped in `CONNECTOR_MAP.txt`).

## Machine-readable queue contract

Create `queue.json` with `version`, `experience`, `mode`, `provider`, `mobile`,
`status`, `updatedAt`, and `jobs`. Each job records `id`, `phase`, `kind`, exact
`filename`, `status`, and dependency IDs. Use
`references/queue-template.json` as the starting shape.

Update both queue files whenever a job is added, rendered, ingested, rejected, or
passes QA. QLander validates the JSON schema, experience reference, and dependency
IDs; it never stores credentials or provider account data.

## Two phases (connectors depend on rendered dive frames)

Connectors must frame-lock to the **actual rendered** dive frames, which don't exist until
the dives render. So the queue splits:

1. **Phase 1** — N stills + N dives (+ `_m` variants if mobile). No dependencies; render in
   any order. Each dive uses its own still as the **start frame** (start-image only, no end).
2. **Agent (local):** `bash references/scripts/ingest.sh <workspace>` — encodes the dives,
   extracts the 2N−2 boundary frames, and writes `work/phase2_keyframes/` + `CONNECTOR_MAP.txt`.
   The agent then fills in **Phase 2** of `queue.md`.
3. **Phase 2** — N−1 connectors. Each job names a **start frame** and **end frame** from
   `work/phase2_keyframes/`; the user uploads both as keyframes in Magnific.
4. **Agent (local):** `ingest.sh` again (encodes connectors) →
   `bash references/scripts/seam-qa.sh <workspace>` (SSIM check) →
   `python3 references/scripts/walkthrough.py <workspace>` (+ `--mobile`) → assemble using
   the selected Step 7 delivery mode. For QLander, copy approved assets into
   `public/experiences/<slug>/` and populate the registered experience config; do not build
   the standalone `site/` bundle first.

## How the user runs each job in Magnific (put in the queue header)

1. Open the video/image generator and select its **slow/relax queue**.
2. Pick the model named in the job (e.g. Seedance 2.0 for video, your chosen image model).
3. Paste the job's **prompt**; set **aspect ratio / resolution / duration** as stated.
4. For dives: attach the named **start frame**. For connectors: attach **start + end** frames.
5. When it finishes, **download and save into `results/` with the exact filename** shown.

## Encode settings the scripts apply (for reference)

- Desktop clips: native 1080p, `-g 8`, `crf 20`, `unsharp`, `+faststart`, no audio.
- Mobile clips: `scale=720` (native 9:16 source), `-g 4`, `crf 23`.
- Boundary frames: first at `-ss 0`, last at `-sseof -0.12`.
- The engine loads clips as blobs, so seekability is fine on any static host.

## Notes

- One image model for all stills, one video model for all clips (cohesion — SKILL Step 4).
- If the live interface cannot take start+end keyframes for a connector, do not use this
  two-phase connector template. Use architecture A as a sequential, start-frame-only
  workflow, or fall back to an image-led QLander page.
- Everything after generation is deterministic and local; re-run `ingest.sh` any time.
