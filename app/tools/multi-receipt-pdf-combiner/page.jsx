import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/multi-receipt-pdf-combiner')

export default function Page() {
  return <Tool />
}
