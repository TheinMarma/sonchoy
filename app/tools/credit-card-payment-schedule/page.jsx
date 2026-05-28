import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/credit-card-payment-schedule')

export default function Page() {
  return <Tool />
}
