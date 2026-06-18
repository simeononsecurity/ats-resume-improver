import { downloadBlob } from './utils'
import type { ResumeData } from '../types'
import { getSectionOrder, SECTION_TITLES } from './resumeTypeDetector'
import type { SectionKey } from './resumeTypeDetector'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wordWrap(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text]
  const words = text.split(' ')
  const result: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLen) {
      current = current ? current + ' ' + word : word
    } else {
      if (current) result.push(current)
      current = word
    }
  }
  if (current) result.push(current)
  return result
}

// ─── TXT Export ────────────────────────────────────────────────────────────────

export function exportTXT(content: string, fileName = 'resume-ats.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, fileName)
}

export function buildTXTFromData(resumeData: ResumeData, customOrder?: SectionKey[]): string {
  const order = customOrder ?? getSectionOrder(resumeData)
  const SEP = '═'.repeat(60)
  const DIV = '─'.repeat(60)
  const lines: string[] = []

  lines.push(SEP)
  if (resumeData.name) lines.push(resumeData.name.toUpperCase())
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) lines.push(contact.join('  |  '))
  lines.push(SEP)
  lines.push('')

  for (const section of order) {
    switch (section) {
      case 'summary':
        if (resumeData.summary) {
          lines.push(SECTION_TITLES.summary)
          lines.push(DIV)
          lines.push(...wordWrap(resumeData.summary, 70))
          lines.push('')
        }
        break
      case 'experience':
        if (resumeData.experience.length > 0) {
          lines.push(SECTION_TITLES.experience)
          lines.push(DIV)
          for (const exp of resumeData.experience) {
            lines.push('')
            lines.push(`${exp.title}  |  ${exp.company}`)
            lines.push(`${exp.startDate} – ${exp.endDate || 'Present'}`)
            for (const bullet of exp.bullets) {
              const wrapped = wordWrap(bullet, 66)
              lines.push(`  • ${wrapped[0]}`)
              for (let i = 1; i < wrapped.length; i++) lines.push(`    ${wrapped[i]}`)
            }
          }
          lines.push('')
        }
        break
      case 'education':
        if (resumeData.education.length > 0) {
          lines.push(SECTION_TITLES.education)
          lines.push(DIV)
          for (const edu of resumeData.education) {
            const gpa = edu.gpa ? `  |  GPA: ${edu.gpa}` : ''
            lines.push(`${edu.degree}  |  ${edu.institution}  |  ${edu.year}${gpa}`)
          }
          lines.push('')
        }
        break
      case 'skills':
        if (resumeData.skills.length > 0) {
          lines.push(SECTION_TITLES.skills)
          lines.push(DIV)
          for (let i = 0; i < resumeData.skills.length; i += 5) {
            lines.push(resumeData.skills.slice(i, i + 5).join('  •  '))
          }
          lines.push('')
        }
        break
      case 'certifications':
        if (resumeData.certifications.length > 0) {
          lines.push(SECTION_TITLES.certifications)
          lines.push(DIV)
          for (const cert of resumeData.certifications) lines.push(`  • ${cert}`)
          lines.push('')
        }
        break
    }
  }

  lines.push(SEP)
  return lines.join('\n')
}

// ─── Markdown Export ──────────────────────────────────────────────────────────

export function exportMarkdown(resumeData: ResumeData, fileName = 'resume-ats.md') {
  const order = getSectionOrder(resumeData)
  const lines: string[] = []
  lines.push(`# ${resumeData.name}`)
  lines.push('')
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) lines.push(contact.join(' | '))
  lines.push('')

  for (const section of order) {
    switch (section) {
      case 'summary':
        if (resumeData.summary) { lines.push('## Professional Summary'); lines.push(''); lines.push(resumeData.summary); lines.push('') }
        break
      case 'experience':
        if (resumeData.experience.length > 0) {
          lines.push('## Professional Experience'); lines.push('')
          for (const exp of resumeData.experience) {
            lines.push(`### ${exp.title} — ${exp.company}`)
            lines.push(`*${exp.startDate} – ${exp.endDate || 'Present'}*`)
            lines.push('')
            for (const bullet of exp.bullets) lines.push(`- ${bullet}`)
            lines.push('')
          }
        }
        break
      case 'education':
        if (resumeData.education.length > 0) {
          lines.push('## Education'); lines.push('')
          for (const edu of resumeData.education) {
            lines.push(`### ${edu.degree} — ${edu.institution}`)
            lines.push(`*${edu.year}*${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`)
            lines.push('')
          }
        }
        break
      case 'skills':
        if (resumeData.skills.length > 0) {
          lines.push('## Skills'); lines.push('')
          lines.push(resumeData.skills.map(s => `\`${s}\``).join(' • ')); lines.push('')
        }
        break
      case 'certifications':
        if (resumeData.certifications.length > 0) {
          lines.push('## Certifications'); lines.push('')
          for (const cert of resumeData.certifications) lines.push(`- ${cert}`)
          lines.push('')
        }
        break
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, fileName)
}

// ─── PDF Export — Professional Template with Section Ordering ─────────────────

export async function exportPDF(
  content: string,
  fileName = 'resume-ats.pdf',
  resumeData?: ResumeData
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const mL = 50, mR = 50, mT = 45, mB = 45
  const cW = pageWidth - mL - mR

  const BLACK: [number, number, number] = [15, 15, 15]
  const HDR: [number, number, number] = [40, 40, 120]
  const MUTED: [number, number, number] = [100, 100, 100]
  const RULE: [number, number, number] = [180, 180, 210]

  let y = mT
  const np = () => { doc.addPage(); y = mT }
  const chk = (n: number) => { if (y + n > pageHeight - mB) np() }

  if (resumeData && resumeData.name) {
    const order = getSectionOrder(resumeData)

    // ── Header ──
    doc.setFont('helvetica', 'bold').setFontSize(24).setTextColor(...HDR)
    doc.text(resumeData.name || 'Resume', mL, y); y += 28
    const c = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
    if (c.length) {
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
      doc.text(c.join('   |   '), mL, y); y += 14
    }
    doc.setDrawColor(...RULE).setLineWidth(1.5).line(mL, y, pageWidth - mR, y); y += 14

    const sec = (t: string) => {
      chk(30)
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...HDR)
      doc.text(t, mL, y); y += 4
      doc.setDrawColor(...RULE).setLineWidth(0.5).line(mL, y, pageWidth - mR, y); y += 10
    }

    const body = (t: string, ind = 0, fs = 9.5) => {
      doc.setFont('helvetica', 'normal').setFontSize(fs).setTextColor(...BLACK)
      for (const l of doc.splitTextToSize(t, cW - ind)) {
        chk(14); doc.text(l, mL + ind, y); y += 13
      }
    }

    // ── Sections in detected order ──
    for (const section of order) {
      switch (section) {
        case 'summary':
          if (resumeData.summary) { sec(SECTION_TITLES.summary); body(resumeData.summary); y += 6 }
          break
        case 'experience':
          if (resumeData.experience.length > 0) {
            sec(SECTION_TITLES.experience)
            for (const exp of resumeData.experience) {
              chk(40)
              doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...BLACK)
              doc.text(`${exp.title}  |  ${exp.company}`, mL, y); y += 13
              doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...MUTED)
              doc.text(`${exp.startDate} – ${exp.endDate || 'Present'}`, mL, y); y += 11
              for (const b of exp.bullets) {
                chk(16)
                doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLACK)
                const ws = doc.splitTextToSize(`• ${b}`, cW - 12)
                doc.text(ws[0], mL + 8, y); y += 12
                for (let i = 1; i < ws.length; i++) { chk(14); doc.text(ws[i], mL + 18, y); y += 12 }
              }
              y += 5
            }
            y += 4
          }
          break
        case 'education':
          if (resumeData.education.length > 0) {
            sec(SECTION_TITLES.education)
            for (const edu of resumeData.education) {
              chk(28)
              doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...BLACK)
              doc.text(edu.degree, mL, y); y += 12
              doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
              doc.text([edu.institution, edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join('   |   '), mL, y); y += 14
            }
            y += 4
          }
          break
        case 'skills':
          if (resumeData.skills.length > 0) {
            sec(SECTION_TITLES.skills)
            doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLACK)
            for (const l of doc.splitTextToSize(resumeData.skills.join('  •  '), cW)) {
              chk(13); doc.text(l, mL, y); y += 13
            }
            y += 6
          }
          break
        case 'certifications':
          if (resumeData.certifications.length > 0) {
            sec(SECTION_TITLES.certifications)
            for (const cert of resumeData.certifications) body(`• ${cert}`, 8, 9)
            y += 4
          }
          break
      }
    }
  } else {
    // Fallback: render from text content
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (/^[═─]{5,}$/.test(t)) {
        if (y > mT + 10) { doc.setDrawColor(...RULE).setLineWidth(0.5).line(mL, y, pageWidth - mR, y); y += 8 }
        continue
      }
      if (!t) { y += 7; continue }
      const isHdr = /^[A-Z\s]{4,}$/.test(t) && t.length < 50
      if (isHdr) { chk(20); doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...HDR) }
      else { chk(14); doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...BLACK) }
      for (const wl of doc.splitTextToSize(t, cW)) { chk(14); doc.text(wl, mL, y); y += 13 }
    }
  }

  doc.save(fileName)
}

// ─── DOCX Export — Browser-Compatible with Section Ordering ──────────────────

export async function exportDOCX(resumeData: ResumeData, fileName = 'resume-ats.docx') {
  const { Document, Paragraph, TextRun, Packer, BorderStyle } = await import('docx')
  const order = getSectionOrder(resumeData)

  const children: any[] = []

  // Header
  children.push(new Paragraph({
    children: [new TextRun({ text: (resumeData.name || 'Resume').toUpperCase(), bold: true, size: 40, color: '2a2a78' })],
    spacing: { after: 60 },
  }))

  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contact.join('   |   '), size: 18, color: '666666' })],
      spacing: { after: 120 },
    }))
  }

  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: 'b4b4d2' } },
    spacing: { after: 160 },
  }))

  const sh = (title: string) => new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 22, color: '2828a0', allCaps: true })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'b4b4d2' } },
    spacing: { before: 280, after: 120 },
  })

  // Sections in detected order
  for (const section of order) {
    switch (section) {
      case 'summary':
        if (resumeData.summary) {
          children.push(sh('Professional Summary'))
          children.push(new Paragraph({ children: [new TextRun({ text: resumeData.summary, size: 20 })], spacing: { after: 160 } }))
        }
        break
      case 'experience':
        if (resumeData.experience.length > 0) {
          children.push(sh('Professional Experience'))
          for (const exp of resumeData.experience) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: exp.title, bold: true, size: 21 }),
                new TextRun({ text: `  |  ${exp.company}`, size: 21, color: '333333' }),
              ],
              spacing: { before: 180, after: 40 },
            }))
            children.push(new Paragraph({
              children: [new TextRun({ text: `${exp.startDate} – ${exp.endDate || 'Present'}`, italics: true, size: 18, color: '888888' })],
              spacing: { after: 80 },
            }))
            for (const b of exp.bullets) {
              children.push(new Paragraph({ children: [new TextRun({ text: b, size: 19 })], bullet: { level: 0 }, spacing: { after: 40 } }))
            }
          }
        }
        break
      case 'education':
        if (resumeData.education.length > 0) {
          children.push(sh('Education'))
          for (const edu of resumeData.education) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: edu.degree, bold: true, size: 20 }),
                new TextRun({ text: `  |  ${edu.institution}`, size: 20 }),
                new TextRun({ text: edu.year ? `  |  ${edu.year}` : '', size: 20, color: '666666' }),
                new TextRun({ text: edu.gpa ? `  |  GPA: ${edu.gpa}` : '', size: 20, color: '666666' }),
              ],
              spacing: { before: 120, after: 80 },
            }))
          }
        }
        break
      case 'skills':
        if (resumeData.skills.length > 0) {
          children.push(sh('Skills'))
          children.push(new Paragraph({ children: [new TextRun({ text: resumeData.skills.join('  •  '), size: 19 })], spacing: { after: 120 } }))
        }
        break
      case 'certifications':
        if (resumeData.certifications.length > 0) {
          children.push(sh('Certifications'))
          for (const cert of resumeData.certifications) {
            children.push(new Paragraph({ children: [new TextRun({ text: cert, size: 19 })], bullet: { level: 0 }, spacing: { after: 40 } }))
          }
        }
        break
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children,
    }],
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, fileName)
}

// ─── AI-Enhanced Export ───────────────────────────────────────────────────────

export async function exportWithAI(
  apiKey: string,
  resumeData: ResumeData,
  format: 'pdf' | 'docx' | 'txt',
  version: string,
  fileName: string
) {
  const mod = await import('./openaiExport.ts')
  try {
    const formattedContent = await mod.callOpenAIForExport(apiKey, resumeData, version)
    const formattedData: ResumeData = { ...resumeData, rawText: formattedContent }
    if (format === 'pdf') await exportPDF(formattedContent, fileName, formattedData)
    else if (format === 'docx') await exportDOCX(formattedData, fileName)
    else exportTXT(formattedContent, fileName)
  } catch {
    if (format === 'pdf') await exportPDF(version, fileName, resumeData)
    else if (format === 'docx') await exportDOCX(resumeData, fileName)
    else exportTXT(version, fileName)
  }
}
