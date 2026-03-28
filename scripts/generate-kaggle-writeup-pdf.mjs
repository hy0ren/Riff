import fs from "node:fs";
import path from "node:path";

const outputPath = path.resolve("docs/riff-kaggle-writeup.pdf");

const documentTitle = "Riff Project Writeup";
const pageWidth = 612;
const pageHeight = 792;
const marginX = 54;
const marginTop = 60;
const marginBottom = 54;
const contentWidth = pageWidth - marginX * 2;
const lineGap = 4;

const sections = [
  {
    type: "title",
    text: "Riff",
  },
  {
    type: "subtitle",
    text:
      "Desktop-first AI music creation that turns rough musical ideas into complete songs, persistent projects, and learnable musical guides.",
  },
  {
    type: "meta",
    text: "Formal project writeup for hackathon and Kaggle-style submission",
  },
  {
    type: "callout",
    label: "One-sentence summary",
    text:
      "Riff is a desktop-first AI music creation platform that helps creators start from a hum, riff, lyric, chord progression, sheet music, remix source, or Spotify reference, generate a complete song, and then organize and learn that song inside one persistent workspace.",
  },
  {
    type: "heading",
    text: "Inspiration",
  },
  {
    type: "paragraph",
    text:
      "Music ideas are fragile. A melody, lyric, or chord loop can arrive in a single moment and disappear just as quickly. The inspiration for Riff came from wanting to build a tool that does more than generate novelty output. I wanted a product that helps creators capture an idea in whatever form it first appears, transform it into a complete song, preserve it as a real project, and make that result something the creator can continue to study and master.",
  },
  {
    type: "heading",
    text: "What the application does",
  },
  {
    type: "paragraph",
    text:
      "Riff is an AI music creation platform centered around multi-input song generation. A user can begin with several kinds of source material, including hummed melodies, guitar riffs, lyrics, chord progressions, sheet music, remix references, and Spotify references. The application interprets those inputs, estimates musical attributes such as BPM, key, chords, and song structure, and then generates a complete song. The resulting track is stored as a persistent project in a library, complete with metadata, artwork, exports, and a Learn mode that helps break the song down into lyrics, chords, melody guidance, and sections such as verse, chorus, and bridge.",
  },
  {
    type: "heading",
    text: "How it was built",
  },
  {
    type: "paragraph",
    text:
      "I built Riff with a React, TypeScript, and Vite frontend, using Tailwind CSS and shadcn/ui for the interface layer. The desktop application path uses Tauri and Rust, allowing the product to feel installable and local-first instead of browser-only. Firebase was integrated for accounts, profiles, and cloud-backed sync, while Spotify was added as a reference and personalization layer. Gemini powered most of the intelligence in the product, including interpreting source inputs, inferring BPM and key, organizing chords and structure, generating learning guidance, and improving prompts for downstream media generation. Lyria served as the core music generation engine, and Nano Banana was used to generate song-related cover art.",
  },
  {
    type: "heading",
    text: "Technical stack",
  },
  {
    type: "bullet",
    text: "Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui",
  },
  {
    type: "bullet",
    text: "Desktop layer: Tauri, Rust",
  },
  {
    type: "bullet",
    text: "Auth and data: Firebase Authentication, Firestore, Firebase Hosting",
  },
  {
    type: "bullet",
    text: "Music intelligence: Gemini",
  },
  {
    type: "bullet",
    text: "Song generation: Lyria",
  },
  {
    type: "bullet",
    text: "Visual generation: Nano Banana",
  },
  {
    type: "bullet",
    text: "Reference integration: Spotify",
  },
  {
    type: "heading",
    text: "Why the project is different",
  },
  {
    type: "paragraph",
    text:
      "Many AI music applications focus on one-shot generation. Riff is different because it is designed around the full lifecycle of a song. It starts with incomplete musical intent, supports multiple source types at once, uses AI to structure and interpret those inputs, generates a complete track, saves that track as a persistent project, and then helps the creator learn and revisit what was made. That combination of creation, persistence, organization, and learning makes it feel more like a serious creative tool than a disposable generator.",
  },
  {
    type: "heading",
    text: "Challenges encountered",
  },
  {
    type: "paragraph",
    text:
      "The biggest challenge was not simply connecting to AI models, but shaping them into one coherent product. It required defining clear roles for different systems, preserving project state over time, making generated outputs editable and inspectable, and ensuring the experience still felt musical rather than overly technical. Integrations added another layer of difficulty, especially around authentication, desktop behavior, and maintaining a consistent experience across browser and desktop contexts.",
  },
  {
    type: "heading",
    text: "What I am proud of",
  },
  {
    type: "paragraph",
    text:
      "I am proud that Riff feels like a product with a real center of gravity instead of a bundle of disconnected demos. The multi-input generation workflow is ambitious but clear, the library and track details make songs feel persistent and serious, and the Learn mode gives the generated output a second life by turning it into something a creator can actually use to understand and practice the song.",
  },
  {
    type: "heading",
    text: "What I learned",
  },
  {
    type: "paragraph",
    text:
      "The most important lesson was that building with AI is not only about model quality. The harder problem is orchestration: deciding which model is responsible for which task, how outputs flow into product state, and how to make AI-generated content useful inside a real workflow. I also learned a great deal about desktop product design, persistence, auth flows, and how much UX discipline is required to make an AI product feel trustworthy.",
  },
  {
    type: "heading",
    text: "Demo flow",
  },
  {
    type: "bullet",
    text: "Start a project from a hum, riff, lyric draft, chord progression, sheet music, remix source, or Spotify reference.",
  },
  {
    type: "bullet",
    text: "Use Gemini to interpret the input and infer musical structure such as BPM, key, chords, and arrangement hints.",
  },
  {
    type: "bullet",
    text: "Refine those defaults in Studio and generate a full song with Lyria.",
  },
  {
    type: "bullet",
    text: "Automatically attach cover art, save the result in the Library, and inspect it in Track Details.",
  },
  {
    type: "bullet",
    text: "Open Learn mode to review lyrics, chords, melody direction, and section-by-section guidance.",
  },
  {
    type: "heading",
    text: "Next steps",
  },
  {
    type: "paragraph",
    text:
      "The next steps for Riff are to strengthen backend architecture for secure multi-user AI access, continue improving desktop-native authentication flows, deepen synchronization and account features, and expand the learning layer into an even more interactive companion for creators. The long-term goal is for Riff to become a complete creator platform for generating, refining, organizing, and mastering original music in one environment.",
  },
  {
    type: "footer",
    text: "Prepared for submission and project review. Built as a solo project.",
  },
];

function wrapText(text, maxWidth, fontSize, indent = 0) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";
  const maxChars = Math.max(18, Math.floor((maxWidth - indent) / (fontSize * 0.5)));

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function estimatedHeight(block) {
  switch (block.type) {
    case "title":
      return 34;
    case "subtitle":
      return wrapText(block.text, contentWidth, 12).length * (12 + lineGap) + 10;
    case "meta":
      return 18;
    case "callout":
      return wrapText(`${block.label}: ${block.text}`, contentWidth - 20, 11).length * (11 + lineGap) + 24;
    case "heading":
      return 26;
    case "paragraph":
      return wrapText(block.text, contentWidth, 11).length * (11 + lineGap) + 8;
    case "bullet":
      return wrapText(block.text, contentWidth - 18, 11).length * (11 + lineGap) + 2;
    case "footer":
      return wrapText(block.text, contentWidth, 9).length * (9 + lineGap) + 18;
    default:
      return 20;
  }
}

function createTextLine(text, x, y, font, size) {
  return `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;
}

const pages = [];
let currentPage = [];
let y = pageHeight - marginTop;

function pushPage() {
  pages.push(currentPage);
  currentPage = [];
  y = pageHeight - marginTop;
}

function ensureSpace(heightNeeded) {
  if (y - heightNeeded < marginBottom) {
    pushPage();
  }
}

for (const block of sections) {
  const height = estimatedHeight(block);
  ensureSpace(height);

  if (block.type === "title") {
    currentPage.push(createTextLine(block.text, marginX, y, "F2", 26));
    y -= 34;
    continue;
  }

  if (block.type === "subtitle") {
    const lines = wrapText(block.text, contentWidth, 12);
    for (const line of lines) {
      currentPage.push(createTextLine(line, marginX, y, "F1", 12));
      y -= 12 + lineGap;
    }
    y -= 6;
    continue;
  }

  if (block.type === "meta") {
    currentPage.push(createTextLine(block.text, marginX, y, "F1", 10));
    y -= 26;
    continue;
  }

  if (block.type === "callout") {
    const boxTop = y + 8;
    const calloutText = `${block.label}: ${block.text}`;
    const lines = wrapText(calloutText, contentWidth - 20, 11);
    const boxHeight = lines.length * (11 + lineGap) + 16;
    currentPage.push(`0.95 0.96 0.98 rg ${marginX} ${boxTop - boxHeight} ${contentWidth} ${boxHeight} re f`);
    currentPage.push(`0.11 0.30 0.65 rg ${marginX} ${boxTop - boxHeight} 5 ${boxHeight} re f`);
    let textY = y - 6;
    let first = true;
    for (const line of lines) {
      currentPage.push(createTextLine(line, marginX + 14, textY, first ? "F2" : "F1", 11));
      textY -= 11 + lineGap;
      first = false;
    }
    y = boxTop - boxHeight - 14;
    continue;
  }

  if (block.type === "heading") {
    currentPage.push(createTextLine(block.text, marginX, y, "F2", 14));
    y -= 24;
    continue;
  }

  if (block.type === "paragraph") {
    const lines = wrapText(block.text, contentWidth, 11);
    for (const line of lines) {
      currentPage.push(createTextLine(line, marginX, y, "F1", 11));
      y -= 11 + lineGap;
    }
    y -= 8;
    continue;
  }

  if (block.type === "bullet") {
    const lines = wrapText(block.text, contentWidth - 18, 11);
    currentPage.push(createTextLine("-", marginX, y, "F1", 11));
    let lineY = y;
    for (const line of lines) {
      currentPage.push(createTextLine(line, marginX + 14, lineY, "F1", 11));
      lineY -= 11 + lineGap;
    }
    y = lineY - 2;
    continue;
  }

  if (block.type === "footer") {
    currentPage.push(`0.8 0.82 0.85 RG ${marginX} ${y + 6} m ${pageWidth - marginX} ${y + 6} l S`);
    const lines = wrapText(block.text, contentWidth, 9);
    for (const line of lines) {
      currentPage.push(createTextLine(line, marginX, y - 8, "F1", 9));
      y -= 9 + lineGap;
    }
    y -= 8;
  }
}

if (currentPage.length > 0) {
  pages.push(currentPage);
}

const objects = [];

function addObject(content) {
  objects.push(content);
  return objects.length;
}

const font1Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const font2Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

const pageIds = [];

for (const pageCommands of pages) {
  const stream = pageCommands.join("\n");
  const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  const pageId = addObject(
    `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );
  pageIds.push(pageId);
}

const pagesId = addObject(
  `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
);

for (const pageId of pageIds) {
  objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
}

const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
const infoId = addObject(
  `<< /Title (${escapePdfText(documentTitle)}) /Producer (Codex PDF Generator) /Creator (Codex) >>`,
);

let pdf = "%PDF-1.4\n";
const offsets = [0];

for (let index = 0; index < objects.length; index += 1) {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";

for (let index = 1; index < offsets.length; index += 1) {
  pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
}

pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`;
pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

fs.writeFileSync(outputPath, pdf, "binary");
console.log(`Generated ${outputPath}`);
