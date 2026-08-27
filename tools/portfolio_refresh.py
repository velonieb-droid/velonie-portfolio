from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

replacements = {
    '<title>Velonie Baluarte | GHL CRM Automation, Web & AI Systems</title>': '<title>GoHighLevel CRM & Automation Specialist | Velonie Baluarte</title>',
    '<meta property="og:title" content="Velonie Baluarte | GHL CRM Automation, Web & AI Systems">': '<meta property="og:title" content="GoHighLevel CRM & Automation Specialist | Velonie Baluarte">',
    '<meta name="twitter:title" content="Velonie Baluarte | GHL CRM Automation, Web & AI Systems">': '<meta name="twitter:title" content="GoHighLevel CRM & Automation Specialist | Velonie Baluarte">',
    '<div class="kicker">GHL Automation Specialist · for service businesses</div>': '<div class="kicker">GoHighLevel CRM & Automation Specialist · for service businesses</div>',
    'For service businesses losing leads to slow replies, spreadsheets, and disconnected tools. I build the pipelines, automations, funnels, and follow-up end-to-end — then test every trigger and document it so your team can run it.': 'For service businesses losing leads to slow follow-up, spreadsheets, and disconnected tools. I build GoHighLevel CRM systems, automations, booking flows, and integrations end-to-end — then test every trigger and document the system so your team can run it confidently.',
    '<span class="hcv-lbl">revenue leak found &amp; fixed</span>': '<span class="hcv-lbl">missed-call rate uncovered</span>',
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'Missing expected text: {old[:100]}')
    s = s.replace(old, new, 1)

start_marker = '  <!-- PROJECTS -->'
end_marker = '  <!-- HOW I WORK -->'
start = s.index(start_marker)
end = s.index(end_marker)

projects = '''  <!-- PROJECTS -->
  <section class="projects-section" id="projects">
    <div class="wrap">
      <div class="section-head fade-in">
        <div>
          <div class="section-tag">Project work</div>
          <h2>Real systems. Measurable business improvements.</h2>
        </div>
        <p class="section-copy">See how I’ve used GoHighLevel, automation, websites, and AI workflows to reduce response time, eliminate repetitive work, uncover CRM issues, and build systems teams can actually manage.</p>
      </div>

      <div class="project-list">

        <article class="project-card">
          <div class="project-left">
            <div class="project-niche">Real Estate &amp; Condominiums</div>
            <h3>GHL CRM &amp; Lead Follow-Up System</h3>
            <p class="desc">Buyer inquiries were coming from Facebook Ads, website forms, and referrals, but follow-up depended heavily on manual tracking. Leads could wait hours for a response, with limited visibility across buyer stages.</p>
            <div class="project-tags">
              <span class="project-tag">GoHighLevel</span>
              <span class="project-tag">Zapier</span>
              <span class="project-tag">Landing Pages</span>
              <span class="project-tag">SEO/AEO</span>
            </div>
          </div>
          <div class="project-right">
            <ul class="deliverable-list">
              <li><span>Multi-stage GoHighLevel pipeline with automatic lead-source tagging and routing</span></li>
              <li><span>Instant SMS and email follow-up triggered by form submissions and stage changes</span></li>
              <li><span>Landing pages, contact forms, calendar booking, and inquiry routing</span></li>
              <li><span>SEO/AEO-ready page structure with service content, FAQs, and search-intent headings</span></li>
            </ul>
            <div class="outcome">
              <div class="outcome-label">Result · Under 1 minute</div>
              <p>Lead response time dropped from hours to under one minute. New inquiries are automatically captured, tagged, followed up, and tracked through the pipeline — reducing manual lead handling and helping prevent missed opportunities.</p>
            </div>
          </div>
        </article>

        <article class="project-card">
          <div class="project-left">
            <div class="project-niche">Business Coaching &amp; Content</div>
            <h3>Consultation Funnel + AI Content System</h3>
            <p class="desc">Weekly content production required long writing sessions, while lead magnets, consultation bookings, follow-up, and onboarding were handled through disconnected processes.</p>
            <div class="project-tags">
              <span class="project-tag">GHL Funnels</span>
              <span class="project-tag">AI Prompts</span>
              <span class="project-tag">WordPress</span>
              <span class="project-tag">SEO/AEO</span>
            </div>
          </div>
          <div class="project-right">
            <ul class="deliverable-list">
              <li><span>GoHighLevel consultation funnel, lead-magnet delivery, and automated booking workflow</span></li>
              <li><span>AI prompt system for articles, FAQs, emails, and client-facing content</span></li>
              <li><span>WordPress SEO/AEO content structure with publishing SOP and internal-linking plan</span></li>
              <li><span>CRM segmentation, onboarding automation, and automated lead follow-up</span></li>
            </ul>
            <div class="outcome">
              <div class="outcome-label">Result · 60%+ less content production time</div>
              <p>A repeatable AI-assisted workflow reduced weekly content production by more than 60%, while the connected CRM and booking system streamlined the path from initial interest to consultation.</p>
            </div>
          </div>
        </article>

        <article class="project-card">
          <div class="project-left">
            <div class="project-niche">Hospitality &amp; Photography</div>
            <h3>Website + Booking + CRM Automation</h3>
            <p class="desc">Customer inquiries, quotations, confirmations, scheduling, and booking coordination relied on repetitive manual WhatsApp communication that consumed several hours every day.</p>
            <div class="project-tags">
              <span class="project-tag">WordPress</span>
              <span class="project-tag">GoHighLevel</span>
              <span class="project-tag">n8n</span>
              <span class="project-tag">Ops Docs</span>
            </div>
          </div>
          <div class="project-right">
            <ul class="deliverable-list">
              <li><span>Conversion-focused website with inquiry forms and package presentation</span></li>
              <li><span>CRM flow covering inquiry → quote → confirmation → session → delivery</span></li>
              <li><span>Automated inquiry routing, booking confirmations, reminders, and follow-up</span></li>
              <li><span>Workflow documentation and SOP for client communication and booking handoff</span></li>
            </ul>
            <div class="outcome">
              <div class="outcome-label">Result · 2–3 hours/day eliminated</div>
              <p>The workflow replaced 2–3 hours of repetitive daily WhatsApp coordination. Confirmation, reminder, status tracking, and handover messages now run automatically from inquiry through delivery.</p>
            </div>
          </div>
        </article>

        <article class="project-card">
          <div class="project-left">
            <div class="project-niche">Credit Repair &amp; Funding</div>
            <h3>GoHighLevel + Website Systems Audit</h3>
            <p class="desc">The engagement began as a straightforward GoHighLevel cleanup. A deeper audit uncovered account-access risk, a broken public booking path, and a 46% missed-call rate.</p>
            <div class="project-tags">
              <span class="project-tag">GoHighLevel</span>
              <span class="project-tag">Account Audit</span>
              <span class="project-tag">SEO/AEO</span>
              <span class="project-tag">Systems Analysis</span>
            </div>
          </div>
          <div class="project-right">
            <ul class="deliverable-list">
              <li><span>14-page GoHighLevel review and 8-page SEO/AEO audit, ranked by business risk</span></li>
              <li><span>Account-access and permissions audit after unauthorized administrator-level access was identified</span></li>
              <li><span>Root-cause investigation and rebuild of the public booking widget after a recurring 500 error</span></li>
              <li><span>Phase 1 remediation scope of 66–70 hours tied directly to prioritized findings</span></li>
            </ul>
            <div class="outcome">
              <div class="outcome-label">Business impact</div>
              <p>What looked like routine cleanup became a prioritized remediation roadmap covering lead leakage, account security, booking failures, CRM structure, and search visibility.</p>
            </div>
            <a class="case-link" href="case-study-systems-audit.html">View full case study &rarr;</a>
          </div>
        </article>

        <article class="project-card">
          <div class="project-left">
            <div class="project-niche">Nonprofit &amp; Community Organization</div>
            <h3>AI-Assisted Social Content Automation</h3>
            <p class="desc">Recurring social content required multiple manual steps — selecting content, preparing graphics, applying branding, and publishing — even though the production process followed the same structure each time.</p>
            <div class="project-tags">
              <span class="project-tag">GoHighLevel</span>
              <span class="project-tag">n8n</span>
              <span class="project-tag">FastAPI</span>
              <span class="project-tag">OpenAI</span>
            </div>
          </div>
          <div class="project-right">
            <ul class="deliverable-list">
              <li><span>Google Sheets → n8n → OpenAI → brand overlay → Facebook publishing pipeline</span></li>
              <li><span>23 custom fields and 11 documented workflows mapped to the operating process</span></li>
              <li><span>Automated image generation, branding, publishing integration, and repeatable workflow logic</span></li>
              <li><span>Documentation designed so routine content operations remain editable without a developer</span></li>
            </ul>
            <div class="outcome">
              <div class="outcome-label">Result · From manual process to repeatable system</div>
              <p>Recurring content now moves through a structured production pipeline with significantly less manual handling, while branding and publishing remain controlled through repeatable automation.</p>
            </div>
            <a class="case-link" href="case-study-automation-build.html">View full case study &rarr;</a>
          </div>
        </article>

      </div>
    </div>
  </section>

'''

s = s[:start] + projects + s[end:]
p.write_text(s, encoding='utf-8')
print('Portfolio homepage refreshed successfully.')
