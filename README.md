# Velonie Baluarte: Portfolio

Personal portfolio for GoHighLevel CRM, cross-platform workflow automation and AI integrations. Tools include n8n, Zapier, Pabbly, APIs and webhooks, with SEO/AEO, analytics and technical QA as supporting capabilities.

**Live website:** https://velonieautomation.com/

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
- `case-study-*.html`: technical case studies, including a confidential-engagement Google Ads research and conversion QA study
- `go-highlevel-automation-specialist/`, `ghl-*/`, `n8n-go-highlevel-integration/`: service-specific landing pages
- Resume buttons link to the current photo resume stored in Google Drive
- `tools/`: Free Tools directory and three browser-based tools (see "Free Tools" below)
- `assets/tools/`: shared stylesheet and JavaScript modules for the tools
- `tests/tools-logic.test.mjs`: logic tests for the tools
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

## Free Tools

Live at `/tools/`. Six tools that run entirely in the visitor's browser: no API, backend, login or storage.

| Page | Script | What it does |
|---|---|---|
| `tools/index.html` | `directory.js` | Directory with search and category filter. Cards are static HTML and work without JavaScript. |
| `tools/seo-meta-generator/` | `seo-meta.js` | Title, description, canonical, robots, Open Graph and Twitter/X tags. All values are HTML-entity escaped. |
| (same page) | `page-analyzer.js` | Page checker: reads a page's HTML (direct fetch when the site allows it, otherwise pasted source or an uploaded file), reports problems and suggests titles, descriptions and focus keywords. Rule-based, parsed with `DOMParser` (no scripts run). Cross-site fetches fail for most sites because of browser CORS rules; a reliable URL fetch would need a server-side proxy, which is intentionally not used. |
| `tools/faq-schema-generator/` | `faq-schema.js` | Schema.org FAQPage JSON-LD via `JSON.stringify`, with `<` written as `<` so pasted output cannot close a script element. |
| `tools/invoice-generator/` | `invoice.js` | Invoice with logo, line items, discount and tax. Live preview built with DOM methods; PDF through the browser print dialog (print CSS in `tools.css`); standalone `.html` download. The logo is read with `FileReader` and never uploaded. |
| `tools/automation-roi-calculator/` | `roi-calculator.js` | Hours saved, yearly benefit, first-year ROI and payback from the visitor's own numbers. The formulas are printed on the page. |
| `tools/sms-segment-calculator/` | `sms-calculator.js` | GSM-7 / UCS-2 detection, segment splitting (160/153 and 70/67), characters that change the encoding, and campaign cost at the visitor's own rate. No provider rate is hard-coded. |
| `tools/ai-prompt-builder/` | `prompt-builder.js`, `prompt-templates.js` | Deterministic prompt assembly from form fields and templates. It is not AI and calls no model. |

- Shared code: `assets/tools/css/tools.css` and `assets/tools/js/core.js` (escaping, URL validation, money and number helpers, clipboard, download, status messages, analytics).
- Each tool module exports its pure functions and only touches the page inside `init()`, so the logic is testable in Node: `node --test tests/tools-logic.test.mjs` (Node 22+ recommended; no dependencies).
- Local preview: `python -m http.server 8080` from the repository root, then open `http://localhost:8080/tools/`. The tool scripts are ES modules, so open them through a server, not from `file://`.
- Visitor text is written to the page with `textContent` or `.value` only. Do not use `innerHTML` with visitor input.
- GA4 events (same property): `tool_open`, `tool_generate` (first valid result per page view), `tool_copy`, `tool_download`, plus `tool_analyze` on the page checker and `tool_print` on the invoice. Parameters are `tool_id` and, for `tool_analyze`, `analyze_source` (`url`, `paste` or `file`). Never send typed or generated content.
- The homepage shows a moving "Free Tools" strip between the hero and the How I Solve It section (`BEGIN/END FREE TOOLS STRIP` markers in `index.html`, outside the generated How I Solve It block). It lists the tools by name, so update its two identical chip sets and its `aria-label` when a tool is added. It fires the GA4 event `free_tools_click`.
- To add a tool: create `tools/<slug>/index.html` from an existing tool page, add `assets/tools/js/<slug>.js`, add a card in `tools/index.html` (and its `ItemList` JSON-LD), add the URL to `sitemap.xml`, and add tests.
- Do not claim rankings or rich results. Google no longer shows FAQ rich results; the FAQ page says so.
- The source is public by nature (public repository and browser-delivered code). Proprietary or paid features belong in a separate private codebase with server-side processing, a database and authentication, on hosting that permits commercial SaaS. GitHub Pages is not intended for that.

## Deployment

GitHub Pages is configured to publish from `main` and the repository root. Make changes on a feature branch, validate, and merge to `main` once ready. No compilation step is needed.
