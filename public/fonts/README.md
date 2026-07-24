# Bundled fonts

Four variable fonts (latin subset, woff2) licensed under the SIL Open Font License 1.1 so a design pass can change typography without sourcing files. `OFL.txt` carries the license text; per-family copyrights are listed below. Unused files add nothing to built pages; only families referenced by an `@font-face` rule are ever loaded.

| File | Family | Axis | Personality |
|---|---|---|---|
| `fraunces-variable.woff2` | Fraunces | wght 300 to 900 | Expressive display serif, editorial or boutique |
| `newsreader-variable.woff2` | Newsreader | wght 300 to 800 | Readable text serif, editorial body or institutional |
| `space-grotesk-variable.woff2` | Space Grotesk | wght 300 to 700 | Geometric grotesque, tech or product |
| `work-sans-variable.woff2` | Work Sans | wght 300 to 800 | Neutral humanist sans, versatile body |

Copyrights: Fraunces (c) 2018 The Fraunces Project Authors. Newsreader (c) 2020 Production Type. Space Grotesk (c) 2020 Florian Karsten. Work Sans (c) 2019 The Work Sans Project Authors. All under OFL 1.1.

## Usage (design pass, template tier)

Add the approved faces at the top of the `<style>` block in `src/layouts/BaseLayout.astro`, then reference the family in `data/design-system.json`:

```css
@font-face {
  font-family: "Fraunces";
  src: url("/fonts/fraunces-variable.woff2") format("woff2");
  font-weight: 300 900;
  font-display: swap;
}
```

```json
"displayFamily": "Fraunces, Georgia, serif"
```

Keep at most two families per site and never add a font CDN link or `@import`.
