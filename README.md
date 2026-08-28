# Disaster Prep Hub

Client-side web app for exploring global hazards, historical events, action plans, and interactive survival simulators on a 3D globe.

## Run

No build step. Serve the directory with any static HTTP server:

```bash
# Python
python -m http.server 8000

# Node (if installed)
npx http-server -p 8000

# Then open http://localhost:8000
```

Opening `index.html` via `file://` will fail — ES module/CDN/CORS issues. Always use a server.

## Files

| File | Purpose |
|---|---|
| `index.html` | App entry. Login gate + UI shell. |
| `login.html` | Standalone login page. |
| `styles.css` | All styles. |
| `app.js` | Orchestration + state. Exposes `window.DPH_APP`. |
| `data.js` | Hazard / event / sim data. Exposes `window.DPH_DATA`. |
| `globe.js` | Three.js r128 globe rendering. Exposes `window.DPH_GLOBE`. |
| `animations.js` | Animation utilities. Exposes `window.DPH_ANIM`. |
| `simWindow.js` | Survival simulator window. Exposes `window.DPH_SIM`. |

Load order in `index.html` is fixed: three → topojson-client → data → globe → animations → simWindow → app.

## Dependencies (CDN)

- [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) — pinned, 2018-era, security/feature debt.
- [topojson-client 3.1.0](https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js)
- Google Fonts: Inter.

## Known Issues

- Three.js r128 is old. Upgrade path not yet planned.
- No tests, no lint, no build pipeline (added in `package.json` only as dev convenience).
- Not under version control — `git init` recommended.
- `globe.js` last edited 2025-08-23 21:00, untested.
- Console error/warn guards present at `globe.js:52`, `globe.js:116`, `simWindow.js:21` — these are load-order checks, not bugs.

## Development

```bash
npm install        # installs eslint only
npm run lint       # lint all JS
npm run serve      # static server on :8000
```

## License

Not specified.
