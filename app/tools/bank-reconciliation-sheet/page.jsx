import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/bank-reconciliation-sheet')

export default function Page() {
  return <Tool />
}
