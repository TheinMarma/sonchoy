import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/late-payment-notice')

export default function Page() {
  return <Tool />
}
