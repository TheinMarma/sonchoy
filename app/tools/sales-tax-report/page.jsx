import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/sales-tax-report')

export default function Page() {
  return <Tool />
}
