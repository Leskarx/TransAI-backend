import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fontkit from "@pdf-lib/fontkit";
import { translateBatch } from "./translate.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug flag
const DEBUG = true;

export async function processPDF(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();

    // Load Assamese font
    const font = await loadAssameseFont(pdfDoc);

    console.log("📄 Extracting text from PDF...");
    const textBlocks = await extractTextBlocks(buffer);
    console.log(`📝 Found ${textBlocks.length} text blocks`);

    const textsToTranslate = textBlocks.map(block => block.text);
    
    if (DEBUG) {
      console.log("\n=== ORIGINAL TEXT EXTRACTED ===");
      textsToTranslate.forEach((text, i) => {
        console.log(`[${i}] Original: "${text}"`);
        console.log(`    Bytes: ${Buffer.from(text, 'utf8').toString('hex')}`);
        console.log(`    Chars: ${[...text].map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
      });
    }
    
    console.log("🌐 Translating texts...");
    const translatedTexts = await translateBatch(textsToTranslate);
    
    if (DEBUG) {
      console.log("\n=== TRANSLATED TEXT RECEIVED ===");
      translatedTexts.forEach((text, i) => {
        console.log(`[${i}] Translated: "${text}"`);
        console.log(`    Bytes: ${Buffer.from(text, 'utf8').toString('hex')}`);
        console.log(`    Chars: ${[...text].map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
      });
    }
    
    textBlocks.forEach((block, index) => {
      block.translated = translatedTexts[index] || block.text;
    });

    console.log("✏️ Drawing translated text...");
    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      const page = pages[block.page];
      
      // Get the text before cleaning
      const beforeCleaning = block.translated || block.text;
      
      // Clean and fix the translated text
      let translatedText = cleanAssameseText(beforeCleaning);
      
      if (DEBUG) {
        console.log(`\n=== BLOCK ${i} - BEFORE RENDERING ===`);
        console.log(`Before cleaning: "${beforeCleaning}"`);
        console.log(`After cleaning:  "${translatedText}"`);
        console.log(`Bytes (after cleaning): ${Buffer.from(translatedText, 'utf8').toString('hex')}`);
        console.log(`Chars (after cleaning): ${[...translatedText].map(c => {
          const code = c.charCodeAt(0);
          return `${c}(${code.toString(16)})`;
        }).join(' ')}`);
      }
      
      const fontSize = block.avgFontSize || 11;
      
      // Test if font can render each character
      if (DEBUG) {
        console.log(`\n=== FONT RENDERING TEST ===`);
        for (const char of translatedText) {
          try {
            const charWidth = font.widthOfTextAtSize(char, fontSize);
            console.log(`  '${char}' (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) -> Width: ${charWidth}`);
          } catch (error) {
            console.log(`  '${char}' (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) -> ERROR: ${error.message}`);
          }
        }
      }
      
      // Measure full text width
      let textWidth;
      try {
        textWidth = font.widthOfTextAtSize(translatedText, fontSize);
        console.log(`Full text width: ${textWidth}`);
      } catch (error) {
        console.error(`Error measuring text width:`, error.message);
        textWidth = translatedText.length * fontSize * 0.6;
      }
      
      // Draw white background
      page.drawRectangle({
        x: block.bbox.left - 2,
        y: block.bbox.bottom - 2,
        width: Math.max(textWidth, block.bbox.width) + 4,
        height: block.bbox.height + 4,
        color: rgb(1, 1, 1),
      });
      
      // Draw translated text
      try {
        page.drawText(translatedText, {
          x: block.bbox.left,
          y: block.baselineY,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        console.log(`✅ Successfully drew text at x:${block.bbox.left}, y:${block.baselineY}`);
      } catch (error) {
        console.error(`❌ Error drawing text:`, error.message);
        console.error(`Text that caused error: "${translatedText}"`);
        
        // Try to draw character by character to identify problematic chars
        console.log(`\n=== DRAWING CHARACTER BY CHARACTER ===`);
        let xPos = block.bbox.left;
        for (const char of translatedText) {
          try {
            page.drawText(char, {
              x: xPos,
              y: block.baselineY,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
            xPos += font.widthOfTextAtSize(char, fontSize);
            console.log(`  ✓ Drew '${char}'`);
          } catch (charError) {
            console.log(`  ✗ Failed to draw '${char}': ${charError.message}`);
          }
        }
      }
    }

    console.log("\n✅ PDF processing complete");
    return await pdfDoc.save();
    
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    throw error;
  }
}

// Function to load the best available Assamese font
async function loadAssameseFont(pdfDoc) {
  const fontOptions = [
    {
      path: path.join(__dirname, "../../fonts/lohit_as.ttf"),
      name: "Lohit Assamese"
    },
    {
      path: path.join(__dirname, "../../fonts/NotoSansAssamese-Regular.ttf"),
      name: "Noto Sans Assamese"
    },
    {
      path: path.join(__dirname, "../../fonts/NotoSansBengali-Regular.ttf"),
      name: "Noto Sans Bengali"
    },
    {
      path: path.join(__dirname, "../../fonts/ARIALUNI.TTF"),
      name: "Arial Unicode MS"
    },
    {
      path: path.join(__dirname, "../../fonts/NotoSans-Regular.ttf"),
      name: "Noto Sans"
    }
  ];

  for (const option of fontOptions) {
    if (fs.existsSync(option.path)) {
      try {
        console.log(`✅ Loading font: ${option.name} from ${option.path}`);
        const fontBytes = fs.readFileSync(option.path);
        const font = await pdfDoc.embedFont(fontBytes);
        
        // Test if font can render Assamese characters
        const testChars = ['ম', 'ো', 'ৰ', 'ন', 'া', 'ম', 'গ', 'ৌ', 'ৰ', 'ী', 'শ', 'ং', 'ক', 'ৰ', 'ক', 'ো', 'ঁ', 'ৱ', 'ৰ', '।'];
        console.log(`\n=== FONT CHARACTER TEST ===`);
        let canRender = true;
        for (const char of testChars) {
          try {
            const width = font.widthOfTextAtSize(char, 12);
            console.log(`  ✓ '${char}' (U+${char.charCodeAt(0).toString(16).toUpperCase()}) - Width: ${width}`);
          } catch (e) {
            console.log(`  ✗ '${char}' (U+${char.charCodeAt(0).toString(16).toUpperCase()}) - FAILED`);
            canRender = false;
          }
        }
        
        if (canRender) {
          console.log(`✅ Font ${option.name} can render Assamese characters`);
          return font;
        } else {
          console.warn(`⚠️ Font ${option.name} cannot render all Assamese characters`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load ${option.name}:`, error.message);
      }
    } else {
      console.log(`ℹ️ Font not found: ${option.path}`);
    }
  }

  // Fallback to standard font
  console.warn("⚠️ No Assamese font found, using Helvetica (text may not render correctly)");
  return await pdfDoc.embedFont("Helvetica");
}

// Function to clean and fix Assamese text encoding
function cleanAssameseText(text) {
  if (!text) return text;
  
  if (DEBUG) {
    console.log(`\n=== TEXT CLEANING ===`);
    console.log(`Input: "${text}"`);
    console.log(`Input bytes: ${Buffer.from(text, 'utf8').toString('hex')}`);
  }
  
  // First, normalize Unicode
  let cleaned = text.normalize('NFC');
  
  // Fix specific corrupted character patterns
  const encodingFixes = {
    'Ǝ': 'আ',
    'Ɛ': 'ি',
    'Ƴ': 'ম',  // Added this - common corruption
    'Ï': 'ম',  // Added this - another common corruption
    'ৗ': 'ৌ',
    'অঁ': 'অং',
    'আঁ': 'আং',
    'ইঁ': 'ইং',
    'ঈঁ': 'ঈং',
    'উঁ': 'উং',
    'ঊঁ': 'ঊং',
    'ঋঁ': 'ঋং',
    'এঁ': 'এং',
    'ঐঁ': 'ঐং',
    'ওঁ': 'ওং',
    'ঔঁ': 'ঔং',
    'কঁ': 'কং',
    'খঁ': 'খং',
    'গঁ': 'গং',
    'ঘঁ': 'ঘং',
    'ঙঁ': 'ঙং',
    'চঁ': 'চং',
    'ছঁ': 'ছং',
    'জঁ': 'জং',
    'ঝঁ': 'ঝং',
    'ঞঁ': 'ঞং',
    'টঁ': 'টং',
    'ঠঁ': 'ঠং',
    'ডঁ': 'ডং',
    'ঢঁ': 'ঢং',
    'ণঁ': 'ণং',
    'তঁ': 'তং',
    'থঁ': 'থং',
    'দঁ': 'দং',
    'ধঁ': 'ধং',
    'নঁ': 'নং',
    'পঁ': 'পং',
    'ফঁ': 'ফং',
    'বঁ': 'বং',
    'ভঁ': 'ভং',
    'মঁ': 'মং',
    'যঁ': 'যং',
    'ৰঁ': 'ৰং',
    'লঁ': 'লং',
    'ৱঁ': 'ৱং',
    'শঁ': 'শং',
    'ষঁ': 'ষং',
    'সঁ': 'সং',
    'হঁ': 'হং',
    'ক্ষঁ': 'ক্ষং',
    'জ্ঞঁ': 'জ্ঞং',
  };
  
  // Apply all direct replacements
  for (const [garbled, correct] of Object.entries(encodingFixes)) {
    if (cleaned.includes(garbled)) {
      console.log(`  Replacing "${garbled}" -> "${correct}"`);
      cleaned = cleaned.split(garbled).join(correct);
    }
  }
  
  // Fix patterns like "কঁা" -> "কা"
  const consonants = [
    'ক', 'খ', 'গ', 'ঘ', 'ঙ',
    'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
    'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
    'ত', 'থ', 'দ', 'ধ', 'ন',
    'প', 'ফ', 'ব', 'ভ', 'ম',
    'য', 'ৰ', 'ল', 'ৱ',
    'শ', 'ষ', 'স', 'হ',
    'ড়', 'ঢ়', 'য়'
  ];
  
  const vowels = ['া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ে', 'ৈ', 'ো', 'ৌ'];
  
  consonants.forEach(consonant => {
    vowels.forEach(vowel => {
      const pattern = consonant + 'ঁ' + vowel;
      const replacement = consonant + vowel;
      if (cleaned.includes(pattern)) {
        console.log(`  Replacing pattern "${pattern}" -> "${replacement}"`);
        cleaned = cleaned.split(pattern).join(replacement);
      }
    });
  });
  
  if (DEBUG) {
    console.log(`Output: "${cleaned}"`);
    console.log(`Output bytes: ${Buffer.from(cleaned, 'utf8').toString('hex')}`);
  }
  
  return cleaned;
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
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]) || 11;
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
            height: item.height || fontSize * 1.2,
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
            height: item.height || fontSize * 1.2,
          }],
        });
      }
    }
    
    for (const group of lineGroups) {
      group.items.sort((a, b) => a.x - b.x);
      const combinedText = group.items.map(item => item.str).join(' ').trim();
      
      const firstItem = group.items[0];
      const lastItem = group.items[group.items.length - 1];
      
      let minX = firstItem.x;
      let maxX = lastItem.x + lastItem.width;
      let minY = Math.min(...group.items.map(i => i.y));
      let maxY = Math.max(...group.items.map(i => i.y + i.height));
      
      const avgFontSize = group.items.reduce((sum, i) => sum + i.fontSize, 0) / group.items.length;
      const baselineY = firstItem.y;
      
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
        baselineY: baselineY,
        avgFontSize: avgFontSize,
        page: pageNum - 1,
      });
    }
  }

  return allBlocks;
}

// Helper function to get character name (for debugging)
function getCharName(char) {
  const code = char.charCodeAt(0);
  try {
    // Simple names for Assamese range
    if (code >= 0x0980 && code <= 0x09FF) {
      return 'BENGALI/ASSAMESE';
    }
    if (code >= 0x0000 && code <= 0x007F) {
      return 'ASCII';
    }
    if (code >= 0x0080 && code <= 0x00FF) {
      return 'LATIN-1';
    }
    return 'OTHER';
  } catch {
    return 'UNKNOWN';
  }
}