import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/banking-transaction-summary')

export default function Page() {
  return <Tool />
}
