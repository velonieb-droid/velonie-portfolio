# Velonie Automation | 20 Niche Website Examples

This folder contains the original 20 niche-specific HTML websites supplied for the approved ProFlow-based website collection.

## Structure
- `index.html` is the searchable, filterable 20-niche gallery and retains all 20 supplied thumbnail images.
- `websites/<niche>/index.html` is the full HTML page for each niche.
- `websites/<niche>/assets/` contains local images, icons, stylesheets and scripts required by that page.
- `assets/thumbnails/` contains the 20 gallery preview images.
- `SOURCE-MANIFEST.json` records the original HTML source used for each niche.
- `QA-REPORT.md` records the implementation and browser QA results.

## Popup form behavior
Each niche's existing CTA opens its own niche-specific demo inquiry dialog. Required fields are validated in the browser. Submitting a valid demo form displays an on-page confirmation only. No form data is transmitted, stored, emailed, sent to a CRM, or used to create a booking.

## Demo-content boundary
Business names, phone numbers, service areas, testimonials, credentials, prices, hours and service claims are illustrative placeholders unless independently verified. The individual niche pages remain `noindex` demo pages. Replace and verify business-specific information before any production use.

## Run locally
Open `index.html` in a modern browser. No build step or package installation is required.
