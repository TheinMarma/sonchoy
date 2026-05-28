import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/rotate-scanned-documents')

export default function Page() {
  return <Tool />
}
