import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/compress-invoice-pdfs')

export default function Page() {
  return <Tool />
}
