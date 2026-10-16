# Gamitha Gimhana — Portfolio

A responsive portfolio with an editorial ivory, charcoal, and terracotta design; original portraits; a filterable project collection; and eight dedicated project pages.

## Run locally

Requires Node.js 20 or newer. There are no npm dependencies to install.

```sh
npm run dev
```

Open `http://localhost:4173`. If npm is unavailable, run these commands directly:

```sh
node scripts/render.mjs
node scripts/serve.mjs
```

The preview server only exposes portfolio pages and public assets. It binds to the local machine. Stop it with Ctrl+C. Set `PORT` to use another port.

## Edit content

- `data/profile.json`: role, employer, contact information, profile links, and production domain.
- `data/projects.json`: project titles, categories, technologies, summaries, source repositories, and media.
- `data/project-stories.json`: project overview, features, architecture, contribution, and technical focus.
- `scripts/render.mjs`: page templates, shared header/footer, education, and narrative content.
- `assets/css/site.css`: design tokens, component styles, and responsive layouts.
- `assets/js/site.js`: mobile navigation, filtering, email draft, copy email, and reduced-motion-aware reveals.

Run `node scripts/render.mjs` after changing templates or data. Root HTML files and `projects/*.html` are generated. CSS and JavaScript edits need only a browser reload during local preview.

## Pages

- Home: `index.html`
- Project collection: `work.html`
- Profile and skills: `about.html`
- Contact: `contact.html`
- Project pages: `projects/floodsentinel.html`, `projects/aurora.html`, `projects/resq.html`, `projects/aurora-mobile.html`, `projects/guestfind.html`, `projects/greenhouse.html`, `projects/iso8583.html`, and `projects/serenity.html`.

Every project card opens an internal project page. GitHub repositories and project demos appear as secondary links inside those pages.

## Check and build

```sh
npm run check
npm run build
node scripts/check.mjs --dist
```

Without npm:

```sh
node scripts/render.mjs
node scripts/check.mjs
node scripts/build.mjs
node scripts/check.mjs --dist
```

The checks validate page metadata, local HTML references, and JavaScript syntax. `dist/` is regenerated from the portfolio files. The build excludes development scripts and documentation. Never place hand-edited files in `dist/`.

## Deploy to Vercel

`vercel.json` configures a static deployment:

- Framework preset: Other
- Build command: `npm run build`
- Output directory: `dist`

The production domain in metadata is `https://gamithagimhana.vercel.app`. Change `site` in `data/profile.json` if deploying to another production domain. Building this folder does not update the existing live site; deploy `dist/` or connect this source to its Vercel project.

## Contact behavior

The form creates a `mailto:` draft in the visitor's email application. The visitor reviews and sends it there. It does not submit to a server or claim to deliver messages. Direct email, telephone, and social links remain available without JavaScript. Clipboard failure falls back to selecting the email address.

## Content and assets

Public GitHub repositories were reviewed on October 16, 2026. The current Epic Lanka title was confirmed by Gamitha. LinkedIn's connected search returned `https://lk.linkedin.com/in/gamithagimhana`; the portfolio uses its corresponding public profile URL. The education timeline combines the original portfolio with the public profile.

Project source links and media provenance are recorded in `data/projects.json`. The portraits are original local assets. Aurora and GuestFind images are authentic project README screenshots; other visuals are labelled project artwork. No private employer work or production outcome claims are included.

FloodSentinel is an academic team project using synthetic training scenarios. The ISO 8583 toolkit is presented as development experimentation. Public demo hosting is outside this site's control and has not been verified as continuously available.

DM Sans and Manrope load from Google Fonts, with system fallbacks. Photos and project screenshots are served locally. No analytics or cookies are added.

## Commit to the existing repository

This folder does not contain Git metadata. To preserve the existing repository history, clone https://github.com/GamithaGimhana/My-Portfolio.git into a separate folder, then copy this cleaned portfolio into that checkout. Remove obsolete tracked site files there, keeping the checkout's `.git` directory. Review `git status` and `git diff` before staging and committing.

Do not copy `dist/`, `node_modules/`, or `.vercel/`. Generated HTML pages are included so the portfolio can also be served directly as a static site.
