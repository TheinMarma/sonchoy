import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/bank-statement-analyzer')

export default function Page() {
  return <Tool />
}
