import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/ocr-receipt-to-text')

export default function Page() {
  return <Tool />
}
