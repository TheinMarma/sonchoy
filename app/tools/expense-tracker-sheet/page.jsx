import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/expense-tracker-sheet')

export default function Page() {
  return <Tool />
}
