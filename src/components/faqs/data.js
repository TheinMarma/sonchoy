/* Shared FAQ data used by every variant. */

export const FAQS = [
  {
    cat: 'pricing',
    catLabel: 'Pricing',
    q: 'Is Sonchoy actually free?',
    a: 'Yes. Every generator and extractor on this page is free, with no watermarks and no signup. You only pay if you upgrade to pdfFiller for premium workflows like batch OCR or multi-party e-signing.',
  },
  {
    cat: 'privacy',
    catLabel: 'Privacy',
    q: 'How do you handle financial data?',
    a: 'Files are encrypted in transit, processed in isolated single-tenant workers, and deleted from our servers within an hour. We never read, train on, or share your invoices, ledgers, or client data.',
  },
  {
    cat: 'tax',
    catLabel: 'Tax & regions',
    q: 'Can I use Sonchoy in my country / for my tax regime?',
    a: 'Yes — invoice and tax generators support GST (India), VAT (EU/UK/GCC), Sales Tax (US/CA), and unstructured/no-tax modes. Currency, date format, and number locale follow your selection.',
  },
  {
    cat: 'pricing',
    catLabel: 'Pricing',
    q: "What's the limit on the free tier?",
    a: 'Files up to 25 MB and one document at a time. If you regularly batch-generate or extract from large statements, the pdfFiller trial removes both caps.',
  },
  {
    cat: 'account',
    catLabel: 'Account',
    q: 'Do I need an account or login?',
    a: "No. Sonchoy is intentionally signin-free — fill the form, export the PDF, walk away. We don't persist your work, so save your output before closing the tab.",
  },
  {
    cat: 'output',
    catLabel: 'Output',
    q: 'Can outputs be edited after download?',
    a: 'Yes. Generators export PDF + a matching .xlsx or .docx where it makes sense, so you can tweak in your tool of choice. Re-importing for a new version is one click.',
  },
]

export const CATEGORIES = [
  { id: 'all',     label: 'All' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'tax',     label: 'Tax & regions' },
  { id: 'account', label: 'Account' },
  { id: 'output',  label: 'Output' },
]
