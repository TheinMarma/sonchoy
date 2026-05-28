import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/csv-to-pdf-converter')

export default function Page() {
  return <Tool />
}
