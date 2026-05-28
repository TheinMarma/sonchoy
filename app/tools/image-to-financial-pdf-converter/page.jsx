import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/image-to-financial-pdf-converter')

export default function Page() {
  return <Tool />
}
