# scroll-world queue — {{CLIENT}}

Render each job below in Magnific's **slow/relax queue**, then download the result into
`results/` using the exact **save-as** filename. Check the box when done. See
`references/manual-queue.md` for the full workflow.

Keep every checkbox and filename synchronized with `queue.json`, initialized from
`references/queue-template.json`.

- **Image model:** {{IMAGE_MODEL}}   ·   **Video model:** {{VIDEO_MODEL}}
- **Style preamble (identical in every still):** {{STYLE_PREAMBLE}}
- **Palette:** {{PALETTE}}   ·   **Background:** {{BG_HEX}}
- **Mobile variants:** {{YES/NO}} (if yes, also render each dive/connector native **9:16** and
  save with the same name + `_m` before the extension)

---

## Phase 1 — stills + dives  (no dependencies; render in any order)

<!-- one still + one dive per scene. Repeat the pair for each scene 1..N. -->

- [ ] **S1 · still · {{slug1}}**  → save as `still_1_{{slug1}}.png`
  - `{{IMAGE_MODEL}}` · 16:9 · 2k · quality high
  - prompt:
    ```
    {{STYLE_PREAMBLE}}
    Subject: {{scene 1 subject description}}
    ```
- [ ] **V1 · dive · {{slug1}}**  → save as `dive_1_{{slug1}}.mp4`
  - `{{VIDEO_MODEL}}` · 16:9 · 1080p · 8s · **start frame:** `still_1_{{slug1}}.png` · (no end frame)
  - prompt:
    ```
    {{dive prompt for scene 1 — from references/prompts.md}}
    ```

<!-- ...S2/V2 ... SN/VN ... -->

> After Phase 1 renders, the agent runs `ingest.sh`, which fills in Phase 2 below with the
> real connector keyframes. Do not render Phase 2 until it is filled in.

---

## Phase 2 — connectors  (fill after Phase 1; needs `work/phase2_keyframes/`)

<!-- one connector per adjacent pair, i = 1..N-1. Keyframes come from CONNECTOR_MAP.txt. -->

- [ ] **C1 · connector · {{slug1}} → {{slug2}}**  → save as `conn_1_{{slug1}}-{{slug2}}.mp4`
  - `{{VIDEO_MODEL}}` · 16:9 · 1080p · 5s · **start frame:** `conn_1_start.png` · **end frame:** `conn_1_end.png`
  - prompt:
    ```
    {{connector prompt — from references/prompts.md}}
    ```

<!-- ...C2 ... C(N-1) ... last connector into the hero-product finale uses the dissolve variant -->

---

## Done?

When all boxes are checked and files are in `results/`, tell the agent. It will run
`ingest.sh` + `seam-qa.sh` + `walkthrough.py` and wire the site locally without generation API calls.
