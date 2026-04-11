// services/pdf.service.js
import puppeteer from "puppeteer";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfToPng } from "pdf-to-png-converter";
import { translateBatch } from "./translate.service.js";
import sizeOf from "image-size";



function getImageSize(buffer) {
  const dimensions = sizeOf(buffer);
  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}

export async function processPDF(buffer) {
  console.log(await puppeteer.executablePath());

  let browser;

  try {
    console.log("📄 Extracting text...");
    const textBlocks = await extractTextBlocks(buffer);
    console.log(`📝 Blocks: ${textBlocks.length}`);

    // 🔹 Translate
    const texts = textBlocks.map(b => b.text);
    const translated = await translateBatch(texts);

    textBlocks.forEach((b, i) => {
      b.translated = translated[i] || b.text;
    });

    // 🔹 Convert PDF → PNG
    console.log("🖼️ Converting pages...");
    const pngResults = await pdfToPng(buffer, {
      viewportScale: 2.0,  // MUST match SCALE
    });

    const pageImages = pngResults.map(r => r.content);

    // 🔹 Build HTML
    const html = buildHtml(pageImages, textBlocks);

    // 🔹 Puppeteer
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    console.log("✅ Done");
    return pdfBuffer;

  } catch (err) {
    console.error("❌ Error:", err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}
function buildHtml(pageImages, textBlocks) {
  const fontFamily = "'Noto Sans Bengali', 'Noto Sans', sans-serif";

  let pagesHtml = "";

  for (let pageNum = 0; pageNum < pageImages.length; pageNum++) {
    const imgBuffer = pageImages[pageNum];
    const base64 = Buffer.from(imgBuffer).toString("base64");

    // ✅ Get REAL image dimensions
    const { width: IMG_WIDTH, height: IMG_HEIGHT } = getImageSize(imgBuffer);

    const blocks = textBlocks.filter(b => b.page === pageNum);

    let overlays = "";

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];

      const text = (b.translated || b.text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // ✅ SCALE based on real image size
      const scaleX = IMG_WIDTH / b.pageWidth;
      const scaleY = IMG_HEIGHT / b.pageHeight;

      const left = b.bbox.left * scaleX;

const top =
  IMG_HEIGHT - (b.bbox.bottom * scaleY) - (b.avgFontSize * scaleY);

  let fontSize = (b.avgFontSize || 12) * scaleY;

  fontSize = Math.max(fontSize, 12); // minimum size
  fontSize *= 1.05; // slight boost

// cover
overlays += `
  <div style="
    position:absolute;
    left:${left - 10}px;
    top:${top - 5}px;
    width:${(b.bbox.width * scaleX) + 80}px;
    height:${fontSize * 1.8}px;
    background:white;
    z-index:${i + 5};
  "></div>
`;

// text
overlays += `
  <div style="
    position:absolute;
    left:${left}px;
    top:${top}px;
    font-size:${fontSize}px;
    font-family:${fontFamily};
    color:black;
    z-index:${i + 10};
    line-height:1.2;
    white-space:nowrap;
  ">${text}</div>
`;
    }

    pagesHtml += `
      <div style="
        position:relative;
        width:${IMG_WIDTH}px;
        height:${IMG_HEIGHT}px;
        page-break-after:always;
      ">
        <img src="data:image/png;base64,${base64}"
             style="width:${IMG_WIDTH}px;height:${IMG_HEIGHT}px;" />
        ${overlays}
      </div>
    `;
  }

  return `
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali');
      body { margin:0; padding:0; }
    </style>
  </head>
  <body>${pagesHtml}</body>
  </html>
  `;
}


async function extractTextBlocks(buffer) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const blocks = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // ✅ IMPORTANT: Get page dimensions
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === "") continue;

      const transform = item.transform;

      const x = transform[4]; // X position
      const y = transform[5]; // Y position

      const fontSize = Math.abs(transform[0]) || 12;

      const textWidth =
        item.width || item.str.length * fontSize * 0.6;

      const textHeight = fontSize * 1.2;

      blocks.push({
        text: item.str,
        translated: "",
        page: pageNum - 1,

        // ✅ CRITICAL: store page size
        pageWidth,
        pageHeight,

        bbox: {
          left: x,
          bottom: y,
          width: textWidth,
          height: textHeight,
        },

        avgFontSize: fontSize,
      });
    }
  }

  return blocks;
}