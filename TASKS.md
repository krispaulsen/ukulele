# Ukulele Songbook - Task List

This document tracks features, bugs, and improvements for the Ukulele Songbook web app.

**Last updated:** 2026-07-08

## High Priority

- [ ] **Add ability to delete a song (owner only)**
  - Backend
    - Add `DELETE /api/songs/:slug` route (protected by `requireAuth`)
    - Verify the requester is the song owner (same logic as PUT edit)
    - On success, also delete all `Favorite` documents referencing that slug (cleanup)
    - Return 204 No Content or `{ message: "Song deleted" }`
    - Handle song not found (404) and not owner (403)
  - Frontend
    - On `SongPage`, show a "Delete" action for owners (next to Edit)
    - Use existing `Modal` component for delete confirmation ("Delete this song? This cannot be undone.")
    - Call API delete, then navigate to home (or previous page) and optionally refresh song lists
    - Show loading/disabled state during deletion
    - Consider adding a small delete option in "My Songs" list later (see profile tasks)
  - Other
    - Update README.md API table and Features section
    - Consider: what happens to forks? (for now, leave as-is since they are independent copies with `originalSlug`)

## Bugs & Data Issues

- [x] Fix "Submitted By" column in `SongList`
  - Backend list responses populate `ownerUserId` as an object after `.populate('ownerUserId', 'screenName')`
  - `SongList.jsx` reads `song.screenName` (always undefined)
  - ✅ Fixed by adding `formatSong()` helper in `server/utils.js` and applying to GET `/`, GET `/:slug`, and POST `/list`. Now always returns top-level `screenName` + `ownerUserId` as plain string.
  - Also updated single song endpoint for consistency.
  - Minor polish to the date display in SongList.
- [x] Fix incorrect `userId` in profile update response (`server/routes/users.js`)
  - Currently returns `userId: user.userId` (undefined). Change to `user._id`
- [x] Fix casing typo in `server/utils.js`
  - `originalslug: song.originalslug` should be `originalSlug: song.originalSlug`
  - ✅ Fixed (plus stringified ownerUserId) while implementing the format helper.
- [x] Inconsistent song owner data across endpoints
  - All song responses (GET /, GET /:slug, POST /list, POST create, PUT, POST fork) now consistently return:
    - `ownerUserId` as plain string (via `formatSong`)
    - top-level `screenName`
    - `isOwner` boolean (computed using attached user when present)
  - `formatSong` (and `songDocToDetails`) updated to always produce these fields with correct types.
  - Query endpoints now pass `req.user?.userId` to `formatSong`; mutations populate owner before formatting for full screenName.
  - `SongPage.jsx` owner check updated to prefer `song.isOwner` (with fallback).
  - Create/fork/update now return same normalized shape as reads.
  - ✅ Fixed (no more fragile direct id equality for ownership decisions on song data)
- [ ] `SongPage` and detail views do not display key/capo, original fork source, or owner name (most is commented out)
- [ ] `ProfilePage` state initialization from stale `user` prop; date fields (created/lastLogin) never shown (see TODO)
- [ ] Minor: `FavoritesPage` sets `favoriteSongs` to `null` on error, causing odd render branch
- [ ] `UserContext.refreshFavorites` does a set after the async call that can race with `setUser`
- [ ] `PUT /song/:slug` if a song is changed from public to private, what should happen to favorites having that song?
  - Change `GET /favorites` to only fetch public songs?

## Features

- [x] Display "My Songs" (songs I own) — implemented on the My Songbook (/favorites) page as a server-paginated list using `?mine=true` (and generalized `?ownerUserId`) support on `GET /api/songs`. (Not placed on Profile page.)
- [x] Finish song privacy (`isPublic`)
  - Add checkbox "Make public" (default unchecked) in song editor form
  - Pass `isPublic` through `validateSongPayload` (or extend)
  - Support updating `isPublic` on PUT
  - Decide visibility rules:
    - Public lists always exclude private songs
    - Owners can still view their own private songs directly via slug?
  - Update seed and tests/docs
- [ ] Show fork provenance on song detail page (uncomment + enhance the `originalSlug` block)
- [x] Implement real functionality in `SongEditor` component (currently stub)
  - "Remove This Line", "Add Lyrics/Chords", "Add Tablature", "Add Comment", "Add Space"
  - These should mutate the `lyrics` string in the parent form state
- [ ] Surface key + capo properly in editor and on song view pages
  - Key input is currently commented out in `SongEditorPage`
- [ ] Add song timestamps (createdAt / updatedAt) visible to users
  - Song detail page footer
  - Profile (per TODO)
  - "My Songs" list
- [ ] Better fork UX
  - After forking, perhaps show "Forked from X" link
  - Allow editing the original title/artist during fork (already supported)
- [x] **Tab Editor** (visual tablature builder)
  - Standalone page `/tabs` (public; guests + members) + Header nav link
  - Shared `src/lib/tabs.js` (parse/serialize, single-char frets: `0-9`, `a`=10, `b`=11, …)
  - `TabEditor` grid UI: place frets, keypad, copy markup, import paste
  - Modal on `SongEditorPage` (“Open Tab Editor”) → insert `[| … |]` into lyrics
- [x] **Tab Player** that reads and plays ukulele tablature
  - Reuse `src/lib/tabs.js` parsing; Web Audio in `src/lib/tabAudio.js` (re-entrant G4/C4/E4/A4)
  - `PlayableTabs`: play/pause/stop/restart, BPM, loop, column highlight, click-to-seek
  - Lyrics: static `div.tabs` + Play button → expand one player at a time (close collapses)
  - Tab Editor: play markup preview (page + modal)
  - Follow-ups: metronome, play-all-tabs playlist, seed song with tab, grid playhead sync, alternate tunings
- [x] **Transpose Chords** control on the Song page
  - Add interactive transpose controls on `SongPage` (near the "Chords" section or above Lyrics)
    - Select box from +6 to -5 semitones.
    - Display of current playing key (e.g. "Key: C (original: Am, capo 0)" or similar)
    - Optional: direct key selector or semitone stepper input
  - Implement a reusable chord transposition utility:
    - `transposeChord(name, semitones)` — correctly handle roots (C, C#, Db, etc.) + suffixes (m, 7, m7, sus2, sus4, dim, aug, add9, 6, 9, maj7, etc.)
    - Support both sharp and flat representations (try to preserve style of original when possible)
    - Create `src/lib/chords.js` (or similar) with note/chord helpers
  - Apply transposition to all displayed chords:
    - The list of chord diagrams (transpose `song.chords` names and render diagrams for the new names)
    - All `[Chord]` tokens inside lyrics (update the `Lyrics` component to accept a `transpose` offset or pre-transposed content)
  - Keep original song data untouched (transpose is a pure client-side view transformation using React state)
  - When key/capo are surfaced (see related task), show both original key and transposed key
  - Graceful handling:
    - Unknown chords fall back to the original name (or show warning)
    - Chords that don't have exact shapes in `CHORD_SHAPES` still display the transposed name (diagram can show a placeholder or first available shape)
  - Consider interactions:
    - Transposing may make a capo suggestion useful (e.g. "Play as G with capo 2")
    - Should not affect the stored `chords` array on the song or the editor
  - Other
    - Update the "Chords" heading or add a small "Transposed" badge when offset != 0
    - Later: remember last transpose per song in localStorage
    - Later: allow sharing a transposed link (?key=C or ?transpose=2)
- [ ] **Sharps / Flats toggle** for displayed chords and keys
  - Add a toggle control on `SongPage` (grouped with transpose controls) to switch the accidental style for all accidentals.
  - Toggle options: prefer sharps (♯) vs prefer flats (♭)
  - Affects all chord display on the page:
    - Inline chords inside the lyrics (e.g. `[C#7]` ↔ `[Db7]`)
    - Chord diagram titles
    - Displayed key name (when key/capo UI is implemented)
  - Should work seamlessly with the transpose feature — user can transpose and then flip between sharp/flat spellings of the same chords.
  - Add pure utility functions (e.g. in `src/lib/chords.js`):
    - `toSharps(chord)`
    - `toFlats(chord)`
    - `convertChordAccidentals(chord, 'sharp' | 'flat')`
    - Handle roots only: C# ↔ Db, D# ↔ Eb, F# ↔ Gb, G# ↔ Ab, A# ↔ Bb (and their minor/7/etc variants)
  - Implementation notes:
    - Operate on the currently rendered/transposed chord names
    - Do not mutate the original `song.chords` or `song.lyrics`
    - The `Lyrics` component (or a wrapper) should support an "accidental preference" prop or post-process chord names
  - Smart defaults (optional but recommended):
    - When the (transposed) key is F, Bb, Eb, Ab, Db, Gb → default to flats
    - When the key is G, D, A, E, B, F#, C# → default to sharps
    - Provide a manual override via the toggle
  - Graceful handling for chords that don't have accidentals (no change) and rare enharmonics.
  - UI:
    - Simple toggle or two-button group next to transpose +/- controls
    - Maybe show a small indicator like "♯" or "♭" when non-default
  - Other:
    - Later: make the preference part of user profile settings (chord display preferences)
    - Later: remember last choice per song or globally via localStorage
    - Should also apply if/when we support printing or exporting chords
    - Rewrite sharps and flats using "♯" and "♭" rather than "#" and "b"
- [ ] **Tablature Editor**
  - Primary goal: make it much easier and less error-prone to author the `[| ... |]` tablature blocks than hand-editing raw text in the Lyrics textarea.
  - Interaction model (visual grid primary):
    - Dedicated visual editor UI (4-string grid or horizontal lanes).
    - Users add/remove time columns (steps).
    - For each column, set fret numbers (0-15 or so) per string via clicking a visual neck/fret positions, +/- buttons, or direct number entry.
    - Clearly labeled strings matching app convention: A / E / C / G order (top-to-bottom inside the block, as documented in syntax help and used by `Lyrics.jsx` parser).
    - Support for rests (empty cells), barlines (`|` separators), and basic timing (fixed column steps for v1; player drives the timing).
    - Real-time preview of the generated raw tab text block.
  - Playback integration:
    - "Play / Pause / Stop" controls inside the editor (reuse/extend the Web Audio player logic planned for the Tab Player feature).
    - While playing, highlight the active column in the grid (visual sync).
    - Tempo control (column duration or BPM) consistent with Tab Player.
    - Optional: loop, single-string mute for practice.
  - Output & workflow:
    - Prominent "Copy Tablature Block" button that produces the exact ready-to-paste text:
      ```
      [|
      A|-------------|
      E|-------------|
      C|-------------|
      G|-------------|
      |]
      ```
    - Users copy and paste the block into the main Lyrics field (or SongEditor's text area) at the desired location.
    - Copy/paste is the v1 integration model (no live two-way mutation of the parent form required yet).
  - Entry points:
    - Modal launcher from `SongEditorPage` (e.g. a button next to "Lyrics Markup Syntax" or above the lyrics textarea: "Open Tablature Editor").
    - The modal hosts the full grid + preview + player + copy controls (convenient while writing a song).
    - Dedicated page (e.g. route `/tab-editor`) for larger workspace or composing tabs independently of a song. The page can be public or auth-gated (recommend auth-gated to stay consistent with song creation flows).
  - Shared implementation with Tab Player:
    - Plan together: extract reusable tab logic early into `src/lib/tabs.js` (or `src/lib/tab.js`).
    - Exports should include: `parseTab(text)` → normalized column data, `tabToText(columns)` or serializer, `playTab(...)` using Web Audio (osc + ADSR per string), column timing model.
    - The editor grid operates on the same column/step data model used for playback and (later) static rendering.
    - `Lyrics.jsx` TabsBlock can later be upgraded to use shared renderer if desired.
  - Additional editor features / polish:
    - Load/import: textarea to paste an existing `[|...|]` block and populate the grid (helps editing existing tabs).
    - Toolbar: Add Column, Insert Rest Column, Delete Column, Clear All, Add Barline hint.
    - Validation / hints: flag non-numeric frets, very high frets, mismatched line lengths on import.
    - Number of columns guidance and scrollable grid for long tabs.
    - "Insert as comment" or other metadata rows? (stretch)
  - Other:
    - Add at least one seed song containing a non-trivial tab (shared goal with the Tab Player task) for testing both display and the new editor.
    - Ensure the editor can round-trip common examples without losing formatting intent.
    - When Tab Player ships, ensure the editor's play experience matches the one on SongPage.
    - Later: alternate tunings (low G etc.), variable column durations, chord name labels above columns, export MIDI or slow-down.
    - Update syntax help / docs if the visual editor introduces new concepts.
    - Update README Features when complete.
- [x] **Chromatic Tuner**
  - Standalone client-side practice tool for standard re-entrant GCEA (G4/C4/E4/A4, A4 = 440 Hz fixed)
  - Public route `/tuner` + Header "Tuner" for guests and members
  - Mic pitch detection (`pitchy` + Web Audio): note + cents meter (green within ±8¢), auto or lock to G/C/E/A
  - Sustained reference tones (shared `tabAudio` sustain + open-string frequencies) with volume + Stop
  - Pure pitch math in `src/lib/pitchMath.js` with unit tests; graceful mic denied / quiet / uncertain states
  - Future (not in v1): A4 calibration UI, low-G/baritone, Wake Lock, strobe/spectrum, SongPage deep link

## UI / UX / Components

- [ ] Add delete confirmation consistently using `Modal`
- [ ] Improve loading / error / empty states across pages (Search, Favorites, Song)
- [ ] Make `SongList` support optional actions per row (e.g., delete button for owners in "My Songs")
- [ ] Add "Add to favorites" / heart on the song detail page more prominently (already there but only icon)
- [ ] Consider a "danger" style for delete buttons
- [ ] The `ToggleButton` component has a TODO for active state styling
- [ ] Lyrics column count input in SongPage has no debouncing / is uncontrolled-ish

## Backend / API / Auth

- [ ] Add `DELETE /api/songs/:slug` (see High Priority)
- [ ] Consider rate limiting or basic validation improvements
- [ ] Update `songDocToDetails` and responses to be consistent (include `isOwner`, `ownerScreenName` etc.)
- [ ] Document the internal `POST /api/songs/list` endpoint or make a proper GET `/api/songs?slugs=...`
- [ ] Add lastLogin tracking (see TODO in auth route)
- [ ] (Future) Add password reset flow
- [ ] Clean up deprecated Mongoose option note in users route

## Code Quality & Refactoring

- [ ] Extract common song response shaping (use `songDocToDetails` or a new mapper more widely)
- [ ] Add basic input validation / sanitization beyond current (e.g. max lengths)
- [ ] Improve frontend error boundaries or global toast for API errors
- [ ] Add client-side route guards that redirect unauthenticated users trying to hit /song/new etc.
- [ ] Remove or finish dead/commented code (key fields, originalSlug block, old selects)
- [x] Consider adding unit tests (backend route handlers, utils) and a test script — Basic tests added via Vitest (utils, middleware, api client + component starter) + `npm test` / `npm run test:watch`
- [ ] Standardize ID handling: always use string `_id` / `userId` in API responses

## Documentation & Dev

- [ ] Keep README.md API table and feature list in sync after changes
- [ ] Add a short "Contributing" or "Known Issues" section
- [ ] Document environment variables clearly (already in README)
- [x] Add a `npm test` or lint command if desired — `npm test` / `test:watch` added (basic tests implemented)

## Nice-to-Have / Future

- [ ] Full-text search (title/artist/lyrics) instead of simple client filter
- [ ] Pagination or infinite scroll on song list (currently loads everything)
- [ ] Song version history or basic audit log
- [ ] Support for multiple chord diagrams / user-submitted chords
- [ ] Mobile-friendly improvements / responsive table
- [ ] Export song as text / PDF / chordpro
- [ ] Public user profiles (view other people's songs)

---

**How to use this list**

- Check items off as you complete them.
- When implementing delete song, start with backend route + auth, then wire frontend delete button + modal.
- Many bugs are small but high visibility (Submitted By always blank, profile update oddities).

To propose changes, create focused PRs per area (e.g. "feat: song delete", "fix: submitted by display").