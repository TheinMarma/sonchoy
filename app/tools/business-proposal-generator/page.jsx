import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/business-proposal-generator')

export default function Page() {
  return <Tool />
}
