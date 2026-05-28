import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/add-watermark-to-invoice')

export default function Page() {
  return <Tool />
}
