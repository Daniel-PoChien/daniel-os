# Daniel OS

An independently implemented browser desktop inspired by https://termcavetw.vercel.app. No template source or third-party application assets are copied. It is a web workspace, not a bootable operating system.

## Run locally

From the repository root, run `python3 -m http.server 4173 --directory web` and open http://localhost:4173.

## GitHub Pages

The deployable static site is in `web/`. All asset URLs are relative, so repository Pages paths work. No build, server, API keys, or package installation are required. The luxury simulator vendors Three.js locally. Google Fonts is optional; system fonts work if unavailable.

In repository Settings → Pages, select GitHub Actions as the source. Commit the web directory and `.github/workflows/pages.yml`, then push to `main` or manually run the deployment workflow. Only `web/` is uploaded; research and other workspace files are excluded. If the default branch differs, update the workflow branch trigger.

## Features and limits

- Dock, app search (Command/Ctrl K), draggable and resizable windows, minimize, close, maximize, arrange.
- Notes save in localStorage for this browser and origin; export a text backup. They do not sync across devices. Changing origin or clearing browser data loses access to local notes.
- Files browses a persistent virtual home at `/home/daniel`, with Desktop, Documents, and Downloads folders, folder creation, and new notes. It does not access the host filesystem.
- Terminal supports `pwd`, `ls`, `cd`, `tree`, `mkdir`, `touch`, `cat`, `mv`, `cp`, `rm`, `echo` with `>` / `>>`, `open`, `edit`, `download`, `apps`, `history`, `date`, `whoami`, `clear`, and `help`. Tab completes paths, arrows recall commands, and Ctrl+L clears output. Input is never executed as JavaScript or a host system command.
- Focus uses an absolute deadline to avoid timer drift while the tab is open. Closing an app window preserves the session; reloading the page resets it. Keep the tab open for completion reminders.
- Wallpaper preference persists locally. On small screens windows fit the viewport; apps remain accessible through the dock.

Personalize the name in `web/index.html` and `web/app.js`; apps and their metadata are defined at the top of `web/app.js`.

## Validation

JavaScript syntax, local asset references, whitespace checks, and the local HTTP response passed. Automated DOM interaction checks passed for all seven apps, note persistence, window controls, keyboard search, terminal output escaping, focus controls, wallpaper, and arrangement. These checks do not measure visual frame rate or replace browser interaction testing. The optional `open_workspace_app` WebMCP tool is feature-detected; its runtime contract has not been verified because the browser tool capability was unavailable in this session.

## Interaction refinements

Window dragging uses one composited transform per animation frame. Opening, restoring, minimizing, maximizing, and arranging windows have short cancelable transitions. App search supports arrow keys and Enter. Window controls have larger hit areas, focus follows the active app, and reduced-motion preferences disable transitions.


## Luxury Studio

Open **Luxury Studio** from the dock, app search, or `open luxury` in Terminal. The direct desktop link is `?app=luxury`; `luxury/` opens the standalone simulator.

Atelier is an interactive conceptual waterfront villa with 1–3 levels, 14–24 m width, three facade finishes, daylight/golden-hour/blue-hour lighting, pool toggle, roof removal for viewing the upper interior, orbit/pan/zoom, and preset cameras. Displayed gross area sums the stepped floor plates; dimensions are illustrative, not construction or valuation data. Save design stores a separate `daniel-os-luxury` record in this browser. Reset previews the defaults; Save commits them. Existing notes and wallpaper keys are untouched.

Three.js 0.180.0 and OrbitControls are vendored in `web/luxury/vendor/` under the included MIT license. A WebGL2-capable browser is required; rendering failure displays recovery guidance. The scene is browser-native procedural geometry. Blender is installed on the development computer, but Blender MCP was not available to this task and was not used.

Validation: JavaScript syntax and whitespace checks; existing seven-app DOM regression checks; real Chrome WebGL render inspection; eight-app dock and iframe launch; floor/width area changes; material, pool, interior, light, and camera controls; persistence across iframe reload; reset; mobile overflow checks at 390 px. The simulator retains static relative paths and the existing Pages workflow continues to upload only `web/`.


## Blender villa integration

Luxury Studio now opens the authored Horizon villa model (`luxury/assets/horizon-villa.glb`), with living/bedroom/plan camera views and a roof reveal. The original procedural configurator remains at `luxury/concept.html` with its existing local save key.

Play, pause, restart, or scrub the 30-second interior promenade or 20-second coastal sweep. The web camera paths are sampled from the actual evaluated Blender cameras and transformed from Blender Z-up into glTF Y-up. Both paths also have rendered film previews available inside the app. The native Blender file keeps full procedural materials; the GLB uses simplified PBR materials to avoid heavyweight baking and external dependencies. The original authored model and videos are the only project assets published.

Validation: Chrome model loading and WebGL rendering; desktop launch; camera play/pause/scrub, route switching, room views and roof reveal; video readiness; 390 px mobile overflow; existing desktop app regressions. All 720 interior camera positions clear the bounds of 45 architectural and tall furniture objects, using a 4 cm margin. Videos are decoded end-to-end before publishing. Vendored GLTFLoader and BufferGeometryUtils match Three.js 0.180.0 and its included MIT license.

## Shared filesystem and Notes

Files, Notes, and Terminal share the `daniel-os-filesystem-v1` localStorage record. Existing `daniel-os-note` text migrates to `~/Documents/My note.txt` when the workspace is first saved; the original key remains untouched as a backup. The active note and filenames survive reloads. Notes supports new files, rename, and export using the actual filename.

```text
cd Documents
mkdir "My projects"
cd "My projects"
echo "First idea" > plan.txt
edit plan.txt
cp plan.txt ~/Downloads/
cd ..
ls
```

Paths support absolute paths, `~`, `.`, `..`, and `cd -`. Names are case-sensitive; quote filenames containing spaces. `mv` and `cp` reject collisions rather than overwrite existing files. Folder operations preserve child files and update the active note path. `download` triggers an actual browser download; virtual Downloads is a regular workspace folder. Shell pipes, arbitrary programs, and recursive deletion are not implemented.

Storage errors leave the previous saved workspace unchanged; unsaved note text stays in the editor and can be exported. Conflicting edits from another tab are rejected with reload guidance. Corrupt stored data is never silently replaced. This is device-local storage, not cloud sync; export important files before clearing browser data.

Filesystem regression tests: `node --test tests/filesystem.test.mjs`. Tests cover migration, path parsing, quoted redirection, moves/copies, collisions, failed storage writes, cross-tab conflicts, and corrupt storage. DOM integration checks additionally covered terminal navigation, text redirection, safe text rendering, Notes rename, synchronized Files, Tab completion, reload persistence, new notes, and Luxury Studio launch.

## Remove files and pin apps

`rm plan.txt` permanently removes a virtual file. Quote paths with spaces; multiple files are supported (`rm a.txt b.txt`). `rm -- -draft.txt` handles a filename beginning with a dash. Folders and recursive flags are rejected. All paths are checked before deletion, so a missing or invalid target leaves the whole group unchanged. Removing the active note clears the editor to an empty state with a New note button. There is no Trash or undo for `rm`; export any file you want to retain.

Drag an app from the dock to an empty desktop area to pin it. Drag the pinned icon to reposition it, click to open, or use its × button to unpin without removing the app. Layout is saved in `daniel-os-desktop-pins-v1` using relative positions so pins adapt to the viewport. Pointer events support mouse, pen, and touch. Keyboard alternative: focus a dock app, press Shift+Enter to pin; Tab to a pin's unpin control to remove it. Escape cancels a drag.

Validation: filesystem tests cover atomic removal, folder rejection, active-note removal, reload, and storage failure. DOM integration checks cover shell removal, new-note recovery, pin creation by drag, moving existing pins, opening pinned apps, persistence, unpinning, keyboard pinning, and rejecting a drop over an app/window. Existing filesystem and Luxury Studio launch checks also pass.

## App icons and layout

All eight apps use a consistent SVG icon family in the dock, launcher, and desktop. The focused app shows an alternate icon detail, a highlighted tile, and an active indicator; inactive open apps retain a small running indicator. Minimizing, restoring, closing, and switching apps updates both dock and desktop icons.

Desktop pins occupy uniform 100 × 112 px grid cells, with 48 px icon tiles and aligned labels. Drops snap to the closest free slot; existing saved positions migrate into the grid without losing pins. Resizing reflows icons without collisions. Small viewports can scroll the pin area.

Arrange windows toggles a responsive tiled layout with gaps and scrolling when needed. Float windows restores saved floating geometry. Maximizing or dragging a title bar exits tiling. Tests cover overlapping saved coordinates at 280–1440 px widths, icon variants, active/running state transitions, pin synchronization, and tile/float behavior. Run all unit tests with `node --test tests/*.test.mjs`.
