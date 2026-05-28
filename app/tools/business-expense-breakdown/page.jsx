import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/business-expense-breakdown')

export default function Page() {
  return <Tool />
}
