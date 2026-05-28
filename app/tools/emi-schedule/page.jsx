import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/emi-schedule')

export default function Page() {
  return <Tool />
}
