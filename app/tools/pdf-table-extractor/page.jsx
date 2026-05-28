import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/pdf-table-extractor')

export default function Page() {
  return <Tool />
}
