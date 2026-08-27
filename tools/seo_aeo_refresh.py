from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

replacements = {
    '<meta name="description" content="GoHighLevel systems for service businesses: follow-up in under a minute, automated booking, and documented handover. Systems audits, full GHL builds, ongoing management. Book a free 20-minute systems call.">': '<meta name="description" content="GoHighLevel CRM and automation specialist for service businesses. I build lead follow-up, booking workflows, funnels, n8n integrations, websites, and documented CRM systems. Book a free 20-minute systems call.">',
    '<meta property="og:description" content="GHL systems that eliminate manual work, missed leads, and disconnected workflows — pipelines, automations, funnels, and follow-up built end-to-end.">': '<meta property="og:description" content="GoHighLevel CRM systems, automated lead follow-up, booking workflows, n8n integrations, websites, and documented handover for service businesses.">',
    '<meta name="twitter:description" content="GHL systems that eliminate manual work, missed leads, and disconnected workflows.">': '<meta name="twitter:description" content="GoHighLevel CRM systems, automated lead follow-up, booking workflows, n8n integrations, and documented handover for service businesses.">',
    '"jobTitle": "GoHighLevel CRM Automation Specialist",': '"jobTitle": "GoHighLevel CRM & Automation Specialist",\n      "description": "Velonie Baluarte is a GoHighLevel CRM and automation specialist who builds lead-management, booking, follow-up, website, n8n integration, and AI workflow systems for service businesses.",',
    '"sameAs": ["https://www.linkedin.com/in/velonie-baluarte"],': '"sameAs": ["https://www.linkedin.com/in/velonie-baluarte", "https://github.com/velonieb-droid"],',
    '"name": "Velonie Baluarte — GHL CRM Automation",': '"name": "Velonie Baluarte — GoHighLevel CRM & Automation Specialist",',
    '"description": "GoHighLevel CRM buildouts, workflow automation, funnels, websites, and AI content systems for service businesses.",': '"description": "GoHighLevel CRM systems, workflow automation, automated lead follow-up, booking flows, funnels, websites, n8n integrations, and documented handover for service businesses.",',
    '"serviceType": ["CRM Automation", "GoHighLevel Buildout", "Workflow Automation", "Website & Funnel Design", "SEO/AEO Audit"]': '"serviceType": ["GoHighLevel CRM Setup", "CRM Automation", "Lead Follow-Up Automation", "Booking Workflow Automation", "n8n Integration", "Website & Funnel Design", "SEO/AEO Audit"]',
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'Missing expected text: {old[:100]}')
    s = s.replace(old, new, 1)

old_roles = '''    <div class="grid-4 fade-in">
      <article class="card">
        <div class="accent-line"></div>
        <h3>GHL CRM & Automation</h3>
        <p>Pipelines, lead tagging, follow-up sequences, calendar booking, triggers, and contact workflows — built to run without manual effort.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>Website & Funnel Design</h3>
        <p>Responsive sites, landing pages, booking pages, and inquiry forms designed for lead capture and conversion.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>AI & Content Systems</h3>
        <p>Prompt libraries, content workflows, SOP drafts, and AI-powered production systems that cut prep time significantly.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>Digital Operations</h3>
        <p>Documentation, reporting, SEO/AEO structure, and client operations support — organized, clean, and handover-ready.</p>
      </article>
    </div>'''

new_roles = '''    <div class="grid-3 fade-in">
      <article class="card">
        <div class="accent-line"></div>
        <h3>GoHighLevel CRM Systems</h3>
        <p>Pipelines, lead routing, automated follow-up, calendars, booking workflows, forms, funnels, and lifecycle automation built around how your business actually operates.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>Automation & Integrations</h3>
        <p>n8n, Zapier, Pabbly, APIs, webhooks, and AI workflows that connect your systems and eliminate repetitive manual work.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>Websites & Conversion</h3>
        <p>Landing pages, funnels, lead forms, booking experiences, SEO/AEO structure, and conversion-focused websites connected directly to your CRM.</p>
      </article>
    </div>'''

if old_roles not in s:
    raise SystemExit('Roles block not found')
s = s.replace(old_roles, new_roles, 1)

about = '''
  <!-- ABOUT / ENTITY -->
  <section class="wrap" id="about">
    <div class="section-head fade-in">
      <div>
        <div class="section-tag">About Velonie Baluarte</div>
        <h2>GoHighLevel systems built with engineering discipline.</h2>
      </div>
      <p class="section-copy">Velonie Baluarte is a GoHighLevel CRM &amp; automation specialist who helps service businesses build lead-management, booking, follow-up, website, and integration systems that are tested, documented, and ready for handover.</p>
    </div>
    <div class="grid-2 fade-in">
      <article class="card">
        <div class="accent-line"></div>
        <h3>Primary specialty</h3>
        <p>GoHighLevel CRM architecture, automated lead follow-up, calendars, pipelines, funnels, forms, booking flows, and account audits.</p>
      </article>
      <article class="card">
        <div class="accent-line"></div>
        <h3>Supporting capabilities</h3>
        <p>n8n and Zapier integrations, websites, AI workflows, SEO/AEO structure, systems documentation, SOPs, and technical project coordination.</p>
      </article>
    </div>
  </section>

'''
marker = '  <!-- BACKGROUND -->'
if marker not in s:
    raise SystemExit('Background marker not found')
s = s.replace(marker, about + marker, 1)

p.write_text(s, encoding='utf-8')
