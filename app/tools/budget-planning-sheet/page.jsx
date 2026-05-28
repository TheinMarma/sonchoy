import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/budget-planning-sheet')

export default function Page() {
  return <Tool />
}
