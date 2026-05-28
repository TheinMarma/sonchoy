import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/savings-interest-report')

export default function Page() {
  return <Tool />
}
