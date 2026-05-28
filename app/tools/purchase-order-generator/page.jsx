import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/purchase-order-generator')

export default function Page() {
  return <Tool />
}
