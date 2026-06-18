# Ukulele Songbook - Task List

This document tracks features, bugs, and improvements for the Ukulele Songbook web app.

**Last updated:** 2026-06-17

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

- [ ] Fix "Submitted By" column in `SongList`
  - Backend list responses populate `ownerUserId` as an object after `.populate('ownerUserId', 'screenName')`
  - `SongList.jsx` reads `song.screenName` (always undefined)
  - Fix: either flatten `screenName` + `ownerUserId` in responses (recommended: add helper), or update `SongList` to read `song.ownerUserId?.screenName`
  - Also ensure `/api/songs/list` (used by Favorites) behaves the same
- [ ] Fix incorrect `userId` in profile update response (`server/routes/users.js`)
  - Currently returns `userId: user.userId` (undefined). Change to `user._id`
- [ ] Fix casing typo in `server/utils.js`
  - `originalslug: song.originalslug` should be `originalSlug: song.originalSlug`
  - This breaks fork metadata in `songDocToDetails`
- [ ] Inconsistent song owner data across endpoints
  - `GET /api/songs` and `/list` → populates owner
  - `GET /api/songs/:slug` → raw `ownerUserId` (no populate)
  - `SongPage.jsx` owner check: `user.userId === song.ownerUserId` (fragile type/coercion)
  - Recommendation: make single-song endpoint populate ownerUserId (or return `owner: { screenName, id }` + `isOwner`)
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
