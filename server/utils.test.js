import { describe, it, expect } from 'vitest';
import {
  slugify,
  extractYouTubeId,
  validateSongPayload,
  formatSong,
  songDocToDetails,
  getSongListFilter
} from './utils.js';

describe('slugify', () => {
  it('converts title to kebab case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('trims and lowercases', () => {
    expect(slugify('  Trim  Me! ')).toBe('trim-me');
  });

  it('removes special characters and collapses spaces', () => {
    expect(slugify('Riptide (Vance Joy)')).toBe('riptide-vance-joy');
    expect(slugify('Song Title!!! With??? Punctuation')).toBe('song-title-with-punctuation');
  });

  it('handles underscores and multiple separators', () => {
    expect(slugify('Already-Slug_123')).toBe('already-slug123');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('---dashy---')).toBe('dashy');
    expect(slugify('  - leading and trailing -  ')).toBe('leading-and-trailing');
  });

  it('returns empty string for null/undefined/empty/whitespace', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('preserves numbers and basic allowed characters', () => {
    expect(slugify('Song 2024 v2')).toBe('song-2024-v2');
  });
});

describe('extractYouTubeId', () => {
  it('returns raw 11-char ID as-is', () => {
    expect(extractYouTubeId('dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
    expect(extractYouTubeId('abc123DEF_9')).toBe('abc123DEF_9');
  });

  it('extracts from youtu.be short links', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
    expect(extractYouTubeId('https://youtu.be/dQw4w9wgxcq?t=30')).toBe('dQw4w9wgxcq');
  });

  it('extracts from youtube.com/watch URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
    expect(extractYouTubeId('https://youtube.com/watch?v=dQw4w9wgxcq&feature=share')).toBe('dQw4w9wgxcq');
  });

  it('extracts from embed, v, and shorts paths', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
    expect(extractYouTubeId('https://youtube.com/v/dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
    expect(extractYouTubeId('https://youtube.com/shorts/dQw4w9wgxcq')).toBe('dQw4w9wgxcq');
  });

  it('returns empty string for null, empty, or invalid input', () => {
    expect(extractYouTubeId(null)).toBe('');
    expect(extractYouTubeId('')).toBe('');
    expect(extractYouTubeId('   ')).toBe('');
    expect(extractYouTubeId('not-a-youtube-id')).toBe('');
    expect(extractYouTubeId('https://example.com')).toBe('');
    expect(extractYouTubeId('https://youtu.be/too-short')).toBe('');
  });

  it('handles uppercase in raw ID match', () => {
    expect(extractYouTubeId('DqW4W9WGxcQ')).toBe('DqW4W9WGxcQ');
  });
});

describe('validateSongPayload', () => {
  it('accepts minimal valid payload and normalizes fields', () => {
    const result = validateSongPayload({ title: 'My Song', artist: 'Artist' });
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      title: 'My Song',
      artist: 'Artist',
      key: '',
      notes: '',
      chords: [],
      lyrics: '',
      youtube: ''
    });
  });

  it('trims strings and filters empty chords', () => {
    const result = validateSongPayload({
      title: '  Trimmed  ',
      artist: '  Also  ',
      key: '  Am  ',
      notes: '  some notes  ',
      chords: [' Am ', '', '  G7 '],
      lyrics: '  verse  ',
      youtube: '  https://youtu.be/abc123def45  '
    });
    expect(result.ok).toBe(true);
    expect(result.value.title).toBe('Trimmed');
    expect(result.value.artist).toBe('Also');
    expect(result.value.key).toBe('Am');
    expect(result.value.chords).toEqual(['Am', 'G7']);
    expect(result.value.youtube).toBe('abc123def45');
  });

  it('returns error when title or artist missing', () => {
    expect(validateSongPayload({ artist: 'Only' })).toEqual({
      ok: false,
      error: 'Title and artist are required'
    });
    expect(validateSongPayload({ title: 'Only' })).toEqual({
      ok: false,
      error: 'Title and artist are required'
    });
    expect(validateSongPayload({})).toEqual({
      ok: false,
      error: 'Title and artist are required'
    });
  });

  it('handles non-array chords gracefully', () => {
    const result = validateSongPayload({ title: 'T', artist: 'A', chords: 'not an array' });
    expect(result.ok).toBe(true);
    expect(result.value.chords).toEqual([]);
  });

  it('extracts YouTube ID via helper', () => {
    const result = validateSongPayload({
      title: 'T',
      artist: 'A',
      youtube: 'https://www.youtube.com/watch?v=xyz98765432'
    });
    expect(result.value.youtube).toBe('xyz98765432');
  });
});

describe('formatSong', () => {
  it('returns null/undefined unchanged when falsy', () => {
    expect(formatSong(null)).toBeNull();
    expect(formatSong(undefined)).toBeUndefined();
  });

  it('normalizes lean document with string ownerUserId', () => {
    const doc = {
      _id: 's1',
      slug: 'test-song',
      title: 'Test',
      artist: 'Tester',
      ownerUserId: 'user123',
      screenName: 'TestUser',
      isPublic: true,
      favorites: 5
    };
    const formatted = formatSong(doc, 'user123');
    expect(formatted.ownerUserId).toBe('user123');
    expect(formatted.screenName).toBe('TestUser');
    expect(formatted.isOwner).toBe(true);
  });

  it('extracts from populated owner object', () => {
    const doc = {
      slug: 'populated',
      title: 'Pop',
      artist: 'Popper',
      ownerUserId: { _id: 'u42', screenName: 'PopArtist' },
      favorites: 0
    };
    const formatted = formatSong(doc, 'u42');
    expect(formatted.ownerUserId).toBe('u42');
    expect(formatted.screenName).toBe('PopArtist');
    expect(formatted.isOwner).toBe(true);
  });

  it('sets isOwner false when currentUserId does not match', () => {
    const doc = { slug: 's', title: 't', artist: 'a', ownerUserId: 'owner1' };
    const formatted = formatSong(doc, 'other-user');
    expect(formatted.isOwner).toBe(false);
    expect(formatted.screenName).toBe('');
  });

  it('isOwner is false when no currentUserId provided', () => {
    const doc = { slug: 's', title: 't', artist: 'a', ownerUserId: 'owner1' };
    expect(formatSong(doc).isOwner).toBe(false);
    expect(formatSong(doc, null).isOwner).toBe(false);
  });

  it('stringifies owner even when it is an ObjectId-like', () => {
    const doc = { slug: 's', title: 't', artist: 'a', ownerUserId: { _id: 'abc' } };
    const formatted = formatSong(doc, 'abc');
    expect(formatted.ownerUserId).toBe('abc');
    expect(formatted.isOwner).toBe(true);
  });
});

describe('songDocToDetails', () => {
  it('normalizes populated and unpopulated owners and computes isOwner', () => {
    const populated = {
      _id: 'd1',
      slug: 'detail-song',
      title: 'Detail',
      artist: 'D',
      ownerUserId: { _id: 'u1', screenName: 'DetailUser' },
      chords: ['C', 'G'],
      lyrics: 'hello',
      favorites: 3,
      isPublic: true
    };
    const details = songDocToDetails(populated, 'u1');
    expect(details.ownerUserId).toBe('u1');
    expect(details.screenName).toBe('DetailUser');
    expect(details.isOwner).toBe(true);
    expect(details.chords).toEqual(['C', 'G']);
  });

  it('defaults missing fields safely', () => {
    const lean = { _id: 'd2', slug: 's', title: 't', artist: 'a', ownerUserId: 'u2' };
    const details = songDocToDetails(lean);
    expect(details.chords).toEqual([]);
    expect(details.lyrics).toBe('');
    expect(details.youtube).toBe('');
    expect(details.favorites).toBe(0);
    expect(details.isOwner).toBe(false);
  });

  it('works when currentUserId matches as string', () => {
    const doc = { slug: 'x', title: 'x', artist: 'x', ownerUserId: 'uid-9' };
    expect(songDocToDetails(doc, 'uid-9').isOwner).toBe(true);
  });
});

describe('getSongListFilter', () => {
  it('returns only public songs when no owner or mine is provided', () => {
    expect(getSongListFilter({})).toEqual({ isPublic: true });
    expect(getSongListFilter({ q: '' })).toEqual({ isPublic: true });
  });

  it('returns owner filter (no isPublic) when using mine + current user', () => {
    const user = { userId: 'u42' };
    const f = getSongListFilter({ mine: 'true' }, user);
    expect(f).toEqual({ ownerUserId: 'u42' });
  });

  it('returns owner filter (no isPublic) when ownerUserId matches current user', () => {
    const user = { userId: 'abc123' };
    expect(getSongListFilter({ ownerUserId: 'abc123' }, user)).toEqual({ ownerUserId: 'abc123' });
    expect(getSongListFilter({ owner: 'abc123' }, user)).toEqual({ ownerUserId: 'abc123' });
  });

  it('adds isPublic when requesting another user\'s songs', () => {
    const user = { userId: 'me' };
    expect(getSongListFilter({ ownerUserId: 'other' }, user)).toEqual({ ownerUserId: 'other', isPublic: true });
    // unauthenticated viewer
    expect(getSongListFilter({ ownerUserId: 'someone' }, null)).toEqual({ ownerUserId: 'someone', isPublic: true });
  });

  it('combines q search with owner or public base', () => {
    const noOwnerQ = getSongListFilter({ q: 'hello' });
    expect(noOwnerQ).toEqual({
      isPublic: true,
      $or: [
        { title: { $regex: 'hello', $options: 'i' } },
        { artist: { $regex: 'hello', $options: 'i' } }
      ]
    });

    const ownQ = getSongListFilter({ q: 'world', mine: '1' }, { userId: 'u1' });
    expect(ownQ).toEqual({
      ownerUserId: 'u1',
      $or: [
        { title: { $regex: 'world', $options: 'i' } },
        { artist: { $regex: 'world', $options: 'i' } }
      ]
    });

    const otherQ = getSongListFilter({ q: 'x', ownerUserId: 'u2' }, { userId: 'u1' });
    expect(otherQ).toEqual({
      ownerUserId: 'u2',
      isPublic: true,
      $or: [
        { title: { $regex: 'x', $options: 'i' } },
        { artist: { $regex: 'x', $options: 'i' } }
      ]
    });
  });

  it('mine without current user still produces a filter (auth check is done by caller)', () => {
    // helper itself is pure; caller (route) enforces 401
    const f = getSongListFilter({ mine: true }, null);
    expect(f).toEqual({ isPublic: true }); // falls back
  });

  it('handles falsy/edge inputs gracefully', () => {
    expect(getSongListFilter({ q: '   ' })).toEqual({ isPublic: true });
    expect(getSongListFilter({ ownerUserId: '' })).toEqual({ isPublic: true });
  });
});
