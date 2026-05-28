import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/revenue-report')

export default function Page() {
  return <Tool />
}
