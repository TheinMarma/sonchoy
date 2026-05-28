import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/financial-report-generator')

export default function Page() {
  return <Tool />
}
