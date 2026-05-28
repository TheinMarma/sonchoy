import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/digital-signature-scan-to-pdf')

export default function Page() {
  return <Tool />
}
