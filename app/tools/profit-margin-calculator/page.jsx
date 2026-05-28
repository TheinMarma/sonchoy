import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/profit-margin-calculator')

export default function Page() {
  return <Tool />
}
