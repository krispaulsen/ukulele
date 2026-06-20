# Ukulele Songbook - Task List

This document tracks features, bugs, and improvements for the Ukulele Songbook web app.

**Last updated:** 2026-06-20

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

## Features

- [ ] Display "My Songs" (songs I own) on Profile page
  - Add API helper or reuse `/api/songs` filtered client-side, or new endpoint `GET /api/songs/mine`
  - Show title, artist, last updated, link to view/edit
- [ ] Finish song privacy (`isPublic`)
  - Add checkbox "Make public" (default checked) in song editor form
  - Pass `isPublic` through `validateSongPayload` (or extend)
  - Support updating `isPublic` on PUT
  - Decide visibility rules:
    - Public lists always exclude private songs
    - Owners can still view their own private songs directly via slug?
  - Update seed and tests/docs
- [ ] Show fork provenance on song detail page (uncomment + enhance the `originalSlug` block)
- [ ] Implement real functionality in `SongEditor` component (currently stub)
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
- [ ] **Tab Player** that reads and plays ukulele tablature
  - Parse existing `[| ... |]` tablature blocks already supported in `song.lyrics` (see `Lyrics.jsx` and editor syntax help)
  - Identify the four strings by line labels (A|, E|, C|, G| or G|, C|, E|, A| etc.) or by conventional top-to-bottom order
  - Use Web Audio API for playback: map string + fret number to frequency using standard re-entrant ukulele tuning (G4 ≈ 392 Hz, C4 ≈ 262 Hz, E4 ≈ 330 Hz, A4 = 440 Hz)
  - Playback semantics:
    - Scan columns left-to-right across the tab
    - Digits = fret to pluck on that string at this step; simultaneous digits on a column = strummed chord
    - Treat spaces, `-`, `|`, letters as timing separators or rests
    - Play a short plucked envelope per note (simple oscillator + gain ADSR)
  - Player UI and controls (new `TabPlayer` component):
    - Play / Pause / Stop / Restart
    - Tempo control (step duration or BPM slider; reasonable defaults e.g. 120 BPM or 150-250ms per column)
    - Progress indicator that advances across the tab
    - Clickable timeline / position to seek (start playing from a chosen column)
    - Optional: loop the tab (or current song section), volume, metronome
  - Visual synchronization:
    - While playing, highlight or animate the active column(s) inside rendered tabs (extend `TabsBlock` or render a dedicated playable tab view)
    - Show current string/fret being sounded (optional note readout)
  - Integration points:
    - `SongPage`: auto-detect tabs in lyrics; surface player controls near the Lyrics heading or per `[|]` block
    - Live preview inside `SongEditorPage` (reuse Lyrics + new player)
    - Possibly a dedicated tab-only view or "Practice mode"
  - Extract reusable tab parsing (to a `src/lib/tabs.js` or similar) that both display and player can use
  - Graceful degradation and edge cases:
    - Songs without tabs: no player UI
    - Malformed tabs: skip or warn; still render the static block
    - Support common variations (leading spaces, different dash styles, chord names above tabs)
  - Other
    - Add at least one seed song that includes a real tab example (for manual testing)
    - Update README "Features" if shipped
    - Nice extras later: alternate tunings (low G, D tuning), MIDI export, recording, slow-down without pitch change
- [ ] **Transpose Chords** control on the Song page
  - Add interactive transpose controls on `SongPage` (near the "Chords" section or above Lyrics)
    - Buttons: transpose down (-1), transpose up (+1)
    - Display of current playing key (e.g. "Key: C (original: Am, capo 0)" or similar)
    - "Reset" button to return to original
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
- [ ] Consider adding unit tests (backend route handlers, utils) and a test script
- [ ] Standardize ID handling: always use string `_id` / `userId` in API responses

## Documentation & Dev

- [ ] Keep README.md API table and feature list in sync after changes
- [ ] Add a short "Contributing" or "Known Issues" section
- [ ] Document environment variables clearly (already in README)
- [ ] Add a `npm test` or lint command if desired

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