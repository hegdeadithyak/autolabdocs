import { type Project, type ParsedCell, type IdeFile, ProjectType } from "../types"
import Prism from "prismjs"
import "prismjs/components/prism-python"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"

// Configurable render widths (final on-page widths in px)
const CODE_RENDER_WIDTH = 750
const OUTPUT_RENDER_WIDTH = 750
const DPI = 1

const VSCODE_THEME = {
  bg: "#1e1e1e",
  lineNumbers: "#858585",
  lineNumbersBg: "#1e1e1e",
  border: "#3e3e42",
  text: "#d4d4d4",
  keyword: "#569cd6",
  string: "#ce9178",
  comment: "#6a9955",
  function: "#dcdcaa",
  class: "#4ec9b0",
  operator: "#d4d4d4",
}

export const generateWordDocument = async (project: Project) => {
  const htmlContent = await buildHtml(project)

  const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${project.name.replace(/\s+/g, "_")}_Report.doc`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function buildHtml(project: Project): Promise<string> {
  const headerDate = new Date().toLocaleDateString()

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(project.name || "")}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 8.5in 11in;
          margin: 1in;
        }
        
        div.Section1 {
          page: Section1;
        }
        
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          background-color: #ffffff; 
          color: #000000; 
          line-height: 1.5; 
          margin: 0;
          padding: 0;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 24pt; 
          border-bottom: 2px solid #000; 
          padding-bottom: 12pt; 
        }
        
        .project-title { 
          font-size: 18pt; 
          font-weight: bold; 
          color: #000; 
        }
        
        .meta { 
          font-size: 10pt; 
          color: #444; 
          margin-top: 4pt; 
        }

        .student-info { 
          margin: 20pt 0; 
          padding: 12pt; 
          border: 1px solid #000; 
          background-color: #f9f9f9; 
        }
        
        .info-row { 
          margin: 8pt 0; 
        }
        
        .info-label { 
          font-weight: bold; 
          width: 120pt; 
          display: inline-block; 
        }
        
        .info-value { 
          border-bottom: 1px solid #000; 
          width: 300pt;
          display: inline-block; 
        }

        .experiment-container { 
          margin-bottom: 24pt; 
          page-break-inside: avoid; 
        }
        
        .section-label { 
          font-size: 10pt; 
          color: #000000; 
          font-weight: bold; 
          text-transform: uppercase; 
          margin-top: 12pt; 
          margin-bottom: 4pt; 
          border-left: 4px solid #000; 
          padding-left: 8pt; 
          background: #e5e5e5; 
        }

        .screenshot-container { 
          margin: 8pt 0; 
          text-align: center; 
          page-break-inside: avoid; 
        }

        .screenshot-img { 
          max-width: 100%; 
          width: ${CODE_RENDER_WIDTH}px; 
          height: auto; 
          border: 1px solid #ccc; 
          display: block; 
          margin: 0 auto; 
        }
        
        .screenshot-img-output { 
          max-width: 100%; 
          width: ${OUTPUT_RENDER_WIDTH}px; 
          height: auto; 
          border: 1px solid #ccc; 
          display: block; 
          margin: 0 auto; 
        }

        h3 { 
          font-size: 14pt; 
          color: #000; 
          border-bottom: 1px solid #000; 
          padding-bottom: 4pt; 
          margin-bottom: 8pt; 
          font-weight: bold; 
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <!--[if gte mso 9]>
        <xml>
          <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
            <w:pgBorders w:offsetFrom="page">
              <w:top w:val="single" w:sz="18" w:space="24" w:color="000000"/>
              <w:left w:val="single" w:sz="18" w:space="24" w:color="000000"/>
              <w:bottom w:val="single" w:sz="18" w:space="24" w:color="000000"/>
              <w:right w:val="single" w:sz="18" w:space="24" w:color="000000"/>
            </w:pgBorders>
          </w:sectPr>
        </xml>
        <![endif]-->
        
        <div class="header">
          <div class="project-title">${escapeHtml(project.name || "")}</div>
          <div class="meta">Generated by AutolabDocs • ${headerDate}</div>
        </div>

        <div class="student-info">
          <div class="info-row"><span class="info-label">Name:</span><span class="info-value">&nbsp;</span></div>
          <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">&nbsp;</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">&nbsp;</span></div>
        </div>
  `

  // Notebook (Colab-like) handling
  if (project.type === ProjectType.COLAB && project.notebookContent) {
    const cells = project.notebookContent as ParsedCell[]
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (cell.type === "code") {
        html += `
        <div class="experiment-container">
          <div class="section-label">Code Cell [${cell.executionCount ?? i}]</div>
          <div class="screenshot-container">
            <img src="${await generateCodeScreenshot(cell.content)}" class="screenshot-img" />
          </div>
        `

        if (cell.outputs && cell.outputs.length > 0) {
          html += `<div class="section-label">Output</div>`
        }

        if (cell.outputs) {
          for (const out of cell.outputs) {
            if (out.type === "text") {
              html += `
            <div class="screenshot-container">
              <img src="${await generateOutputScreenshot(stripAnsi(out.data as string), "output")}" class="screenshot-img-output" />
            </div>`
            } else if (out.type === "image") {
              html += `
            <div class="screenshot-container">
              <img src="data:${out.mimeType};base64,${out.data}" class="screenshot-img-output" />
            </div>`
            } else if (out.type === "error") {
              html += `
            <div class="screenshot-container">
              <img src="${await generateOutputScreenshot(out.data as string, "error")}" class="screenshot-img-output" />
            </div>`
            }
          }
        }

        html += `
        </div>`
      }
    }
  }

  // IDE / Files handling
  else if (project.type === ProjectType.IDE && project.files) {
    const files = project.files as IdeFile[]
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      html += `
        <div class="experiment-container">
          <h3>Experiment ${i + 1}: ${escapeHtml(file.name)}</h3>

          <div class="section-label">Source Code</div>
          <div class="screenshot-container">
            <img src="${await generateCodeScreenshot(file.content)}" class="screenshot-img" />
          </div>
      `

      if (file.lastInput) {
        html += `
          <div class="section-label">Standard Input</div>
          <div class="screenshot-container">
            <img src="${await generateOutputScreenshot(stripAnsi(file.lastInput), "input")}" class="screenshot-img-output" />
          </div>
        `
      }

      html += `
          <div class="section-label">Execution Output</div>
          <div class="screenshot-container">
            <img src="${await generateOutputScreenshot(file.lastOutput ? stripAnsi(file.lastOutput) : "No output recorded", "output")}" class="screenshot-img-output" />
          </div>
      `

      if (file.lastError) {
        html += `
          <div class="section-label">Error Trace</div>
          <div class="screenshot-container">
            <img src="${await generateOutputScreenshot(file.lastError, "error")}" class="screenshot-img-output" />
          </div>
        `
      }

      html += `
        </div>`
    }
  }

  html += `
      </div>
    </body>
    </html>`

  return html
}

export const generateCodeScreenshot = async (code: string): Promise<string> => {
  const padding = 16
  const fontSize = 12
  const lineHeight = 18
  const lineNumberWidth = 45
  const charWidth = 7.2

  const tokens = Prism.tokenize(code || "", Prism.languages.python || Prism.languages.javascript)

  const contentArea = CODE_RENDER_WIDTH - lineNumberWidth - padding * 2
  const maxCharsPerLine = Math.max(20, Math.floor(contentArea / charWidth))

  const rawLines = (code || "").split("\n")
  const wrappedLines: Array<{ text: string; isWrapped: boolean; originalIndex: number }> = []

  rawLines.forEach((line, idx) => {
    if (line.length <= maxCharsPerLine) {
      wrappedLines.push({ text: line, isWrapped: false, originalIndex: idx })
    } else {
      let remaining = line
      let first = true
      while (remaining.length > 0) {
        const chunk = remaining.substring(0, maxCharsPerLine)
        wrappedLines.push({ text: chunk, isWrapped: !first, originalIndex: idx })
        remaining = remaining.substring(maxCharsPerLine)
        first = false
      }
    }
  })

  const totalLines = Math.max(1, wrappedLines.length)
  const width = CODE_RENDER_WIDTH
  const height = Math.min(2000, totalLines * lineHeight + padding * 2 + 8)

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  canvas.width = Math.round(width * DPI)
  canvas.height = Math.round(height * DPI)
  canvas.style.width = width + "px"
  canvas.style.height = height + "px"
  ctx.scale(DPI, DPI)

  ctx.fillStyle = VSCODE_THEME.bg
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = VSCODE_THEME.border
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, width, height)

  ctx.fillStyle = VSCODE_THEME.lineNumbersBg
  ctx.fillRect(0, 0, lineNumberWidth, height)

  ctx.strokeStyle = VSCODE_THEME.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(lineNumberWidth, 0)
  ctx.lineTo(lineNumberWidth, height)
  ctx.stroke()

  ctx.font = `${fontSize}px "SF Mono", Monaco, "Cascadia Code", "Consolas", monospace`
  ctx.textBaseline = "top"

  let currentY = padding
  const lines = (code || "").split("\n")

  lines.forEach((line, lineIdx) => {
    ctx.textAlign = "right"
    ctx.fillStyle = VSCODE_THEME.lineNumbers
    ctx.fillText(String(lineIdx + 1), lineNumberWidth - 10, currentY + 2)

    ctx.textAlign = "left"
    let currentX = lineNumberWidth + 10
    const lineTokens = Prism.tokenize(line, Prism.languages.python || Prism.languages.javascript)

    const renderTokens = (tokens: any) => {
      tokens.forEach((token: any) => {
        if (typeof token === "string") {
          ctx.fillStyle = VSCODE_THEME.text
          ctx.fillText(token, currentX, currentY + 2)
          currentX += ctx.measureText(token).width
        } else {
          if (token.type === "keyword") ctx.fillStyle = VSCODE_THEME.keyword
          else if (token.type === "string") ctx.fillStyle = VSCODE_THEME.string
          else if (token.type === "comment") ctx.fillStyle = VSCODE_THEME.comment
          else if (token.type === "function") ctx.fillStyle = VSCODE_THEME.function
          else if (token.type === "class-name") ctx.fillStyle = VSCODE_THEME.class
          else ctx.fillStyle = VSCODE_THEME.text

          const text = typeof token.content === "string" ? token.content : ""
          ctx.fillText(text, currentX, currentY + 2)
          currentX += ctx.measureText(text).width
        }
      })
    }
    renderTokens(lineTokens)
    currentY += lineHeight
  })

  return canvas.toDataURL("image/png")
}

export const generateOutputScreenshot = async (text: string, type: "output" | "input" | "error"): Promise<string> => {
  const padding = 12
  const fontSize = 11
  const lineHeight = 16
  const charWidth = 7.0

  const contentArea = OUTPUT_RENDER_WIDTH - padding * 2
  const maxCharsPerLine = Math.max(30, Math.floor(contentArea / charWidth))

  const rawLines = (text || "").split("\n")
  const wrappedLines: string[] = []
  rawLines.forEach((line) => {
    if (line.length <= maxCharsPerLine) {
      wrappedLines.push(line)
    } else {
      let remaining = line
      while (remaining.length > 0) {
        wrappedLines.push(remaining.substring(0, maxCharsPerLine))
        remaining = remaining.substring(maxCharsPerLine)
      }
    }
  })

  const totalLines = Math.max(1, wrappedLines.length)
  const width = OUTPUT_RENDER_WIDTH
  const height = Math.min(2000, totalLines * lineHeight + padding * 2 + 8)

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  canvas.width = Math.round(width * DPI)
  canvas.height = Math.round(height * DPI)
  canvas.style.width = width + "px"
  canvas.style.height = height + "px"
  ctx.scale(DPI, DPI)

  let bgColor = "#0e0e0e"
  let borderColor = "#007acc"
  let textColor = "#cccccc"
  if (type === "error") {
    bgColor = "#2d0a0a"
    borderColor = "#f14c4c"
    textColor = "#f48771"
  } else if (type === "input") {
    bgColor = "#1a1a2e"
    borderColor = "#9d4edd"
    textColor = "#e0aaff"
  }

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = borderColor
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, width, height)

  ctx.fillStyle = borderColor
  ctx.fillRect(0, 0, 4, height)

  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px "SF Mono", Monaco, "Cascadia Code", "Consolas", monospace`
  ctx.textBaseline = "top"

  wrappedLines.forEach((line, i) => {
    const y = padding + i * lineHeight
    ctx.fillText(line, padding + 6, y + 1)
  })

  return canvas.toDataURL("image/png")
}

export const stripAnsi = (str: string): string => {
  if (!str) return ""
  return str
    .replace(/\x1b\]0;[\s\S]*?(\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\x1b\[\?[\d;]*[a-z]/g, "")
    .replace(/\x1bO[A-Za-z]/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim()
}

export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return ""
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}