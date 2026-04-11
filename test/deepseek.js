// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { PDFDocument, rgb } from "pdf-lib";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// import fontkit from "@pdf-lib/fontkit";
// import { translateBatch } from "./translate.service.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export async function processPDF(buffer) {
//   try {
//     const pdfDoc = await PDFDocument.load(buffer);
//     pdfDoc.registerFontkit(fontkit);
//     const pages = pdfDoc.getPages();

//     // Load Assamese font
//     const font = await loadAssameseFont(pdfDoc);

//     console.log("📄 Extracting text from PDF...");
//     const textBlocks = await extractTextBlocks(buffer);
//     console.log(`📝 Found ${textBlocks.length} text blocks`);

//     const textsToTranslate = textBlocks.map(block => block.text);
    
//     console.log("🌐 Translating texts...");
//     const translatedTexts = await translateBatch(textsToTranslate);
    
//     textBlocks.forEach((block, index) => {
//       block.translated = translatedTexts[index] || block.text;
//     });

//     console.log("✏️ Drawing translated text...");
//     for (const block of textBlocks) {
//       const page = pages[block.page];
      
//       // Clean and fix the translated text
//       let translatedText = cleanAssameseText(block.translated || block.text);
      
//       const fontSize = block.avgFontSize || 11;
//       const textWidth = font.widthOfTextAtSize(translatedText, fontSize);
      
//       // Draw white background
//       page.drawRectangle({
//         x: block.bbox.left - 2,
//         y: block.bbox.bottom - 2,
//         width: Math.max(textWidth, block.bbox.width) + 4,
//         height: block.bbox.height + 4,
//         color: rgb(1, 1, 1),
//       });
      
//       // Draw translated text
//       page.drawText(translatedText, {
//         x: block.bbox.left,
//         y: block.baselineY,
//         size: fontSize,
//         font: font,
//         color: rgb(0, 0, 0),
//       });
//     }

//     console.log("✅ PDF processing complete");
//     return await pdfDoc.save();
    
//   } catch (error) {
//     console.error("❌ Error processing PDF:", error);
//     throw error;
//   }
// }

// // Function to load the best available Assamese font
// async function loadAssameseFont(pdfDoc) {
//   const fontOptions = [
//     {
//       path: path.join(__dirname, "../../fonts/lohit_as.ttf"),
//       name: "Noto Sans Assamese"
//     },
//     {
//       path: path.join(__dirname, "../../fonts/NotoSansBengali-Regular.ttf"),
//       name: "Noto Sans Bengali"
//     },
//     {
//       path: path.join(__dirname, "../../fonts/ARIALUNI.TTF"),
//       name: "Arial Unicode MS"
//     },
//     {
//       path: path.join(__dirname, "../../fonts/NotoSans-Regular.ttf"),
//       name: "Noto Sans"
//     }
//   ];

//   for (const option of fontOptions) {
//     if (fs.existsSync(option.path)) {
//       try {
//         console.log(`✅ Loading font: ${option.name}`);
//         const fontBytes = fs.readFileSync(option.path);
//         const font = await pdfDoc.embedFont(fontBytes);
//         return font;
//       } catch (error) {
//         console.warn(`⚠️ Failed to load ${option.name}:`, error.message);
//       }
//     }
//   }

//   // Fallback to standard font
//   console.warn("⚠️ No Assamese font found, using Helvetica (text may not render correctly)");
//   return await pdfDoc.embedFont("Helvetica");
// }

// // Function to clean and fix Assamese text encoding (FIXED REGEX)
// function cleanAssameseText(text) {
//   if (!text) return text;
  
//   // First, normalize Unicode
//   let cleaned = text.normalize('NFC');
  
//   // Fix specific corrupted character patterns
//   const encodingFixes = {
//     'Ǝ': 'আ',
//     'Ɛ': 'ি',
//     'ৗ': 'ৌ',
//     'অঁ': 'অং',
//     'আঁ': 'আং',
//     'ইঁ': 'ইং',
//     'ঈঁ': 'ঈং',
//     'উঁ': 'উং',
//     'ঊঁ': 'ঊং',
//     'ঋঁ': 'ঋং',
//     'এঁ': 'এং',
//     'ঐঁ': 'ঐং',
//     'ওঁ': 'ওং',
//     'ঔঁ': 'ঔং',
//     'কঁ': 'কং',
//     'খঁ': 'খং',
//     'গঁ': 'গং',
//     'ঘঁ': 'ঘং',
//     'ঙঁ': 'ঙং',
//     'চঁ': 'চং',
//     'ছঁ': 'ছং',
//     'জঁ': 'জং',
//     'ঝঁ': 'ঝং',
//     'ঞঁ': 'ঞং',
//     'টঁ': 'টং',
//     'ঠঁ': 'ঠং',
//     'ডঁ': 'ডং',
//     'ঢঁ': 'ঢং',
//     'ণঁ': 'ণং',
//     'তঁ': 'তং',
//     'থঁ': 'থং',
//     'দঁ': 'দং',
//     'ধঁ': 'ধং',
//     'নঁ': 'নং',
//     'পঁ': 'পং',
//     'ফঁ': 'ফং',
//     'বঁ': 'বং',
//     'ভঁ': 'ভং',
//     'মঁ': 'মং',
//     'যঁ': 'যং',
//     'ৰঁ': 'ৰং',
//     'লঁ': 'লং',
//     'ৱঁ': 'ৱং',
//     'শঁ': 'শং',
//     'ষঁ': 'ষং',
//     'সঁ': 'সং',
//     'হঁ': 'হং',
//     'ক্ষঁ': 'ক্ষং',
//     'জ্ঞঁ': 'জ্ঞং',
//   };
  
//   // Apply all direct replacements
//   for (const [garbled, correct] of Object.entries(encodingFixes)) {
//     cleaned = cleaned.split(garbled).join(correct);
//   }
  
//   // Fix patterns like "কঁা" -> "কা" (using individual replacements)
//   const consonants = [
//     'ক', 'খ', 'গ', 'ঘ', 'ঙ',
//     'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
//     'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
//     'ত', 'থ', 'দ', 'ধ', 'ন',
//     'প', 'ফ', 'ব', 'ভ', 'ম',
//     'য', 'ৰ', 'ল', 'ৱ',
//     'শ', 'ষ', 'স', 'হ',
//     'ড়', 'ঢ়', 'য়'
//   ];
  
//   const vowels = ['া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ে', 'ৈ', 'ো', 'ৌ'];
  
//   consonants.forEach(consonant => {
//     vowels.forEach(vowel => {
//       const pattern = consonant + 'ঁ' + vowel;
//       const replacement = consonant + vowel;
//       cleaned = cleaned.split(pattern).join(replacement);
//     });
//   });
  
//   return cleaned;
// }

// async function extractTextBlocks(buffer) {
//   const pdf = await pdfjsLib.getDocument({
//     data: new Uint8Array(buffer),
//     useSystemFonts: true,
//   }).promise;

//   const allBlocks = [];

//   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//     const page = await pdf.getPage(pageNum);
//     const textContent = await page.getTextContent();
    
//     const lineGroups = [];
    
//     for (const item of textContent.items) {
//       if (!item.str || item.str.trim() === '') continue;
      
//       const transform = item.transform;
//       const x = transform[4];
//       const y = transform[5];
//       const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]) || 11;
//       const textWidth = item.width || (item.str.length * fontSize * 0.6);
      
//       let foundGroup = false;
//       for (const group of lineGroups) {
//         if (Math.abs(group.baseY - y) < 5) {
//           group.items.push({
//             str: item.str,
//             x: x,
//             y: y,
//             width: textWidth,
//             fontSize: fontSize,
//             height: item.height || fontSize * 1.2,
//           });
//           foundGroup = true;
//           break;
//         }
//       }
      
//       if (!foundGroup) {
//         lineGroups.push({
//           baseY: y,
//           items: [{
//             str: item.str,
//             x: x,
//             y: y,
//             width: textWidth,
//             fontSize: fontSize,
//             height: item.height || fontSize * 1.2,
//           }],
//         });
//       }
//     }
    
//     for (const group of lineGroups) {
//       group.items.sort((a, b) => a.x - b.x);
//       const combinedText = group.items.map(item => item.str).join(' ').trim();
      
//       const firstItem = group.items[0];
//       const lastItem = group.items[group.items.length - 1];
      
//       let minX = firstItem.x;
//       let maxX = lastItem.x + lastItem.width;
//       let minY = Math.min(...group.items.map(i => i.y));
//       let maxY = Math.max(...group.items.map(i => i.y + i.height));
      
//       const avgFontSize = group.items.reduce((sum, i) => sum + i.fontSize, 0) / group.items.length;
//       const baselineY = firstItem.y;
      
//       allBlocks.push({
//         text: combinedText,
//         translated: '',
//         bbox: {
//           left: minX,
//           bottom: minY,
//           right: maxX,
//           top: maxY,
//           width: maxX - minX,
//           height: maxY - minY,
//         },
//         baselineY: baselineY,
//         avgFontSize: avgFontSize,
//         page: pageNum - 1,
//       });
//     }
//   }

//   return allBlocks;
// }

// services/pdf.service.js with full debugging

// services/pdf.service.js - Fixed version
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { PDFDocument, rgb } from "pdf-lib";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// import fontkit from "@pdf-lib/fontkit";
// import { translateBatch } from "./translate.service.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export async function processPDF(buffer) {
//   try {
//     const pdfDoc = await PDFDocument.load(buffer);
//     pdfDoc.registerFontkit(fontkit);
//     const pages = pdfDoc.getPages();

//     // Load Assamese font with proper encoding
//     const font = await loadAssameseFont(pdfDoc);

//     console.log("📄 Extracting text from PDF...");
//     const textBlocks = await extractTextBlocks(buffer);
//     console.log(`📝 Found ${textBlocks.length} text blocks`);

//     const textsToTranslate = textBlocks.map(block => block.text);
    
//     console.log("🌐 Translating texts...");
//     const translatedTexts = await translateBatch(textsToTranslate);
    
//     textBlocks.forEach((block, index) => {
//       block.translated = translatedTexts[index] || block.text;
//     });

//     console.log("✏️ Drawing translated text...");
//     for (const block of textBlocks) {
//       const page = pages[block.page];
      
//       // Get translated text
//       const translatedText = block.translated || block.text;
      
//       // Convert text to proper format for pdf-lib
//       const encodedText = encodeUnicodeForPdfLib(translatedText);
      
//       const fontSize = block.avgFontSize || 12;
      
//       // Measure text width using encoded text
//       const textWidth = font.widthOfTextAtSize(encodedText, fontSize);
      
//       // Draw white background
//       page.drawRectangle({
//         x: block.bbox.left - 2,
//         y: block.bbox.bottom - 2,
//         width: Math.max(textWidth, block.bbox.width) + 8,
//         height: block.bbox.height + 6,
//         color: rgb(1, 1, 1),
//       });
      
//       // Draw translated text with proper encoding
//       page.drawText(encodedText, {
//         x: block.bbox.left,
//         y: block.baselineY,
//         size: fontSize,
//         font: font,
//         color: rgb(0, 0, 0),
//       });
//     }

//     console.log("✅ PDF processing complete");
    
//     // Save with proper options
//     const pdfBytes = await pdfDoc.save({
//       useObjectStreams: false,
//       addDefaultPage: false,
//     });
    
//     return pdfBytes;
    
//   } catch (error) {
//     console.error("❌ Error processing PDF:", error);
//     throw error;
//   }
// }

// // Function to encode Unicode text for pdf-lib
// function encodeUnicodeForPdfLib(text) {
//   // pdf-lib expects text in a specific format
//   // This ensures proper character mapping
//   return text.normalize('NFC');
// }

// // Function to load Assamese font with proper glyph mapping
// async function loadAssameseFont(pdfDoc) {
//   const fontPath = path.join(__dirname, "../../fonts/hello.ttf");
  
//   if (!fs.existsSync(fontPath)) {
//     throw new Error(`Font not found at ${fontPath}`);
//   }
  
//   console.log(`✅ Loading font: ${fontPath}`);
//   const fontBytes = fs.readFileSync(fontPath);
  
//   // Try different embedding options
//   let font;
  
//   try {
//     // Option 1: Embed with subset: false
//     font = await pdfDoc.embedFont(fontBytes, {
//       subset: false,
//     });
//     console.log("✅ Font embedded with subset: false");
//   } catch (error) {
//     console.warn("⚠️ Failed with subset: false, trying default embedding");
    
//     try {
//       // Option 2: Default embedding
//       font = await pdfDoc.embedFont(fontBytes);
//       console.log("✅ Font embedded with default options");
//     } catch (error2) {
//       console.error("❌ Failed to embed font:", error2);
//       throw error2;
//     }
//   }
  
//   return font;
// }

// async function extractTextBlocks(buffer) {
//   const pdf = await pdfjsLib.getDocument({
//     data: new Uint8Array(buffer),
//     useSystemFonts: true,
//   }).promise;

//   const allBlocks = [];

//   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//     const page = await pdf.getPage(pageNum);
//     const textContent = await page.getTextContent();
    
//     const lineGroups = [];
    
//     for (const item of textContent.items) {
//       if (!item.str || item.str.trim() === '') continue;
      
//       const transform = item.transform;
//       const x = transform[4];
//       const y = transform[5];
//       const fontSize = Math.abs(transform[0]) || 12;
//       const textWidth = item.width || (item.str.length * fontSize * 0.6);
      
//       let foundGroup = false;
//       for (const group of lineGroups) {
//         if (Math.abs(group.baseY - y) < 5) {
//           group.items.push({
//             str: item.str,
//             x: x,
//             y: y,
//             width: textWidth,
//             fontSize: fontSize,
//             height: fontSize * 1.2,
//           });
//           foundGroup = true;
//           break;
//         }
//       }
      
//       if (!foundGroup) {
//         lineGroups.push({
//           baseY: y,
//           items: [{
//             str: item.str,
//             x: x,
//             y: y,
//             width: textWidth,
//             fontSize: fontSize,
//             height: fontSize * 1.2,
//           }],
//         });
//       }
//     }
    
//     for (const group of lineGroups) {
//       group.items.sort((a, b) => a.x - b.x);
//       const combinedText = group.items.map(item => item.str).join(' ').trim();
      
//       const firstItem = group.items[0];
//       const lastItem = group.items[group.items.length - 1];
      
//       const minX = firstItem.x;
//       const maxX = lastItem.x + lastItem.width;
//       const minY = Math.min(...group.items.map(i => i.y));
//       const maxY = Math.max(...group.items.map(i => i.y + i.height));
      
//       const avgFontSize = group.items.reduce((sum, i) => sum + i.fontSize, 0) / group.items.length;
      
//       allBlocks.push({
//         text: combinedText,
//         translated: '',
//         bbox: {
//           left: minX,
//           bottom: minY,
//           right: maxX,
//           top: maxY,
//           width: maxX - minX,
//           height: maxY - minY,
//         },
//         baselineY: firstItem.y,
//         avgFontSize: avgFontSize,
//         page: pageNum - 1,
//       });
//     }
//   }

//   return allBlocks;
// }
// services/pdf.service.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfToPng from 'pdf-img-convert';
import { translateBatch } from "./translate.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function processPDF(buffer) {
  let browser = null;
  
  try {
    console.log("📄 Extracting text from PDF...");
    const textBlocks = await extractTextBlocks(buffer);
    console.log(`📝 Found ${textBlocks.length} text blocks`);

    // Translate all extracted text
    const textsToTranslate = textBlocks.map(block => block.text);
    
    console.log("🌐 Translating texts...");
    const translatedTexts = await translateBatch(textsToTranslate);
    
    // Add translations to blocks
    textBlocks.forEach((block, index) => {
      block.translated = translatedTexts[index] || block.text;
      console.log(`Original: ${block.text.substring(0, 50)}...`);
      console.log(`Translated: ${block.translated.substring(0, 50)}...`);
    });

    // Convert original PDF pages to high-quality images
    console.log("🖼️ Converting PDF pages to images...");
    const pageImages = await pdfToPng(buffer, {
      scale: 2.0,
      outputFormat: 'png',
    });
    console.log(`📸 Converted ${pageImages.length} pages to images`);

    // Build HTML with background images and text overlays
    console.log("🏗️ Building HTML template...");
    const htmlContent = buildHtmlWithOverlays(pageImages, textBlocks);

    // Launch Puppeteer and generate final PDF
    console.log("🖥️ Rendering final PDF with Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF
    const outputPdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    });

    console.log("✅ PDF processing complete");
    return outputPdfBuffer;
    
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function buildHtmlWithOverlays(pageImages, textBlocks) {
  let pagesHtml = '';
  
  // Use Noto Sans Bengali (works perfectly for Assamese)
  const fontFamily = "'Noto Sans Bengali', 'Noto Sans', 'Arial Unicode MS', sans-serif";

  for (let pageNum = 0; pageNum < pageImages.length; pageNum++) {
    const imageBuffer = pageImages[pageNum];
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Get text blocks for this page
    const pageBlocks = textBlocks.filter(block => block.page === pageNum);
    
    // Sort blocks by Y position
    pageBlocks.sort((a, b) => b.bbox.bottom - a.bbox.bottom);
    
    let textOverlays = '';
    pageBlocks.forEach((block, index) => {
      const translatedText = block.translated || block.text;
      
      // Escape HTML special characters
      const escapedText = translatedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      const leftPos = block.bbox.left;
      const topPos = block.bbox.bottom;
      const fontSize = block.avgFontSize || 12;
      
      textOverlays += `
        <div class="text-overlay noto-sans-bengali-assamese" style="
          position: absolute;
          left: ${leftPos}px;
          top: ${topPos}px;
          font-family: ${fontFamily};
          font-size: ${fontSize}px;
          font-weight: 400;
          color: #000000;
          background-color: #ffffff;
          padding: 2px 6px;
          white-space: nowrap;
          z-index: ${index + 10};
          border-radius: 2px;
          line-height: 1.5;
        ">${escapedText}</div>
      `;
    });

    pagesHtml += `
      <div class="pdf-page" style="
        position: relative;
        width: 100%;
        height: 100vh;
        page-break-after: always;
        background-image: url('${base64Image}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: top left;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        overflow: hidden;
      ">
        ${textOverlays}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="as">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <!-- Google Fonts Import - Noto Sans Bengali (supports Assamese) -->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');
      </style>
      
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: white;
          font-family: ${fontFamily};
        }
        
        .pdf-page {
          position: relative;
          box-sizing: border-box;
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        .pdf-page:last-child {
          page-break-after: auto;
        }
        
        .text-overlay {
          font-optical-sizing: auto;
          font-style: normal;
          font-variation-settings: "wdth" 100;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Custom class for Assamese text */
        .noto-sans-bengali-assamese {
          font-family: "Noto Sans Bengali", "Noto Sans", sans-serif;
          font-optical-sizing: auto;
          font-weight: 400;
          font-style: normal;
          font-variation-settings: "wdth" 100;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;
}

async function extractTextBlocks(buffer) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const allBlocks = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const lineGroups = [];
    
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      
      const transform = item.transform;
      const x = transform[4];
      const y = transform[5];
      const fontSize = Math.abs(transform[0]) || 12;
      const textWidth = item.width || (item.str.length * fontSize * 0.6);
      
      let foundGroup = false;
      for (const group of lineGroups) {
        if (Math.abs(group.baseY - y) < 5) {
          group.items.push({
            str: item.str,
            x: x,
            y: y,
            width: textWidth,
            fontSize: fontSize,
            height: fontSize * 1.2,
          });
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        lineGroups.push({
          baseY: y,
          items: [{
            str: item.str,
            x: x,
            y: y,
            width: textWidth,
            fontSize: fontSize,
            height: fontSize * 1.2,
          }],
        });
      }
    }
    
    for (const group of lineGroups) {
      group.items.sort((a, b) => a.x - b.x);
      const combinedText = group.items.map(item => item.str).join(' ').trim();
      
      const firstItem = group.items[0];
      const lastItem = group.items[group.items.length - 1];
      
      const minX = firstItem.x;
      const maxX = lastItem.x + lastItem.width;
      const minY = Math.min(...group.items.map(i => i.y));
      const maxY = Math.max(...group.items.map(i => i.y + i.height));
      
      const avgFontSize = group.items.reduce((sum, i) => sum + i.fontSize, 0) / group.items.length;
      
      allBlocks.push({
        text: combinedText,
        translated: '',
        bbox: {
          left: minX,
          bottom: minY,
          right: maxX,
          top: maxY,
          width: maxX - minX,
          height: maxY - minY,
        },
        baselineY: firstItem.y,
        avgFontSize: avgFontSize,
        page: pageNum - 1,
      });
    }
  }

  return allBlocks;
}