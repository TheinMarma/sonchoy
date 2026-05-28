import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/income-tax-estimator')

export default function Page() {
  return <Tool />
}
