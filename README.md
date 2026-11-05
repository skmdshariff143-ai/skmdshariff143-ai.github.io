# Shaik Mahammad Shariff: Portfolio

Portfolio site for a final-year engineering student building AI products. Live at [mahammadshariff.vercel.app](https://mahammadshariff.vercel.app/).

## Stack

Astro static output, strict TypeScript, validated JSON content, Playwright, Lighthouse CI and Vercel. All facts live in `src/content/`.

## Run locally

Use Node.js 22 or newer.

```bash
npm ci
npm run dev
```

## Verify

```bash
npx playwright install chromium
npm run check
npm test
node scripts/check-links.mjs
npx lhci autorun
```

## Update content

- Projects: `src/content/projects.json`
- Case studies: `src/content/case-studies.json`
- Profile: `src/content/profile.json`
- Certificates: `src/content/certificates.json`, with files in `public/assets/certificates/`
- Resume: `public/assets/resume.pdf`

The root `index.html` and `404.html` only redirect the GitHub Pages address to the primary site.
