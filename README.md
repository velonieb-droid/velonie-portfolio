# Velonie Baluarte: Portfolio

Personal portfolio for GoHighLevel CRM, cross-platform workflow automation and AI integrations. Tools include n8n, Zapier, Pabbly, APIs and webhooks, with SEO/AEO, analytics and technical QA as supporting capabilities.

**Live website:** https://velonieb-droid.github.io/velonie-portfolio/

## Positioning

- Primary role: **GoHighLevel CRM & AI Automation Specialist**.
- Supporting value: **Cross-Platform Workflow Automation & Integrations** across n8n, Zapier, Pabbly, native GHL, APIs and webhooks.
- AI is a capability, not a requirement for every workflow. Keep deterministic automation and platform-specific case-study evidence clearly labeled.
- Preserve the n8n-specific integration landing page for focused search intent, without making n8n the only advertised platform.

## Architecture

Static GitHub Pages site, no build system required.

- `index.html`: homepage HTML, inline styles, scripts and structured data
- `hire-me/index.html`: dedicated recruiter/hiring profile with verified project scope, resume and role contact links
- `assets/`: branding, project images and social sharing image
- `case-study-*.html`: technical case studies including Project Driver Google Ads research and conversion QA
- `go-highlevel-automation-specialist/`, `ghl-*/`, `n8n-go-highlevel-integration/`: service-specific landing pages
- Resume buttons link to the current photo resume stored in Google Drive
- `sitemap.xml`, `robots.txt`: indexation support
- Legacy `indexnew.html`, `profile-card-v2.html`, and `assets/index.html` have `noindex,follow` and canonical-to-home metadata. Keep them out of the sitemap until archived.

## Homepage journey

1. Specialist positioning and outcome summary, with separate recruiter pathway
2. Three featured, evidence-led case studies and links to the complete work archive
3. Paths for hiring teams and business owners; real workflow screenshots and links to live client sites
4. Core services, reliability/process, and career experience
5. Engagement options, FAQs, booking calendar and contact

**Design note:** The live-site cards are stylized covers, not captured website screenshots. Their Visit links open the actual sites. The sample-work carousel contains real workflow images.

## External integrations

- **Cal.com** inline booking (check `CAL_LINK` in `index.html`)
- **Google Drive** introduction video loaded on demand
- **Self-hosted GoHighLevel explainer video** on `/go-highlevel-automation-specialist/`; MP4 and poster stored under `assets/` with a responsive portrait player
- **Google Fonts** (Outfit and Inter)
- Contact methods: email, WhatsApp and LinkedIn

If the calendar embed is blocked or unavailable, the user can still contact via email.

## Maintenance & privacy

- Update portfolio project claims only when supported by real work and evidence.
- Verify client approval before publishing logos, screenshots, testimonials or sensitive workflow details.
- Remove credentials, contact data, health information and other client-sensitive material from screenshots.
- Do not treat stylized covers as actual site screenshots.
- Recheck client links regularly; external projects can move or become temporarily unavailable.
- Featured case studies distinguish findings from completed work, and proposals from launched campaigns.
- The homepage and recruiter page share GA4 property `G-WBC8SXEGR3`; verify event flow in GA4 separately.
- The site social preview image uses `assets/automation-portfolio-hero.png`, since `assets/og-card.png` is not present.
- Update homepage title, description and structured data when professional positioning changes.
- Adjust sitemap last-modified entries **only for pages actually changed**.

## QA before merging a substantial redesign

- Check markup nesting, duplicate IDs, internal links and inline JavaScript syntax.
- Test at desktop, tablet and mobile widths; verify navigation dropdowns and carousels.
- At 375 × 667 and other mobile sizes, verify hero text, featured case-study cards and project content remain visible when scrolling. Resize DevTools from desktop to mobile after the page loads and confirm the hero does not stay invisible.
- Mobile uses visible content instead of scroll-reveal opacity to avoid blank panels if `IntersectionObserver` or parallax state is delayed. Do not reintroduce mobile-only `opacity: 0` without a non-JS fallback.
- Test keyboard operation, Escape behavior in the introduction-video modal, and reduced-motion settings.
- Test that the Cal.com embed can book an actual event and that email fallback stays visible.
- Verify the intro video is shareable publicly.
- Check image loading, any client publication permissions, and portfolio metrics.
- Inspect responsive layout and Core Web Vitals in a real browser.

## Deployment

GitHub Pages is configured to publish from `main` and the repository root. Make changes on a feature branch, validate, and merge to `main` once ready. No compilation step is needed.
