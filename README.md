# M. Afiif Imanto — Portfolio

A static, framework-free portfolio site. No build step, no dependencies: open
`index.html` in a browser and it runs.

```
index.html            Markup for every section
css/style.css         Mobile-first stylesheet (design tokens at the top)
js/script.js          ~250 lines of vanilla JS for the interactions
assets/images/        portrait.jpg, hero-poster.jpg, project thumbnails (SVG placeholders)
assets/videos/        city-skyline.mp4 — the hero background loop
assets/M-Afiif-Imanto-CV.pdf    File served by the "Download Resume" buttons
```

## Things to replace before publishing

| What               | Where                            | Notes                                                                                                                                        |
| ------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Project thumbnails | `assets/images/project-1..6.svg` | Generated placeholders; replace with real screenshots.                                                                                       |
| GitHub URL         | `github.com/afiifimanto`         | Appears in the hero, contact panel and footer. Your CV had no GitHub link, so this is a guess — fix or remove it.                            |
| Statistics         | `#about` stat cards              | "20+ projects", "10+ enterprise clients", "5+ engineers mentored" are estimates drawn from the CV. Adjust to numbers you're happy to defend. |

## The hero video

`assets/videos/city-skyline.mp4` is an aerial city loop, compressed from a
38 MB 1080p60 source down to **3.6 MB**: 1280×720, 30 fps, ~900 kbps H.264, no
audio track, faststart enabled. `assets/images/hero-poster.jpg` (84 KB) is
frame one of the same clip, so the hero looks identical before playback starts.

The source is bright daylight footage, so the dark cinematic look comes from two
layers in `css/style.css`:

1. `.hero__video` is graded down with
   `filter: brightness(0.52) saturate(72%) contrast(112%)`.
2. `.hero__overlay`, `.hero__vignette` and `.hero__grid` then add the black
   gradient, blue tint, vignette and faint grid used across the rest of the site.

Tune the grade first — the `brightness` value is the single biggest lever on how
dark the hero reads. Visitors with `prefers-reduced-motion` get the poster frame
instead: `js/script.js` pauses the video rather than playing a full-screen
moving background.

To swap in different footage, drop your own file at the same path and re-grade
if needed. To recompress, any H.264 encoder works; the target that produced this
file was 720p / 30 fps / 900 kbps with the audio track dropped.

## Skills & technology icons

Every badge in the toolkit carries an inline SVG mark from the sprite at the top
of `index.html` (`t-*` symbols for technologies, `i-*` for interface icons).
Brand tints live in `css/style.css` as `.i-react`, `.i-django` and friends — add
a new tech by dropping a `<symbol>` into the sprite, referencing it with
`<use href="#t-yours">`, and optionally adding one colour rule.

All eight categories start expanded. From the tablet breakpoint up they sit in
two columns with `grid-auto-rows: 1fr`, which is what gives every card the same
height; on phones they fall back to natural heights so short categories don't
leave a screen of empty space. Each header still collapses its own panel.

## Customising the look

Every colour, space, radius and easing value is a custom property in the
`:root` block at the top of `css/style.css`. Changing `--color-primary` and
`--color-highlight` re-themes the whole page.

Breakpoints are mobile-first: base styles are phone, then `48rem` (768px),
`62rem` (992px) and `75rem` (1200px).

## Behaviour notes

- There is no contact form. The site is fully static with no endpoint to submit
  to, so the contact section links straight to email, LinkedIn and GitHub. Add
  Formspree, Netlify Forms or your own endpoint later if you want submissions.
- Everything respects `prefers-reduced-motion` — animations, parallax, counters
  and smooth scrolling all shut off for visitors who ask for that.
- Scroll reveals use `IntersectionObserver`; if it's unavailable, content is
  shown immediately rather than hidden.

## Deploying to Firebase Hosting

`firebase.json` is already configured, with the project root as the public
directory (`index.html` stays where it is) and `firebase.json`, `.firebaserc`,
`README.md` and dotfiles excluded from the upload.

One-time setup:

```bash
npm install -g firebase-tools     # or use npx firebase-tools below
firebase login                    # opens a browser
firebase projects:create          # skip if you already have a project
firebase use --add                # pick the project, writes .firebaserc
```

Deploy, and every deploy after this:

```bash
firebase deploy --only hosting
```

Live at **https://imantoafiif.web.app**.

Two Hosting sites live in the one project: `imantoafiif` serves the site, and
the original `personal-website-14b97` site now only 301-redirects to it (its
public dir is the empty `redirect/` folder). A project ID cannot be renamed, so
adding a second site is how you get a clean URL — see the two entries under
`hosting` in `firebase.json`. `firebase deploy --only hosting` updates both.
Preview it locally on the real Hosting emulator first with
`firebase emulators:start --only hosting`, which — unlike `python3 -m
http.server` — supports HTTP range requests, so video seeking behaves as it
will in production.

### Caching

Set deliberately in `firebase.json`, because nothing here has hashed filenames:

| Files                  | `Cache-Control`          | Why                                                                                                                                 |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `.html`, `.css`, `.js` | `no-cache`               | Revalidates every load, so edits appear immediately instead of visitors seeing a stale stylesheet. 304s are cheap.                  |
| video, images, PDF     | `public, max-age=604800` | A week of caching for the heavy files. Short enough that replacing `portrait.jpg` under the same name still reaches people quickly. |

If you later add a build step with content-hashed filenames, switch the asset
rule to `max-age=31536000, immutable`.

### Custom domain

`firebase hosting:sites` → Firebase console → Hosting → Add custom domain, then
add the TXT and A records it gives you. Certificates are provisioned
automatically.

## Deploying anywhere else

It's plain static files, so anything works: GitHub Pages, Netlify, Vercel,
Cloudflare Pages, or a bucket behind a CDN. Upload the folder as-is.
