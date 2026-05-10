import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'
import BackToTop from './components/BackToTop'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'

/* Lazy-load tool pages — keeps pdf.js + xlsx out of the homepage bundle. */
const InvoicePdfToExcelPage = lazy(() => import('./pages/InvoicePdfToExcelPage'))
const InvoiceGeneratorPage  = lazy(() => import('./pages/InvoiceGeneratorPage'))

function ToolPageFallback() {
  return (
    <div className="flex min-h-[480px] items-center justify-center px-6">
      <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-500">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-crimson-500 border-t-transparent" />
        Loading tool…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CursorGlow />
      <TopNav />
      <Suspense fallback={<ToolPageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/tools/invoice-pdf-to-excel"
            element={<InvoicePdfToExcelPage />}
          />
          <Route
            path="/tools/invoice-generator"
            element={<InvoiceGeneratorPage />}
          />
        </Routes>
      </Suspense>
      <Footer />
      <BackToTop />
    </BrowserRouter>
  )
}
