import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/invoice-pdf-to-excel')

export default function Page() {
  return <Tool />
}
