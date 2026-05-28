import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/reorder-pdf-pages')

export default function Page() {
  return <Tool />
}
