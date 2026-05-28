import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/transaction-history-pdf-to-csv')

export default function Page() {
  return <Tool />
}
