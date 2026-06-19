// Document parser - extracts text from PDF, DOCX, and TXT files

// Import the PDF.js worker as a local asset URL (Vite bundles it into dist)
// This avoids fetching from CDN which can fail due to CSP, offline usage, or version mismatch
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export async function parseDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return parsePDF(file)
  } else if (ext === 'docx') {
    return parseDOCX(file)
  } else if (ext === 'txt' || ext === 'md') {
    return parseTXT(file)
  } else {
    throw new Error(`Unsupported file format: .${ext}. Please upload PDF, DOCX, TXT, or MD.`)
  }
}

async function parsePDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  // Use the locally bundled worker (copied to dist by Vite) — no CDN dependency
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const texts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    texts.push(pageText)
  }

  return texts.join('\n')
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function parseTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Normalize extracted text for consistent processing
 */
export function normalizeText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove more than 3 consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Create ATS-view: strip formatting artifacts, normalize text
 */
export function createAtsView(rawText: string): string {
  let text = rawText

  // Remove common PDF artifacts
  text = text.replace(/\u2022/g, '• ')           // bullet points
  text = text.replace(/\u2013|\u2014/g, '-')      // dashes
  text = text.replace(/\u2018|\u2019/g, "'")      // smart quotes
  text = text.replace(/\u201C|\u201D/g, '"')      // smart double quotes
  text = text.replace(/[^\x00-\x7F]/g, (char) => {
    // Keep common unicode like accented chars, return space for unknown
    if (char.charCodeAt(0) > 127 && char.charCodeAt(0) < 256) return char
    return ' '
  })

  // Normalize whitespace
  text = normalizeText(text)

  return text
}

/**
 * Detect potential ATS formatting issues in the parsed text
 */
export function detectFormattingIssues(rawText: string): string[] {
  const issues: string[] = []

  // Short text might indicate parsing failure
  if (rawText.length < 200) {
    issues.push('Very little text was extracted — the resume may use image-based content or heavy formatting that ATS cannot parse.')
  }

  // Check for garbled characters
  const garbledRatio = (rawText.match(/[^\x00-\x7F]/g) || []).length / rawText.length
  if (garbledRatio > 0.05) {
    issues.push('The document contains many special characters that may not be parsed correctly by ATS.')
  }

  // Check for table-like patterns (multiple tabs/spaces in rows)
  if (/\t.*\t/.test(rawText)) {
    issues.push('Tables detected — ATS systems often cannot parse tables correctly.')
  }

  // Check for headers/footers (repeated short lines at start/end)
  const lines = rawText.split('\n').filter(l => l.trim())
  if (lines.length > 5) {
    const firstLineCount = lines.filter(l => l.trim() === lines[0].trim()).length
    if (firstLineCount > 2) {
      issues.push('Repeated header/footer content detected — this can confuse ATS parsers.')
    }
  }

  return issues
}
