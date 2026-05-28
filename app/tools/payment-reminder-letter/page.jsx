import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/payment-reminder-letter')

export default function Page() {
  return <Tool />
}
