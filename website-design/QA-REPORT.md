# QA Report | Velonie Automation 20-Niche Website Collection

**Review date:** November 18, 2026  
**Source:** `Velonie-ProFlow-20-Niche-LATEST-HTML-CORRECTED.zip` and the submitted 20-niche `index.html`  
**Master design:** ProFlow Plumbing

## Scope

- Rebuilt the gallery from the exact submitted 20-niche `index.html` and its 20 supplied thumbnail images.
- Retained all 20 niche-specific HTML pages, local assets, images, CSS and JavaScript from the corrected source package.
- Preserved the niche page layouts, content sections, typography, colors, hero imagery and responsive styling.
- Corrected JavaScript initialization timing on ten niche pages where inline scripts were in the document head and ran before the page elements existed. The Electrical page already uses a deferred external script.
- Kept each niche's existing niche-specific inquiry dialog and front-end-only form behavior.
- Updated only the gallery's search indexing metadata and canonical URL. Individual niche demo pages remain `noindex`.

## Niche inventory

| # | Website | Niche |
|---:|---|---|
| 1 | ProFlow Plumbing | Plumbing |
| 2 | Northstar Comfort | HVAC |
| 3 | Summit Ridge Roofing | Roofing |
| 4 | Volt & Valley Electric | Electrical |
| 5 | Evergreen Outdoor Co. | Landscaping |
| 6 | FreshNest Cleaning Co. | Home Cleaning |
| 7 | ClearShield Pest Control | Pest Control |
| 8 | Brightside Dental Studio | Dental Clinic |
| 9 | Stillwater Aesthetics | Med Spa |
| 10 | Briar & Stone Legal | Law Firm |
| 11 | Foundry Homes | Real Estate |
| 12 | Goodline Auto Works | Auto Repair |
| 13 | Table & Thyme | Restaurant & Café |
| 14 | The Modern Chair | Salon & Barbershop |
| 15 | Little Grove Learning | Childcare & Preschool |
| 16 | Ledger & Co. | Accounting & Tax |
| 17 | Forma Renovation | Home Remodeling |
| 18 | Momentum Movement | Fitness Studio |
| 19 | Paw & Whisker Club | Pet Care & Grooming |
| 20 | Kindred Home Support | Senior Home Care |

## Browser QA

Chromium browser tests were run against all 20 niche pages using the actual HTML and local assets.

| Test | Result |
|---|---|
| Niche pages present | PASS, 20/20 |
| Each page contains an inquiry dialog and form | PASS, 20/20 |
| CTA buttons tested | PASS, 47/47 opened the correct dialog |
| Close button and Escape key | PASS across all 20 pages |
| Required-field validation blocks an empty submission | PASS, 20/20 |
| Valid demo submission displays the niche-specific confirmation | PASS, 20/20 |
| Non-GET requests during form submission | None observed |
| JavaScript runtime errors | None observed |
| Horizontal overflow at 1920, 768, 390 and 320 px | None observed across all 20 pages |
| Mobile navigation open/close | PASS on pages with a mobile menu |
| JavaScript syntax | PASS, 20 script blocks checked |
| Duplicate HTML IDs | None found |
| Missing local image, script, stylesheet or CSS background references | None found |

### Gallery QA

| Test | Result |
|---|---|
| Gallery cards | 20 |
| Niche thumbnail images | 20/20 loaded |
| Open-website links | 20/20 |
| Search for HVAC | Returned Northstar Comfort only |
| Health & Wellness filter | Returned 3 matching niches |
| JavaScript runtime errors | None observed |

## Form behavior and integration boundary

- Each primary niche CTA opens its own existing inquiry dialog.
- Service-specific CTA selections are retained where the source page provides a preselected service.
- Empty required fields are blocked by browser validation.
- A valid submission displays an on-page demo confirmation.
- No data is transmitted, stored, emailed, sent to a CRM, or used to create an appointment or reservation.

## Production limitations

- Business names, phone numbers, service areas, reviews, credentials, prices, operating hours and claims are illustrative placeholders unless independently verified.
- No live CRM, email, calendar, booking, payment or lead-routing endpoint is connected.
- The niche pages remain `noindex` demo pages. Verify all business details, licensing and regulatory requirements before any commercial deployment.
