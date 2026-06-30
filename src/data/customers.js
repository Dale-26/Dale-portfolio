// Sample CRM customers for the CRM Assistant demo.
export const customers = [
  {
    id: 'niran',
    name: 'Niran Suksai',
    company: 'Bangkok Fresh Co.',
    plan: 'Premium',
    status: 'Active · Premium plan',
    mrr: 4500,
    renewal: 'in 6 weeks',
    history: [
      'Signed up 8 months ago on the Premium plan.',
      'Logged 2 support tickets about API rate limits (both resolved).',
      'Last contact: 3 weeks ago — asked about adding 2 team seats.',
      'Renewal due in 6 weeks.',
    ],
  },
  {
    id: 'som',
    name: 'Som Charoen',
    company: 'Chiang Mai Textiles',
    plan: 'Starter',
    status: 'Active · Starter plan',
    mrr: 900,
    renewal: 'in 2 weeks',
    history: [
      'Signed up 3 months ago on the Starter plan.',
      'Opened a ticket last week: frustrated that exports are manual.',
      'Mentioned a competitor reached out with a cheaper offer.',
      'Renewal due in 2 weeks — no response to last 2 emails.',
    ],
  },
  {
    id: 'lek',
    name: 'Lek Wong',
    company: 'Phuket Tours Ltd.',
    plan: 'Growth',
    status: 'Active · Growth plan',
    mrr: 2200,
    renewal: 'in 11 weeks',
    history: [
      'Signed up 14 months ago, upgraded Starter → Growth 5 months ago.',
      'Power user: logs in daily, uses the automation features heavily.',
      'Left positive feedback after the last release.',
      'Asked twice about an enterprise / multi-brand plan.',
    ],
  },
]
