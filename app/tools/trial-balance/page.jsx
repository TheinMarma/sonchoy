import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/trial-balance')

export default function Page() {
  return <Tool />
}
