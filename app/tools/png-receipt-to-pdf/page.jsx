import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/png-receipt-to-pdf')

export default function Page() {
  return <Tool />
}
