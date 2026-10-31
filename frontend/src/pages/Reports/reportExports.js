import XLSX from 'xlsx-js-style'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const reportColumns = (rows) => [...new Set(rows.flatMap((row) => Object.keys(row || {})))]

export const columnLabel = (key) => key
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())

function cellValue(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().replace('T', ' ').slice(0, 19)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function safeFilename(value) {
  return String(value || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'report'
}

function filtersLabel(filters = {}) {
  return Object.entries(filters)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${columnLabel(key)}: ${value}`)
    .join(' | ') || 'None'
}

export function createReportExport(report, format) {
  const rows = report.data || []
  const columns = reportColumns(rows)
  const fileBase = `${safeFilename(report.report_name)}-${new Date().toISOString().slice(0, 10)}`

  if (format === 'csv') {
    const escape = (value) => `"${cellValue(value).replace(/"/g, '""')}"`
    const content = [columns.map(columnLabel), ...rows.map((row) => columns.map((key) => row[key]))]
      .map((row) => row.map(escape).join(','))
      .join('\r\n')
    return {
      blob: new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }),
      filename: `${fileBase}.csv`,
    }
  }

  if (format === 'xlsx') {
    const sheetRows = [
      [report.report_name],
      [`Generated: ${new Date(report.generated_at || Date.now()).toLocaleString()}`],
      [`Applied filters: ${filtersLabel(report.filters)}`],
      [`Records: ${report.summary?.record_count ?? rows.length}`],
      [],
      columns.map(columnLabel),
      ...rows.map((row) => columns.map((key) => row[key] ?? '')),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)
    const lastColumn = Math.max(columns.length - 1, 0)
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } }]
    worksheet['!freeze'] = { xSplit: 0, ySplit: 6 }
    worksheet['!cols'] = columns.map((key) => ({ wch: Math.min(Math.max(columnLabel(key).length + 4, 14), 34) }))
    for (let column = 0; column < Math.max(columns.length, 1); column += 1) {
      const address = XLSX.utils.encode_cell({ r: 5, c: column })
      if (worksheet[address]) {
        worksheet[address].s = {
          fill: { fgColor: { rgb: '17324D' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { vertical: 'center' },
        }
      }
    }
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true })
    return {
      blob: new Blob([bytes], { type: XLSX_MIME }),
      filename: `${fileBase}.xlsx`,
    }
  }

  if (format === 'pdf') {
    const document = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' })
    document.setFont('helvetica', 'bold')
    document.setFontSize(16)
    document.text(report.report_name || 'Report', 14, 18)
    document.setFont('helvetica', 'normal')
    document.setFontSize(9)
    document.text(`Generated: ${new Date(report.generated_at || Date.now()).toLocaleString()}`, 14, 25)
    document.text(`Filters: ${filtersLabel(report.filters)}`.slice(0, 180), 14, 31)
    document.text(`Records: ${report.summary?.record_count ?? rows.length}`, 14, 37)
    autoTable(document, {
      startY: 43,
      head: [columns.map(columnLabel)],
      body: rows.map((row) => columns.map((key) => cellValue(row[key]))),
      styles: { fontSize: columns.length > 8 ? 6 : 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [23, 50, 77], textColor: [255, 255, 255] },
    })
    const pageCount = document.getNumberOfPages()
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      document.setPage(pageNumber)
      document.setFontSize(8)
      document.setTextColor(100)
      document.text(`Page ${pageNumber} of ${pageCount}`, 14, document.internal.pageSize.getHeight() - 8)
    }
    return { blob: document.output('blob'), filename: `${fileBase}.pdf` }
  }

  throw new Error('Unsupported report export format.')
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}