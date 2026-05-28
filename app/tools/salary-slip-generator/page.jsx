import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/salary-slip-generator')

export default function Page() {
  return <Tool />
}
