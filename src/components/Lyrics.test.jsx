/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Lyrics from './Lyrics';
import { UserContext } from '../context/UserContext';

function renderLyrics(lyrics, { userOverrides = {}, columns, transpose } = {}) {
  const user = {
    chordColor: '06c',
    chordPosition: 'above',
    ...userOverrides,
  };
  return render(
    <UserContext value={{ user }}>
      <Lyrics columns={columns} transpose={transpose}>{lyrics}</Lyrics>
    </UserContext>
  );
}

describe('Lyrics', () => {
  it('renders plain text', () => {
    const { container } = renderLyrics('Hello world');
    expect(container.querySelector('.song')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders chords as div.chord.above by default with correct color', () => {
    const { container } = renderLyrics('[C]Hello [G]world');

    const chords = container.querySelectorAll('.chord.above');
    expect(chords).toHaveLength(2);
    expect(chords[0].textContent).toBe('C');
    expect(chords[1].textContent).toBe('G');
    expect(chords[0]).toHaveStyle({ color: '#06c' });
  });

  it('renders chords inline when chordPosition is inline', () => {
    const { container } = renderLyrics('[Am]Text', {
      userOverrides: { chordPosition: 'inline' },
    });

    const chord = container.querySelector('.chord.inline');
    expect(chord).toBeInTheDocument();
    expect(chord.textContent).toBe('[Am]');  // note: includes brackets for inline
    expect(chord).toHaveStyle({ color: '#06c' });
  });

  it('renders comments as div.comment', () => {
    const { container } = renderLyrics('[(Intro)]\nSome lyrics');

    const comment = container.querySelector('.comment');
    expect(comment).toBeInTheDocument();
    expect(comment.textContent).toBe('Intro');
  });

  it('renders tab blocks as div.tabs preserving lines with br elements', () => {
    const tabLyrics = `[|
A|---0---|
E|---1---|
|]`;
    const { container } = renderLyrics(tabLyrics);

    const tabs = container.querySelector('.tabs');
    expect(tabs).toBeInTheDocument();
    // Should contain two lines separated by br
    expect(tabs.textContent).toContain('A|---0---|');
    expect(tabs.textContent).toContain('E|---1---|');
    expect(tabs.querySelectorAll('br')).toHaveLength(1);
  });

  it('handles mixed content: chords, text, comments, and tabs in verses', () => {
    const complex = `[(Verse 1)]
[C]Line one [G]here

[|
A|-----|
E|---3-|
|]
Plain after tab`;

    const { container } = renderLyrics(complex);

    expect(container.querySelectorAll('.comment')).toHaveLength(1);
    expect(container.querySelectorAll('.chord.above')).toHaveLength(2);
    expect(container.querySelector('.tabs')).toBeInTheDocument();
    expect(screen.getByText(/Plain after tab/)).toBeInTheDocument();
  });

  it('splits into multiple verse parts on blank lines', () => {
    const { container } = renderLyrics('First verse\n\nSecond verse');

    const parts = container.querySelectorAll('.part');
    expect(parts).toHaveLength(2);
  });

  it('applies columns style', () => {
    const { container } = renderLyrics('Some text', { columns: 3 });

    const song = container.querySelector('.song');
    expect(song).toHaveStyle({ columnCount: '3' });
  });

  it('handles empty, null, or whitespace lyrics gracefully', () => {
    const { container: c1 } = renderLyrics('');
    expect(c1.querySelector('.song')).toBeInTheDocument();

    const { container: c2 } = renderLyrics(null);
    expect(c2.querySelector('.song')).toBeInTheDocument();

    const { container: c3 } = renderLyrics('   \n\n   ');
    expect(c3.querySelector('.song')).toBeInTheDocument();
  });

  it('renders chords mixed with text on the same line', () => {
    const { container } = renderLyrics('The [C]quick [G]brown');

    const line = container.querySelector('.line');
    expect(line.textContent).toContain('The ');
    expect(line.textContent).toContain('quick');
    expect(line.textContent).toContain('brown');

    const chords = container.querySelectorAll('.chord');
    expect(chords[0].textContent).toBe('C');
    expect(chords[1].textContent).toBe('G');
  });

  it('uses different chord color from user context', () => {
    const { container } = renderLyrics('[F]Test', {
      userOverrides: { chordColor: 'c00' },
    });

    const chord = container.querySelector('.chord');
    expect(chord).toHaveStyle({ color: '#c00' });
  });

  it('ignores empty lines inside verses', () => {
    const { container } = renderLyrics('Line1\n\n\nLine2');

    // Two parts
    const parts = container.querySelectorAll('.part');
    expect(parts).toHaveLength(2);
  });

  it('transposes chord labels when transpose prop is set', () => {
    const { container } = renderLyrics('[C]Hello [G]world', { transpose: 2 });

    const chords = container.querySelectorAll('.chord.above');
    expect(chords).toHaveLength(2);
    expect(chords[0].textContent).toBe('D');
    expect(chords[1].textContent).toBe('A');
  });

  it('transposes inline chords and keeps brackets', () => {
    const { container } = renderLyrics('[Am]Text', {
      transpose: 2,
      userOverrides: { chordPosition: 'inline' },
    });

    const chord = container.querySelector('.chord.inline');
    expect(chord).toBeInTheDocument();
    expect(chord.textContent).toBe('[Bm]');
  });

  it('does not transpose comment labels', () => {
    const { container } = renderLyrics('[(Intro)]\n[C]Hi', { transpose: 2 });

    expect(container.querySelector('.comment').textContent).toBe('Intro');
    expect(container.querySelector('.chord.above').textContent).toBe('D');
  });
});
