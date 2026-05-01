import { Fragment } from "react";

function TabsBlock({children}) {
    const tabLines = children.split('\n');
    const numLines = tabLines.length;
    return (
        <div className="tabs">
            {tabLines.map((line, index) => (<Fragment key={`tabsLine-${index}`}>
                {line}
                {index < numLines - 1 ? <br /> : null}
            </Fragment>))}
        </div>
    );
}

function VerseBlock({children}) {
    return <div className="part">{children}</div>
}

function CommentBlock({children}) {
    return <div className="comment">{children}</div>
}

function LyricsLine({children}) {
    return <div className="line">{children}</div>
}

function LyricsChord({chordName}) {
    return <div className="chord">{chordName}</div>
}

export default function Lyrics({children}) {
    
    function parseVerseBlock(part, partIndex) {
        /*
            [(Intro)]
                [C]   [D]   [G]   [G7]
            [|
            A|---3-2-0-------2-----2---|
            E|---0-----2---0-3---0-1---|
            C|---0-----2-----2-----2---|
            G|---0-----2-----0-----0---|
            |]
            Deep in the hundred acre woods
        */
        const elements = [];

        // find tabsStrings before splinting the part into lines
        const subParts = part.trim().split(/(\[\|\n?.+?\n?\|\])/gs); // look for [| ... |]
        subParts.forEach((subPart, subPartIndex) => {
            if (subPart.startsWith('[|') && subPart.endsWith('|]')) {
                const tabsString = subPart.substring(2, subPart.length - 2).trim();
                elements.push(<TabsBlock key={`tabs-${partIndex}-${subPartIndex}`}>{tabsString}</TabsBlock>);
                return; // skip to next str in tabs.forEach()
            }

            // else split into strings and look for comments and chords
            const lines = subPart.trim().split('\n');
            const partLines = [];

            lines.forEach((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (trimmedLine === '') {
                    // empty line
                    // partLines.push(<br key={`br-${lineIndex}`} />);
                    return; // skip to next line in lines.forEach()
                }

                if (trimmedLine.startsWith('[(') && trimmedLine.endsWith(')]')) { // Look for [( ... )]
                    // comment line
                    const commentString = trimmedLine.substring(2, trimmedLine.length - 2);
                    partLines.push(<CommentBlock key={`comment-${partIndex}-${lineIndex}`}>{commentString}</CommentBlock>);
                    return; // skip to next line in lines.forEach()
                }

                // this line must look like
                // this: `   [G]    [Em]    [C]    [D]` (chords only, spaced out)
                // or this: `[C]Somewhere over the [Em]rainbow` (chords and lyrics)
                // or plain text: `no chords on this line` (just lyrics, no chords)
                const lineParts = line.split(/(\[[^\]]+\])/g); // Look for [ ... ]
                const lineElements = [];

                lineParts.forEach((linePart, linePartIndex) => {
                    if (linePart.startsWith('[') && linePart.endsWith(']')) {
                        // chord
                        const chordString = linePart.substring(1, linePart.length - 1);
                        lineElements.push(
                            <LyricsChord
                                chordName={chordString}
                                key={`chord-${partIndex}-${lineIndex}-${linePartIndex}`}
                            />
                        );
                        return;
                    }
                    // else this is plain text
                    lineElements.push(linePart);
                });
                partLines.push(<LyricsLine>{...lineElements}</LyricsLine>);
            });
            elements.push(<>{...partLines}</>);
        });
        return <VerseBlock key={`part-${partIndex}`}>{...elements}</VerseBlock>;
    }

    function parseLyrics(lyrics) {
        // first, split the lyrics into parts
        const parts = lyrics.trim().split('\n\n');
        const elements = [];
        parts.forEach((part, partIndex) => {
            const verse = parseVerseBlock(part, partIndex);
            elements.push(verse);
        });

        return <div className="song">{...elements}</div>;
    }

    return parseLyrics(children);
}