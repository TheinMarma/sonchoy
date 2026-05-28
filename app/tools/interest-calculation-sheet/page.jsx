import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/interest-calculation-sheet')

export default function Page() {
  return <Tool />
}
