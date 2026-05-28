import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/cash-flow-statement')

export default function Page() {
  return <Tool />
}
