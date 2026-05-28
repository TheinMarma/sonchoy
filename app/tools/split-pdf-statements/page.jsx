import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/split-pdf-statements')

export default function Page() {
  return <Tool />
}
