import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('/tools/password-protect-financial-pdfs')

export default function Page() {
  return <Tool />
}
