import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/pdf-to-csv')

export default function Page() {
  return <Tool />
}
