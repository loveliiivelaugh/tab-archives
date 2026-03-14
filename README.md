# Tab Archiver

Tab Archiver is a Chrome extension that lets you quickly sweep every tab in a window (or every window) into an "archive" so you can reclaim memory without losing context. Each archive snapshot becomes a browsable history page where you can restore entire sessions, reopen individual tabs, search, clear, or export your saved browsing sessions.

## Features

- Archive tabs from the current window or from every open browser window in one click.
- Automatically skips pinned tabs and the extension's own pages so you don't lose critical tabs.
- Opens a polished history page that lists every archived session along with timestamps and tab counts.
- Restore an entire session into a new window or reopen an individual tab from the history page.
- Search across archived tabs, export everything to JSON, or clear all history when you no longer need it.
- Stores data in `chrome.storage.local`, so everything stays on your machine.

## Getting Started

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and choose the folder that contains this project.
5. Pin the extension if you want quick access to the popup button.

The extension targets Manifest V3, so you only need Chrome 88+ (or Chromium-based browsers with MV3 support).

## Usage

1. Click the Tab Archiver icon to open the popup.
2. Choose **Archive This Window** or **Archive All Windows**.
3. The selected tabs close, a new history tab opens, and the archived session appears at the top of the list.
4. From the history page you can:
   - Search titles or URLs with the search box.
   - Click a tab row to reopen it (opens in the background by default).
   - Use **Restore All** to spawn a new window with every tab from that session.
   - Clear a single session or wipe the full history.
   - Export everything as a JSON backup for safekeeping.

## Project Structure

| File | Purpose |
| --- | --- |
| `manifest.json` | Declares the MV3 extension metadata, permissions, icons, popup, and background service worker. |
| `background.js` | Handles messages from the popup, collects tabs to archive, saves sessions to storage, closes the tabs, and loads the history view. |
| `popup.html` / `popup.js` | Tiny UI with buttons to archive the current window or all windows and a link to the history page. |
| `history.html` / `history.css` / `history.js` | Full history experience: renders past sessions, search, restore, delete, clear, and export interactions. |
| `icons/` | Icon set used for the toolbar, store listing, and history fallbacks. |

## Development Notes

- Data is written to `chrome.storage.local` under the `archives` key. Each session contains an ID, timestamp, friendly name, original tab count, and simplified tab metadata (URL, title, favicon).
- Archived tabs are removed immediately after storage, then the history page opens in a new tab so the user can confirm what was saved.
- Pinned tabs are ignored to avoid disrupting essential tabs such as mail or music players.
- History actions (restore, delete, export) run entirely inside the history page and call Chrome APIs directly; no external services are contacted.

## Future Ideas

- Allow renaming sessions for easier recall.
- Provide settings for keeping pinned tabs, auto-archiving idle windows, or adjusting history retention.
- Sync archives through `chrome.storage.sync` (currently local only) or expose an import workflow to complement the JSON export.

## License

Specify your preferred license here (e.g., MIT). If you plan to distribute the extension publicly, make sure to include the actual license text in this repository.
