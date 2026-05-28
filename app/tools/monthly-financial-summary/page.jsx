import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/monthly-financial-summary')

export default function Page() {
  return <Tool />
}
