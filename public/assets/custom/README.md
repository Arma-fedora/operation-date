# Custom assets

Everything in this folder is optional. Without files, the app shows the designed
SVG placeholders from `src/components/ui/Placeholder.tsx` and the built-in
Mikhaylych portrait.

Expected locations (referenced from `src/config/*.ts`):

- `photos/` — photos for the archive and final envelope
- `memes/` — memes, pigeon pictures, reaction cards
- `characters/mikhaylych/` — optional portrait that replaces the built-in SVG
- `music/` — your own audio tracks
- `sounds/` — short one-shot effects (clicks, clues, envelope)

Files are served from the site root. For example, a file at
`public/assets/custom/photos/us.webp` is referenced as
`/assets/custom/photos/us.webp`.

Keep images reasonably compressed: WebP/AVIF at 1200–1600 px on the long side is
enough for a phone. Do not add photos of other people without their consent.

Audio: MP3, mono, 44.1 kHz. Music tracks up to 3 MB, effects up to 200 KB.
Missing files are harmless — the app falls back to synthesized sound and to
designed placeholders.
