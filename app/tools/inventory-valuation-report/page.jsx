import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/inventory-valuation-report')

export default function Page() {
  return <Tool />
}
