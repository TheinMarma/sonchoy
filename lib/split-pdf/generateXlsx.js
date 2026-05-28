import * as XLSX from 'xlsx'
import { findSplitMode, findQuality } from './compute'

/** Manifest XLSX listing the split plan — handy for archiving / handoff. */
export function generateSplitManifestXlsx(data, ranges, sourceMeta) {
  const mode = findSplitMode(data.splitModeId)
  const quality = findQuality(data.qualityId)

  const wb = XLSX.utils.book_new()

  const summary = [
    ['Split Plan'],
    [],
    ['Source file',     sourceMeta?.name || ''],
    ['Source pages',    sourceMeta?.pages || ''],
    ['Source size',     sourceMeta?.size || ''],
    [],
    ['Mode',            mode.label],
    ['Quality',         quality.label],
    ['Page numbers',    data.includePageNumbers ? 'On' : 'Off'],
    ['File-name base',  data.baseName || ''],
    [],
    ['Parts',           ranges.length],
    ['Total output pages', ranges.reduce((s, r) => s + (r.end - r.start + 1), 0)],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  const planRows = [
    ['#', 'Label', 'Start page', 'End page', 'Pages', 'Output filename'],
    ...ranges.map((r, i) => [
      i + 1, r.label, r.start, r.end, r.end - r.start + 1,
      `${(data.baseName || 'split').replace(/[^a-z0-9-]+/gi, '-')}__${String(i + 1).padStart(2, '0')}__${(r.label || `Part-${i+1}`).replace(/[^\w-]+/g, '-')}.pdf`,
    ]),
  ]
  const wsPlan = XLSX.utils.aoa_to_sheet(planRows)
  wsPlan['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan')

  XLSX.writeFile(wb, `split-plan-${(data.baseName || 'output').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`)
}
