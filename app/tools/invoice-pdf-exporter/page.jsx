import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/invoice-pdf-exporter')

export default function Page() {
  return <Tool />
}
