import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/client-contract-generator')

export default function Page() {
  return <Tool />
}
