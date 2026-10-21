# CHECKPOINT — Vercel-primary portfolio reconciliation

- **Generated:** 2026-10-19 (local, IST)
- **Workspace:** `E:\portfolio-reconcile`
- **Branch:** `feature/vercel-primary-reconcile` ← `origin/main` @ `2f535976c195dd9ba3fc0e151294e90c53b044e7`
- **Status:** Phases A–H complete and verified. Preview deployed and verified (55/55). **Stopped at the Phase I approval gate (commit). Nothing committed, pushed, or promoted to production.**

---

## 1. Source state (re-validated this session)

| Item | State | Verification |
|---|---|---|
| `E:\portfolio-site` (A) | HEAD `9f32780`, **28 staged files**, 0 unstaged, 0 stash | untouched |
| `E:\skmdshariff143-ai.github.io` (B, production source) | HEAD `2f53597`, **7 modified/untracked**, 0 stash | untouched |
| Backup `E:\portfolio-backups\20261019-190209-…` | **158 files**, 7/7 changed-file hashes still match source (0 drift) | still valid |
| `origin/main` | `2f535976c195dd9ba3fc0e151294e90c53b044e7` (unchanged) | `git ls-remote` |
| Secrets in backup | `env.local.DPAPI.clixml`, `env.production.local.DPAPI.clixml` + `RESTORE-SECRETS.ps1` (DPAPI, value-free) | verified earlier + this session |
| Secrets in integration tree | **0** secret-like paths, **0** token-pattern matches | scan this session |

**Nothing in A, B, or the backup was modified at any point.**

## 2. What was built (all inside the isolated worktree)

### Reconciliation (Phase B)
- 7 production files copied from B with SHA-256 source==dest proof → `RECONCILE-PROVENANCE.txt`.
- Explicitly excluded: `.env.local`, `.vercel/**` (all of it, incl. OIDC token), `assets/certificates-backup/**`, `qa_results.json`, `public/**`, previews.
- Result vs the live deployed artifact (`.vercel/output/static`): **81 files byte-identical (line-ending normalized), 0 missing, 4 intentionally changed, 36 excluded by design.**

### Content / features (Phase C)
- 3D Observatory + `observatory-scene.js` (production version), `observatory-interactions.js`, `portfolio-motion.js`, Three.js vendor files + `THREE-LICENSE.txt` all present and preserved.
- Projects: **4** (NeuroLearn AI, Amazon ML Challenge 2026, CreditGuard, FarmaLink) — matches production JSON, static cards, counter and Observatory labels (all consistent = 4).
- Certificates: **26 records, 26 assets resolve**, `assets/resume.pdf` 79,616 B (newest verified), 0 zero-byte files.
- **Languages section restored** (English–Professional, Telugu–Native/Fluent, Urdu–Fluent, Hindi–Conversational), values confirmed identical in `data/profile.json` and source A.
- Personal details (email, CGPA): **no change made** — conflict reported for your confirmation.

### Vercel-only configuration (Phase E)
- Canonical, `og:url`, `og:image`, `twitter:image`, both JSON-LD `url`s → `https://skmdshariff143-ai-github-io.vercel.app/`
- `robots.txt`: Vercel sitemap + **`Disallow: /assets/certificates-backup/` restored**
- `sitemap.xml`: Vercel loc + `lastmod 2026-10-19`
- `README.md` live link → Vercel (repo name/clone URL unchanged)
- `manifest.json` (`start_url: "/"`), `404.html` (`href="./"`), `vercel.json` (`cleanUrls`, `trailingSlash:false`) verified correct
- Live production still serves **8 github.io references**; they are all fixed here.

### Security (Phase F)
- `.vercelignore` added: excludes `.env*`, `.vercel/`, `run_qa.py`, `requirements.txt`, `qa_results.json`, `qa-artifacts/`, `scripts/`, `CERTIFICATE_WORKFLOW.md`, `RECONCILE-PROVENANCE.txt`, `CHECKPOINT*.md`, `public/`, `assets/certificates-backup/`.
- Required site files asserted **not** ignored (26/26 static checks pass).
- `.gitattributes` added (`* text=auto eol=lf`) to kill the CRLF/LF drift that existed between local worktrees and the deployed artifact.

### Design upgrade (Phase D)
Root cause found: `index.html` shipped redesigned markup (`.skills-3d-grid`, `.about-grid`, `.case-study-card`, `.timeline-*`, `.footer-nav`, …) that **`style.css` never defined**, so those sections rendered as unstyled single-column stacks. Fixed by an **appended, self-contained CSS block** (652 lines, 0 deletions):
- Skills → responsive 3-col grid, icon rings, pill chips (+ full-width Languages & Professional bands)
- About → 2-col narrative + stats sidebar, icon circles, badge pills
- Projects → card chrome, badge/title group, compact Code/Demo buttons, boxed Problem/Solution/Contribution, verified-result banner
- Timeline → `<ol>` marker cleanup, type badges, meta pills, mini-chips, certificate button
- Achievements → category pills; Footer → 3-col grid, horizontal quick links, social circles
- Responsive rules at 992/768/480 + `prefers-reduced-motion` and `body.reduce-motion-active` handling

## 3. Test evidence (exact commands, all executed this session)

| Command | Result |
|---|---|
| `python scripts/validate-data.py` | **PASS** — 26 certs, profile, 4 projects |
| `python scripts/qa_static_checks.py` | **26 passed, 0 failed** (dup ids, alt text, 69 local refs, anchors, URL/SEO consistency, robots/sitemap, ignore assertions) |
| `python run_qa.py` (Selenium/Chrome, 6 viewports) | **ALL PASSED** — 360/390/768/1024/1440/1920: no horizontal overflow, 0 console errors, 0 network 404s, 3D renderer `ready`, observatory toggle ≥40 px touch target |
| `python scripts/qa_http_smoke.py` | **ALL PASSED** — 19 GET checks (200s, 404s, content types), resume 79,616 B, certificate asset 200 |
| `node --check` × 4 JS files | syntax OK |
| JSON parse × 5 files | valid |
| Layout probe + section screenshots | `qa-artifacts/` (git- and deploy-ignored) |
| Secret scans (paths + values) | **0 hits** |
| Diff audit vs `origin/main` | **0 deleted files**; only 9 modified + 7 added |

**Limitations (not yet verified):**
- Contact form: no real submission sent (not approved).
- `.vercelignore` is enforced only at upload time → must be re-verified on the preview deployment.
- Visual review was performed by me from screenshots, not a human design review.
- External links: single-point-in-time HTTP checks (see §4).
- Google indexing: not attempted.

## 4. Decisions resolved (user, this session)

1. **AI Interview Coach Pro** → **not restored** (repo 404 / demo 503, unverifiable). Ship 4 verified projects.
2. **Personal details** → **keep current published values** (`sk.md.shariff143@gmail.com`, CGPA 8.21/10). No change made.
3. **NeuroLearn Live Demo** → **removed** (was redirecting to a Vercel login page). JSON key kept as `""` so `validate-data.py` still requires key presence; renderer treats `""` as falsy.
4. **Amazon ML Code** → **hidden** (private repo 404 for visitors). Same `""` technique; static fallback card updated too.
5. **Languages** restored (confirmed by `data/profile.json` + source A); **`.vercelignore`** added; **robots `Disallow`** re-added.

## 4b. Phase H — preview deployment (approved and executed)

- **Preview URL:** `https://skmdshariff143-ai-github-i0z9qald7.vercel.app`
- **Deployment:** `dpl_9Z4wyLzd28jbg84jHzE5B8ifMaGc` · `readyState: READY` · `target: null` (**preview**) · `productionUrl: null`
- **Inspect:** https://vercel.com/shaik-mahammad-shariff-s-projects/skmdshariff143-ai-github-io/9Z4wyLzd28jbg84jHzE5B8ifMaGc
- Superseded first preview: `dpl_AGecgBBfvLHsAtAYAzPFSnqfoM6e` (`…bky5y9itg.vercel.app`) — rebuilt after `.vercelignore` was found to omit `.gitattributes`.
- `--prod` was **never** used; the production alias still serves the previous deployment.
- Project identity confirmed before deploy: `prj_OWzQ7FzwFwlyK2cJWsRE0FF7LqCR` / `team_J1DYhRPYmArh3STLVOFj38nB`.
- `vercel link` minted a fresh `VERCEL_OIDC_TOKEN` into `E:\portfolio-reconcile\.env.local` → git-ignored (`.env*`), `.vercelignore`-covered (2 rules), never printed, `git ls-files` = 0 matches.

**Preview verification (`python scripts/qa_preview_verify.py <url>`): 55 passed, 0 failed**
- 16 required assets → 200 (incl. resume, certificates JSON, observatory JS, vendor license)
- 19 excluded paths → 404 (`run_qa.py`, `requirements.txt`, `qa_results.json`, `CERTIFICATE_WORKFLOW.md`, `RECONCILE-PROVENANCE.txt`, `CHECKPOINT.md`, `scripts/*`, `.env`, `.env.local`, `.vercel/project.json`, `.gitignore`, `.vercelignore`, `.gitattributes`, `qa-artifacts/*`, `assets/certificates-backup/*`, `public/*`, `README.md`)
- unknown path → 404 **with our custom 404.html body**
- canonical/OG/JSON-LD/robots/sitemap all on the production Vercel host, zero github.io
- 4 projects served with Amazon `github:""` and NeuroLearn `liveDemo:""`; 26 certificates served
- served `index.html` == local `index.html` (Vercel appends its authenticated-viewer `vercel.live` feedback script; not in our source)

**Preview authentication:** previews are behind `deploymentProtection: ["vercel_authentication"]`. Automated checks therefore ran via the authenticated `vercel curl` (bypass built in), **not** an anonymous browser. Anonymous visitors get Vercel's login page until protection is disabled or the deployment is promoted/allowed — this applies to preview only; the production alias is public.

**Production comparison (live, anonymous) — proves production untouched:**

| Check | Production (live) | Preview (ours) |
|---|---|---|
| github.io refs in homepage | **6** | **0** |
| Languages section | absent | present |
| robots sitemap / Disallow | github.io / **missing** | vercel.app / present |
| sitemap loc | github.io | vercel.app |
| Amazon github / NeuroLearn demo | private-repo 404 / login wall | hidden / hidden |
| `/run_qa.py`, `requirements.txt`, `qa_results.json`, `CERTIFICATE_WORKFLOW.md`, `scripts/*` | **200 (exposed)** | **404** |
| `/.env.local` | 404 | 404 |
| certificates / resume | 26 / 79,616 B | 26 / 79,616 B |

## 5. Next actions and approval gates

| Phase | Action | Gate |
|---|---|---|
| H | Preview deploy + verification | ✅ **done this session (55/55)** |
| I | Secret review → commit → push branch → PR to `main` | **needs your approval now (commit), then push, then merge** |
| J | Production deploy to `prj_OWzQ7FzwFwlyK2cJWsRE0FF7LqCR` | explicit production approval |
| K | Disable GitHub Pages **for `skmdshariff143-ai.github.io` only** | explicit approval, only after J verified |
| L | Sitemap submission instructions, repo homepage link, docs | approval for repo settings |

**Rollback:** current production deployment `dpl` served at `https://skmdshariff143-ai-github-fkqc4vcau.vercel.app` (Ready) is untouched and can be promoted with `vercel rollback`; local sources A/B and the 158-file backup are byte-identical to before this session; the worktree branch has **no commits yet**, so `git worktree remove` discards only this experiment.
