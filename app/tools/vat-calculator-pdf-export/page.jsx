import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/vat-calculator-pdf-export')

export default function Page() {
  return <Tool />
}
