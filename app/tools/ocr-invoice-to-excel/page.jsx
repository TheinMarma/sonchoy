import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/ocr-invoice-to-excel')

export default function Page() {
  return <Tool />
}
