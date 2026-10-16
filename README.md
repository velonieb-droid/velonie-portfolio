# Velonie Baluarte — Portfolio

Personal portfolio for CRM, GoHighLevel, n8n, AI automation, web projects and technical operations.

**Live website:** https://velonieb-droid.github.io/velonie-portfolio/

## Architecture

Static GitHub Pages site, no build system required.

- `index.html` — homepage HTML, inline styles, scripts and structured data
- `assets/` — branding, project images and social sharing image
- `case-study-*.html` — detailed technical case studies
- `go-highlevel-automation-specialist/`, `ghl-*/`, `n8n-go-highlevel-integration/` — service-specific landing pages
- `Velonie-Baluarte-Digital-Automation-Resume-2026.pdf` — recruiter resume
- `sitemap.xml`, `robots.txt` — indexation support

## Homepage journey

1. Specialist positioning and outcome summary
2. Paths for hiring teams and business owners
3. Selected work, real workflow screenshots, and links to live client sites
4. Core services, reliability/process, and career experience
5. Engagement options, FAQs, booking calendar and contact

**Design note:** The live-site cards are stylized covers, not captured website screenshots. Their Visit links open the actual sites. The sample-work carousel contains real workflow images.

## External integrations

- **Cal.com** inline booking (check `CAL_LINK` in `index.html`)
- **Google Drive** introduction video loaded on demand
- **Google Fonts** (Outfit and Inter)
- Contact methods: email, WhatsApp and LinkedIn

If the calendar embed is blocked or unavailable, the user can still contact via email.

## Maintenance & privacy

- Update portfolio project claims only when supported by real work and evidence.
- Verify client approval before publishing logos, screenshots, testimonials or sensitive workflow details.
- Remove credentials, contact data, health information and other client-sensitive material from screenshots.
- Do not treat stylized covers as actual site screenshots.
- Recheck client links regularly; external projects can move or become temporarily unavailable.
- Update homepage title, description and structured data when professional positioning changes.
- Adjust sitemap last-modified entries **only for pages actually changed**.

## QA before merging a substantial redesign

- Check markup nesting, duplicate IDs, internal links and inline JavaScript syntax.
- Test at desktop, tablet and mobile widths; verify navigation dropdowns and carousels.
- Test keyboard operation, Escape behavior in the introduction-video modal, and reduced-motion settings.
- Test that the Cal.com embed can book an actual event and that email fallback stays visible.
- Verify the intro video is shareable publicly.
- Check image loading, any client publication permissions, and portfolio metrics.
- Inspect responsive layout and Core Web Vitals in a real browser.

## Deployment

GitHub Pages is configured to publish from `main` and the repository root. Make changes on a feature branch, validate, and merge to `main` once ready. No compilation step is needed.
