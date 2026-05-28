import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/monthly-loan-payment')

export default function Page() {
  return <Tool />
}
