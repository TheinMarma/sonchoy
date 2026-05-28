import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/service-agreement-generator')

export default function Page() {
  return <Tool />
}
