// Starting points for the AI Prompt Builder. Plain data: edit or add entries freely.
// Text in [square brackets] is a placeholder for the visitor to replace.

export const TONES = ['Professional', 'Friendly and conversational', 'Direct and concise', 'Persuasive', 'Technical and precise', 'Empathetic'];

export const TEMPLATES = [
  {
    id: 'business-offer-email',
    category: 'Business and marketing',
    name: 'Sales email for a service offer',
    fields: {
      role: 'an experienced B2B email copywriter',
      objective: 'Write a short outreach email that introduces [service] to [type of business] and asks for a 15-minute call.',
      context: '[Company name] helps [audience] with [main result]. The reader has not heard of us before.',
      input: 'Service details: [paste details]\nProof or results we can mention: [paste proof]',
      instructions: 'Open with a specific problem the reader recognises\nExplain the service in one or two sentences\nInclude one piece of proof\nEnd with a single clear call to action',
      constraints: 'Maximum 130 words\nNo exaggerated claims or invented statistics\nNo jargon',
      tone: 'Friendly and conversational',
      format: 'A subject line, then the email body in plain text.'
    }
  },
  {
    id: 'business-competitor-summary',
    category: 'Business and marketing',
    name: 'Competitor comparison summary',
    fields: {
      role: 'a marketing strategist',
      objective: 'Compare [my business] with the competitors listed and identify where we can stand out.',
      context: 'We sell [product or service] to [audience] in [location or market].',
      input: 'Our offer: [paste]\nCompetitor notes or website copy: [paste]',
      instructions: 'Summarise each competitor in two sentences\nList strengths and weaknesses for each\nRecommend three positioning angles for us',
      constraints: 'Use only the information provided\nSay clearly when information is missing instead of guessing',
      tone: 'Direct and concise',
      format: 'A comparison table followed by a short list of recommendations.'
    }
  },
  {
    id: 'seo-content-brief',
    category: 'SEO and content',
    name: 'SEO content brief',
    fields: {
      role: 'an SEO content strategist',
      objective: 'Create a content brief for a page targeting the keyword "[keyword]".',
      context: 'The website is for [business type] serving [audience]. The page should help visitors [goal].',
      input: 'Related keywords: [paste]\nCompeting pages or notes: [paste]',
      instructions: 'Identify the search intent\nPropose a title tag and meta description\nOutline the H2 and H3 headings\nList questions the page should answer\nSuggest internal links to include',
      constraints: 'Do not promise rankings\nKeep the title tag under 60 characters and the meta description under 160',
      tone: 'Professional',
      format: 'A structured brief with headed sections and bullet points.'
    }
  },
  {
    id: 'seo-page-rewrite',
    category: 'SEO and content',
    name: 'Rewrite a page for clarity and search intent',
    fields: {
      role: 'a web copy editor with SEO experience',
      objective: 'Rewrite the page copy so it is clearer and better matches what searchers want.',
      context: 'The page is the [page name] for [business]. Primary keyword: [keyword].',
      input: 'Current copy:\n[paste copy]',
      instructions: 'Keep every factual claim from the original\nLead with the main benefit\nUse short paragraphs and descriptive subheadings\nAdd a clear call to action',
      constraints: 'Do not add facts, prices or statistics that are not in the original\nNo keyword stuffing',
      tone: 'Professional',
      format: 'The rewritten copy with headings, followed by a bullet list of what changed.'
    }
  },
  {
    id: 'crm-follow-up-sequence',
    category: 'CRM automation',
    name: 'Lead follow-up sequence',
    fields: {
      role: 'a CRM automation specialist who writes follow-up messaging',
      objective: 'Design a follow-up sequence for new leads who submit the [form name] form but do not book a call.',
      context: 'Business: [business type]. CRM: [GoHighLevel or other]. Channels available: [SMS, email].',
      input: 'Offer details: [paste]\nBooking link placeholder: [link]',
      instructions: 'Plan the timing of each step over 7 days\nWrite the copy for each message\nDefine the stop conditions, such as a booking or a reply\nNote which steps need consent for SMS',
      constraints: 'SMS messages under 300 characters\nNo pressure tactics\nInclude opt-out wording where required',
      tone: 'Friendly and conversational',
      format: 'A table with columns: step, delay, channel, message, stop condition.'
    }
  },
  {
    id: 'crm-pipeline-design',
    category: 'CRM automation',
    name: 'Pipeline and stage design',
    fields: {
      role: 'a CRM consultant',
      objective: 'Design a sales pipeline with clear stages and the automation that should run at each stage.',
      context: 'Business: [business type]. Sales process today: [describe]. Team size: [number].',
      input: 'Lead sources: [list]\nCurrent problems: [list]',
      instructions: 'Define each stage and its entry and exit criteria\nList the automation triggered at each stage\nIdentify the fields needed to support reporting\nFlag any manual steps that must stay manual',
      constraints: 'Keep to seven stages or fewer\nDo not assume tools we have not listed',
      tone: 'Direct and concise',
      format: 'A numbered list of stages, each with criteria, automation and required fields.'
    }
  },
  {
    id: 'agent-system-prompt',
    category: 'AI agent configuration',
    name: 'System prompt for a customer-facing AI agent',
    fields: {
      role: 'a prompt engineer who writes system prompts for customer-facing AI agents',
      objective: 'Write a system prompt for an AI agent that [answers enquiries, qualifies leads, books appointments] for [business].',
      context: 'Business hours: [hours]. Services: [list]. Channel: [voice, chat, SMS].',
      input: 'Knowledge the agent may use: [paste]\nQuestions it must ask: [list]',
      instructions: 'Define the agent identity and scope\nList the steps of a typical conversation\nState when to hand over to a person\nDescribe how to handle questions outside its knowledge',
      constraints: 'The agent must never invent prices, availability or policies\nThe agent must not give legal, medical or financial advice\nKeep replies short enough for the channel',
      tone: 'Professional',
      format: 'A system prompt with headed sections: Identity, Goals, Conversation flow, Rules, Escalation.'
    }
  },
  {
    id: 'agent-test-cases',
    category: 'AI agent configuration',
    name: 'Test cases for an AI agent',
    fields: {
      role: 'a QA analyst who tests conversational AI',
      objective: 'Create test conversations that check whether the agent follows its instructions.',
      context: 'The agent is used for [purpose] by [business].',
      input: 'Agent instructions:\n[paste the system prompt]',
      instructions: 'Cover normal requests, edge cases and attempts to push the agent off-topic\nState the expected behaviour for each test\nMark which tests are critical',
      constraints: 'At least 12 test cases\nBase expected behaviour only on the instructions provided',
      tone: 'Technical and precise',
      format: 'A table with columns: ID, user message, expected behaviour, priority.'
    }
  },
  {
    id: 'web-landing-page',
    category: 'Website development',
    name: 'Landing page section plan',
    fields: {
      role: 'a conversion-focused web designer and developer',
      objective: 'Plan the sections and copy for a landing page that gets visitors to [book a call, request a quote].',
      context: 'Business: [business]. Audience: [audience]. Traffic source: [ads, search, email].',
      input: 'Offer: [paste]\nTestimonials or proof: [paste]',
      instructions: 'List the sections in order with the purpose of each\nWrite a headline and supporting line for each section\nRecommend where the call to action appears\nNote accessibility and mobile considerations',
      constraints: 'One primary call to action\nDo not invent testimonials or numbers',
      tone: 'Persuasive',
      format: 'A numbered outline. Each section has: purpose, headline, supporting copy, call to action.'
    }
  },
  {
    id: 'web-code-review',
    category: 'Website development',
    name: 'Review HTML, CSS or JavaScript',
    fields: {
      role: 'a senior front-end developer',
      objective: 'Review the code for bugs, accessibility problems and maintainability.',
      context: 'The code is part of [describe the page or feature]. Browser support: [list].',
      input: 'Code:\n[paste code]',
      instructions: 'List problems in order of severity\nExplain why each one matters\nShow a corrected snippet for each problem\nPoint out anything that is unclear instead of guessing',
      constraints: 'Do not rewrite code that already works\nNo new libraries unless essential',
      tone: 'Technical and precise',
      format: 'A numbered list of findings, each with severity, explanation and fix.'
    }
  },
  {
    id: 'workflow-debug',
    category: 'Workflow troubleshooting',
    name: 'Diagnose a broken automation',
    fields: {
      role: 'an automation engineer experienced with n8n, Zapier, Make and GoHighLevel workflows',
      objective: 'Find the most likely cause of the workflow failure and give steps to confirm and fix it.',
      context: 'Platform: [platform]. The workflow should [expected behaviour]. Instead it [actual behaviour].',
      input: 'Workflow steps: [describe or paste]\nError message or log: [paste]\nWhat has been tried: [list]',
      instructions: 'List possible causes from most to least likely\nGive a test that confirms or rules out each cause\nProvide the fix for the most likely cause\nSuggest a safeguard to stop it happening again',
      constraints: 'Ask for missing information instead of assuming\nDo not suggest deleting data or disabling the workflow in production without a warning',
      tone: 'Technical and precise',
      format: 'Numbered causes with a test and a fix for each, then a short prevention checklist.'
    }
  },
  {
    id: 'workflow-webhook-mapping',
    category: 'Workflow troubleshooting',
    name: 'Check a webhook or API field mapping',
    fields: {
      role: 'an integration developer',
      objective: 'Check the field mapping between the incoming payload and the destination system and point out mismatches.',
      context: 'Source: [system]. Destination: [system]. The integration is used to [purpose].',
      input: 'Sample payload:\n[paste JSON with personal data removed]\nDestination fields: [list]',
      instructions: 'Map each source field to a destination field\nFlag missing, renamed or wrongly typed fields\nRecommend handling for empty values and duplicates',
      constraints: 'Use only fields that appear in the sample\nRemind me not to share secrets or personal data',
      tone: 'Technical and precise',
      format: 'A mapping table, followed by a list of issues and recommended fixes.'
    }
  }
];
