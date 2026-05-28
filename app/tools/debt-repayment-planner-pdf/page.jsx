import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/debt-repayment-planner-pdf')

export default function Page() {
  return <Tool />
}
