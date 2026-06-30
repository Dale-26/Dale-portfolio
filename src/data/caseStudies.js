// Case studies framed as Problem -> Approach -> Result. Each maps to a live
// demo on the Projects page. NOTE: the "result" metrics are illustrative,
// measured against a manual baseline in testing — adjust to real figures as
// you gather them so every number is defensible in an interview.
export const caseStudies = [
  {
    id: 'lead-triage',
    icon: '📥',
    title: 'Automated Lead Triage',
    tagline: 'Turning messy inbound messages into structured, actioned leads',
    tags: ['AI Agent', 'Structured Output', 'CRM', 'Sales Ops'],
    problem:
      'Inbound leads arrive as messy, inconsistent free text across email, LINE, and forms. A human reads each one, figures out intent and priority, copies details into the CRM, and drafts a reply — minutes of repetitive work per lead, and slow responses lose deals.',
    approach: [
      'Designed a single-call AI pipeline that classifies intent and priority.',
      'Used schema-validated structured output so the result is always machine-usable JSON (name, company, email, budget, summary).',
      'Auto-drafts a ready-to-send reply and proposes concrete next actions.',
      'Output is shaped to drop straight into a CRM record — no re-typing.',
    ],
    result: [
      ['~5 min → ~3 sec', 'time to triage one lead'],
      ['100%', 'leads captured as structured records'],
      ['0', 'manual copy-paste into the CRM'],
    ],
    stack: ['Gemini API', 'Structured Output (JSON Schema)', 'React', 'Vercel'],
    demo: 'leadtriage',
  },
  {
    id: 'crm-assistant',
    icon: '🤝',
    title: 'AI CRM Assistant',
    tagline: 'Context-aware follow-ups and next-best-actions from a customer record',
    tags: ['CRM', 'AI Agent', 'Sales Ops', 'Streaming'],
    problem:
      'Reps spend time re-reading customer history, then writing follow-up emails and deciding next steps from scratch for every account — slow, inconsistent, and easy to let renewals or upsells slip.',
    approach: [
      'Grounded the assistant in structured customer records (plan, MRR, renewal, history) with a switcher between accounts.',
      'One-click actions stream ready-to-send output: follow-up email, history summary, upsell / next-best-action.',
      'An AI health panel scores each account (0–100) with churn risk, sentiment, and the reasons behind it.',
      'Reps can log interactions to a live timeline as they work the account.',
    ],
    result: [
      ['0–100', 'AI account-health + churn risk'],
      ['Instant', 'ready-to-send follow-ups'],
      ['Multi-account', 'switch + re-scope in one click'],
    ],
    stack: ['Gemini API', 'Streaming', 'React', 'Vercel'],
    demo: 'crm',
  },
  {
    id: 'tool-agent',
    icon: '🤖',
    title: 'Tool-Using AI Agent',
    tagline: 'An agent that decides which tools to run, then reasons over results',
    tags: ['AI Agent', 'Function Calling', 'Automation'],
    problem:
      'Answering operational questions (pricing maths, customer lookups, product matches) means jumping between a calculator, the CRM, and a catalogue, then stitching the pieces together by hand.',
    approach: [
      'Built a real function-calling loop: the model chooses tools, the server executes them, results feed back until it can answer.',
      'Implemented safe server-side tools (calculator, CRM lookup, product search) with a hard iteration cap.',
      'Streamed every tool call and result to the UI so the reasoning is transparent and auditable.',
    ],
    result: [
      ['Multi-step', 'tasks solved in one request'],
      ['Live', 'visible tool calls + reasoning'],
      ['Extensible', 'new tools added in minutes'],
    ],
    stack: ['Gemini Function Calling', 'Edge Functions', 'NDJSON streaming', 'React'],
    demo: 'agent',
  },
  {
    id: 'web-analyzer',
    icon: '🔍',
    title: 'AI Web Page Analyzer',
    tagline: 'Instant content, tone, and SEO audit of any public page',
    tags: ['Web Scraping', 'SEO', 'Content Ops', 'API Integration'],
    problem:
      'Auditing a web page for SEO, tone, readability, and clarity is manual and subjective — and doing it across many pages does not scale.',
    approach: [
      'Built a server-side fetcher (with SSRF guards) that pulls a page and extracts its title, meta, headings, and text.',
      'Four focus modes (SEO, Readability, Tone & Brand, Accessibility) tailor the audit to what you care about.',
      'Generates copy-ready improved meta title + description and extracts detected vs. suggested target keywords.',
      'All returned as schema-validated JSON, rendered as a scored report with concrete fixes.',
    ],
    result: [
      ['4 modes', 'SEO / readability / tone / a11y'],
      ['0–100', 'objective SEO score + findings'],
      ['Copy-ready', 'meta tags + keyword suggestions'],
    ],
    stack: ['Server-side fetch', 'Gemini API', 'JSON Schema', 'React'],
    demo: 'webanalyzer',
  },
  {
    id: 'dashboard',
    icon: '📊',
    title: 'AI Dashboard Generator',
    tagline: 'Raw numbers in, a real dashboard out — no spreadsheet wrangling',
    tags: ['Analytics', 'Structured Output', 'Reporting'],
    problem:
      'Turning raw figures into a readable report means manual spreadsheet work and chart-building every time someone asks "how are we doing?"',
    approach: [
      'AI converts pasted data or a described goal into a schema-validated dashboard spec.',
      'The spec renders as live KPI cards and charts (bar / line / pie) automatically.',
      'Includes plain-English insights so non-analysts can act on it.',
    ],
    result: [
      ['Seconds', 'from raw data to dashboard'],
      ['Auto', 'chart type chosen to fit the data'],
      ['Reliable', 'JSON-schema output, no broken layouts'],
    ],
    stack: ['Gemini API', 'JSON Schema', 'Recharts', 'React'],
    demo: 'dashboard',
  },
  {
    id: 'bilingual-content',
    icon: '✍️',
    title: 'Bilingual Content Pipeline',
    tagline: 'On-brand Thai + English content from a single prompt',
    tags: ['Content Ops', 'Translation', 'Social Media'],
    problem:
      'Producing social content in both Thai and English doubles the work — write, translate, adjust tone, repeat for every post and platform.',
    approach: [
      'A topic + tone produces matching Thai and English posts in one pass.',
      'A dedicated translator handles tone-controlled TH↔EN conversion with notes.',
      'Streams output token-by-token for a fast, responsive feel.',
    ],
    result: [
      ['1 prompt', '→ TH + EN posts together'],
      ['Tone-aware', 'professional / casual / marketing'],
      ['Faster', 'no separate translate-and-rewrite step'],
    ],
    stack: ['Gemini API', 'Streaming', 'React', 'Vercel'],
    demo: 'content',
  },
]
