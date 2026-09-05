# Daniel OS

An independently implemented browser desktop inspired by https://termcavetw.vercel.app. No template source or third-party application assets are copied. It is a web workspace, not a bootable operating system.

## Run locally

From the repository root, run `python3 -m http.server 4173 --directory web` and open http://localhost:4173.

## GitHub Pages

The deployable static site is in `web/`. All asset URLs are relative, so repository Pages paths work. No build, server, API keys, or runtime dependencies are required. Google Fonts is optional; system fonts work if unavailable.

In repository Settings → Pages, select GitHub Actions as the source. Commit the web directory and `.github/workflows/pages.yml`, then push to `main` or manually run the deployment workflow. Only `web/` is uploaded; research and other workspace files are excluded. If the default branch differs, update the workflow branch trigger.

## Features and limits

- Dock, app search (Command/Ctrl K), draggable and resizable windows, minimize, close, maximize, arrange.
- Notes save in localStorage for this browser and origin; export a text backup. They do not sync across devices. Changing origin or clearing browser data loses access to local notes.
- Files opens three built-in documents; it is not access to the host filesystem.
- Terminal supports help, ls, cat note, open, date, whoami, echo, and clear. Input is never executed as JavaScript or a system command.
- Focus uses an absolute deadline to avoid timer drift while the tab is open. Closing an app window preserves the session; reloading the page resets it. Keep the tab open for completion reminders.
- Wallpaper preference persists locally. On small screens windows fit the viewport; apps remain accessible through the dock.

Personalize the name in `web/index.html` and `web/app.js`; apps and their metadata are defined at the top of `web/app.js`.

## Validation

JavaScript syntax, local asset references, whitespace checks, and the local HTTP response passed. Automated DOM interaction checks passed for all seven apps, note persistence, window controls, keyboard search, terminal output escaping, focus controls, wallpaper, and arrangement. These checks do not measure visual frame rate or replace browser interaction testing. The optional `open_workspace_app` WebMCP tool is feature-detected; its runtime contract has not been verified because the browser tool capability was unavailable in this session.

## Interaction refinements

Window dragging uses one composited transform per animation frame. Opening, restoring, minimizing, maximizing, and arranging windows have short cancelable transitions. App search supports arrow keys and Enter. Window controls have larger hit areas, focus follows the active app, and reduced-motion preferences disable transitions.
