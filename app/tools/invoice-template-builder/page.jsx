import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/invoice-template-builder')

export default function Page() {
  return <Tool />
}
