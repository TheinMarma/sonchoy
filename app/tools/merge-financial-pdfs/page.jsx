import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/merge-financial-pdfs')

export default function Page() {
  return <Tool />
}
