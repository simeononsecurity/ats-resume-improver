import { downloadBlob } from './utils'
import type { ResumeData } from '../types'
import type { AIConfig } from './aiProvider'
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

  if (resumeData.projects && resumeData.projects.length > 0) {
    lines.push('PROJECTS')
    lines.push(DIV)
    for (const proj of resumeData.projects) {
      lines.push('')
      lines.push(proj.technologies?.length ? `${proj.name}  |  ${proj.technologies.join(', ')}` : proj.name)
      if (proj.description) lines.push(...wordWrap(`  ${proj.description}`, 70))
      if (proj.url) lines.push(`  ${proj.url}`)
    }
    lines.push('')
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

  if (resumeData.projects && resumeData.projects.length > 0) {
    lines.push('## Projects'); lines.push('')
    for (const proj of resumeData.projects) {
      const tech = proj.technologies?.length ? ` — *${proj.technologies.join(', ')}*` : ''
      lines.push(`### ${proj.name}${tech}`)
      if (proj.description) lines.push(proj.description)
      if (proj.url) lines.push(`[${proj.url}](${proj.url})`)
      lines.push('')
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, fileName)
}

// ─── PDF Export — Professional Template ───────────────────────────────────────

export async function exportPDF(
  content: string,
  fileName = 'resume-ats.pdf',
  resumeData?: ResumeData
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const mL = 54, mR = 54, mT = 48, mB = 48
  const cW = pageWidth - mL - mR

  // Color palette
  const NAVY: [number, number, number] = [26, 44, 90]
  const BLUE: [number, number, number] = [37, 99, 200]
  const BLACK: [number, number, number] = [17, 24, 39]
  const GRAY: [number, number, number] = [107, 114, 128]
  const RULE_LIGHT: [number, number, number] = [200, 210, 225]

  let y = mT
  const np = () => { doc.addPage(); y = mT }
  const chk = (n: number) => { if (y + n > pageHeight - mB) np() }

  const body = (t: string, ind = 0, fs = 9.5, color: [number, number, number] = BLACK) => {
    doc.setFont('helvetica', 'normal').setFontSize(fs).setTextColor(...color)
    for (const l of doc.splitTextToSize(t, cW - ind)) {
      chk(14); doc.text(l, mL + ind, y); y += 13
    }
  }

  if (resumeData && resumeData.name) {
    const order = getSectionOrder(resumeData)

    // ── Name ──
    doc.setFont('helvetica', 'bold').setFontSize(26).setTextColor(...NAVY)
    doc.text((resumeData.name || 'Resume').toUpperCase(), mL, y); y += 30

    // ── Contact bar ──
    const c = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
    if (c.length) {
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRAY)
      doc.text(c.join('   •   '), mL, y); y += 14
    }

    // ── Thick accent rule ──
    doc.setDrawColor(...BLUE).setLineWidth(2.5).line(mL, y + 2, pageWidth - mR, y + 2); y += 16

    // ── Section header helper ──
    const sec = (t: string) => {
      chk(36)
      y += 12
      doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...NAVY)
      doc.text(t, mL, y); y += 5
      doc.setDrawColor(...BLUE).setLineWidth(1).line(mL, y, pageWidth - mR, y); y += 10
    }

    for (const section of order) {
      switch (section) {
        case 'summary':
          if (resumeData.summary) {
            sec(SECTION_TITLES.summary)
            body(resumeData.summary)
            y += 4
          }
          break

        case 'experience':
          if (resumeData.experience.length > 0) {
            sec(SECTION_TITLES.experience)
            for (const exp of resumeData.experience) {
              chk(50)
              y += 6
              // Title: bold navy
              doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...NAVY)
              doc.text(exp.title, mL, y)
              // Company: same line after separator
              const tW = doc.getTextWidth(exp.title)
              doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...GRAY)
              const compSuffix = `  ·  ${exp.company}`
              if (tW + doc.getTextWidth(compSuffix) < cW) {
                doc.text(compSuffix, mL + tW, y)
              } else {
                // Overflow: render company on next line
                y += 13
                doc.text(exp.company, mL, y)
              }
              y += 14
              // Date: italic gray
              doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...GRAY)
              doc.text(`${exp.startDate} – ${exp.endDate || 'Present'}`, mL, y); y += 12
              // Bullets
              for (const b of exp.bullets) {
                chk(16)
                doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLACK)
                const ws = doc.splitTextToSize(`• ${b}`, cW - 12)
                doc.text(ws[0], mL + 10, y); y += 12
                for (let i = 1; i < ws.length; i++) { chk(14); doc.text(ws[i], mL + 18, y); y += 12 }
              }
              y += 4
            }
            y += 4
          }
          break

        case 'education':
          if (resumeData.education.length > 0) {
            sec(SECTION_TITLES.education)
            for (const edu of resumeData.education) {
              chk(32)
              y += 5
              doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...NAVY)
              doc.text(edu.degree, mL, y); y += 13
              doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRAY)
              const eduLine = [edu.institution, edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join('   •   ')
              doc.text(eduLine, mL, y); y += 14
            }
            y += 4
          }
          break

        case 'skills':
          if (resumeData.skills.length > 0) {
            sec(SECTION_TITLES.skills)
            doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLACK)
            for (const l of doc.splitTextToSize(resumeData.skills.join('   •   '), cW)) {
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

    // ── Projects ──
    if (resumeData.projects && resumeData.projects.length > 0) {
      sec('PROJECTS')
      for (const proj of resumeData.projects) {
        chk(34)
        y += 5
        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...NAVY)
        doc.text(proj.name, mL, y)
        if (proj.technologies?.length) {
          const nW = doc.getTextWidth(proj.name)
          doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRAY)
          doc.text(`  ·  ${proj.technologies.join(', ')}`, mL + nW, y)
        }
        y += 13
        if (proj.description) body(proj.description, 0, 9)
        if (proj.url) body(proj.url, 0, 8.5, BLUE)
        y += 4
      }
    }
  } else {
    // Fallback: render from raw text
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (/^[═─]{5,}$/.test(t)) {
        if (y > mT + 10) {
          doc.setDrawColor(...RULE_LIGHT).setLineWidth(0.5).line(mL, y, pageWidth - mR, y); y += 8
        }
        continue
      }
      if (!t) { y += 7; continue }
      const isHdr = /^[A-Z\s]{4,}$/.test(t) && t.length < 50
      if (isHdr) { chk(20); doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...NAVY) }
      else { chk(14); doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...BLACK) }
      for (const wl of doc.splitTextToSize(t, cW)) { chk(14); doc.text(wl, mL, y); y += 13 }
    }
  }

  doc.save(fileName)
}

// ─── DOCX Export — Professional Template ──────────────────────────────────────

export async function exportDOCX(resumeData: ResumeData, fileName = 'resume-ats.docx') {
  const { Document, Paragraph, TextRun, Packer, BorderStyle } = await import('docx')
  const order = getSectionOrder(resumeData)

  // Color palette (hex strings for docx)
  const NAVY = '1a2c5a'
  const BLUE = '2563eb'
  const BLACK = '111827'
  const GRAY = '6b7280'
  const RULE = 'c7d2e0'

  const children: any[] = []

  // ── Name ──
  children.push(new Paragraph({
    children: [new TextRun({
      text: (resumeData.name || 'Resume').toUpperCase(),
      bold: true, size: 52, color: NAVY, font: 'Calibri',
    })],
    spacing: { after: 80 },
  }))

  // ── Contact bar ──
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contact.join('   •   '), size: 18, color: GRAY, font: 'Calibri' })],
      spacing: { after: 160 },
    }))
  }

  // ── Thick accent rule ──
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.THICK, size: 24, color: BLUE } },
    spacing: { after: 240 },
  }))

  // ── Section header helper ──
  const sh = (title: string) => new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 22, color: NAVY, font: 'Calibri', allCaps: true })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE } },
    spacing: { before: 360, after: 160 },
  })

  for (const section of order) {
    switch (section) {
      case 'summary':
        if (resumeData.summary) {
          children.push(sh('Professional Summary'))
          children.push(new Paragraph({
            children: [new TextRun({ text: resumeData.summary, size: 20, color: BLACK, font: 'Calibri' })],
            spacing: { after: 200 },
          }))
        }
        break

      case 'experience':
        if (resumeData.experience.length > 0) {
          children.push(sh('Professional Experience'))
          for (const exp of resumeData.experience) {
            // Title · Company
            children.push(new Paragraph({
              children: [
                new TextRun({ text: exp.title, bold: true, size: 22, color: NAVY, font: 'Calibri' }),
                new TextRun({ text: '   ·   ', size: 20, color: RULE, font: 'Calibri' }),
                new TextRun({ text: exp.company, size: 20, color: BLACK, font: 'Calibri' }),
              ],
              spacing: { before: 200, after: 40 },
            }))
            // Dates
            children.push(new Paragraph({
              children: [new TextRun({
                text: `${exp.startDate} – ${exp.endDate || 'Present'}`,
                italics: true, size: 18, color: GRAY, font: 'Calibri',
              })],
              spacing: { after: 80 },
            }))
            // Bullets
            for (const b of exp.bullets) {
              children.push(new Paragraph({
                children: [new TextRun({ text: b, size: 19, color: BLACK, font: 'Calibri' })],
                bullet: { level: 0 },
                spacing: { after: 50 },
              }))
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
                new TextRun({ text: edu.degree, bold: true, size: 21, color: NAVY, font: 'Calibri' }),
                new TextRun({ text: `   ·   ${edu.institution}`, size: 20, color: BLACK, font: 'Calibri' }),
                new TextRun({ text: edu.year ? `   ·   ${edu.year}` : '', size: 19, color: GRAY, font: 'Calibri' }),
                new TextRun({ text: edu.gpa ? `   ·   GPA: ${edu.gpa}` : '', size: 19, color: GRAY, font: 'Calibri' }),
              ],
              spacing: { before: 140, after: 100 },
            }))
          }
        }
        break

      case 'skills':
        if (resumeData.skills.length > 0) {
          children.push(sh('Skills'))
          for (let i = 0; i < resumeData.skills.length; i += 5) {
            children.push(new Paragraph({
              children: [new TextRun({
                text: resumeData.skills.slice(i, i + 5).join('   •   '),
                size: 19, color: BLACK, font: 'Calibri',
              })],
              spacing: { after: 80 },
            }))
          }
        }
        break

      case 'certifications':
        if (resumeData.certifications.length > 0) {
          children.push(sh('Certifications'))
          for (const cert of resumeData.certifications) {
            children.push(new Paragraph({
              children: [new TextRun({ text: cert, size: 19, color: BLACK, font: 'Calibri' })],
              bullet: { level: 0 },
              spacing: { after: 50 },
            }))
          }
        }
        break
    }
  }

  // ── Projects ──
  if (resumeData.projects && resumeData.projects.length > 0) {
    children.push(sh('Projects'))
    for (const proj of resumeData.projects) {
      const techText = proj.technologies?.length ? `   ·   ${proj.technologies.join(', ')}` : ''
      children.push(new Paragraph({
        children: [
          new TextRun({ text: proj.name, bold: true, size: 21, color: NAVY, font: 'Calibri' }),
          new TextRun({ text: techText, size: 19, color: GRAY, font: 'Calibri' }),
        ],
        spacing: { before: 160, after: 60 },
      }))
      if (proj.description) {
        children.push(new Paragraph({
          children: [new TextRun({ text: proj.description, size: 19, color: BLACK, font: 'Calibri' })],
          spacing: { after: 60 },
        }))
      }
      if (proj.url) {
        children.push(new Paragraph({
          children: [new TextRun({ text: proj.url, size: 18, color: BLUE, font: 'Calibri' })],
          spacing: { after: 80 },
        }))
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 864, right: 864 } } },
      children,
    }],
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: BLACK },
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
  config: AIConfig,
  resumeData: ResumeData,
  format: 'pdf' | 'docx' | 'txt',
  version: string,
  fileName: string,
) {
  const mod = await import('./openaiExport.ts')
  try {
    const formattedContent = await mod.callOpenAIForExport(config, resumeData, version)
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
