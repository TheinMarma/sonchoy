import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/break-even-analysis')

export default function Page() {
  return <Tool />
}
