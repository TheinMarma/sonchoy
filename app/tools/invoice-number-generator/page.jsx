import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/invoice-number-generator')

export default function Page() {
  return <Tool />
}
