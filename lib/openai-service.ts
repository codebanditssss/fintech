import OpenAI from 'openai';
const PDFParser = require('pdf2json');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedFinancialData {
  page: number;
  term: string;
  value: string;
  evidence: string;
  confidence: number;
}

export interface ExtractionResult {
  filename: string;
  totalPages: number;
  results: ExtractedFinancialData[];
  rawText: string;
}

export async function extractTextFromPDF(fileBuffer: Buffer): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Attempting to parse PDF, buffer size: ${fileBuffer.length} bytes`);
      
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          console.log(`✓ PDF loaded: ${pdfData.Pages.length} pages`);
          
          let fullText = '';
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const text of page.Texts) {
                for (const textRun of text.R) {
                  try {
                    const decoded = decodeURIComponent(textRun.T);
                    fullText += decoded + ' ';
                  } catch (e) {
                    fullText += textRun.T + ' ';
                  }
                }
              }
              fullText += '\n\n';
            }
          }
          
          console.log(`✓ Extracted ${fullText.length} characters from ${pdfData.Pages.length} pages`);
          console.log(`First 500 chars of extracted text:\n${fullText.substring(0, 500)}`);
          
          resolve({
            text: fullText.trim(),
            pages: pdfData.Pages.length,
          });
        } catch (error) {
          reject(error);
        }
      });
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('✗ PDF parsing error:', errData.parserError);
        reject(new Error(errData.parserError));
      });
      
      pdfParser.parseBuffer(fileBuffer);
    } catch (error) {
      console.error('✗ PDF parsing error:', error);
      reject(error);
    }
  });
}

export async function extractFinancialDataWithAI(
  pdfText: string,
  filename: string,
  totalPages: number
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== SENDING TO OPENAI ==========`);
    console.log(`Text length: ${pdfText.length} characters`);
    console.log(`First 500 chars:\n${pdfText.substring(0, 500)}`);
    console.log(`=======================================\n`);
    
    const prompt = `You are a financial document analyzer. Extract ALL financial terms and their values from this invoice/financial document.

IMPORTANT RULES:
1. Find ALL monetary values and their associated terms
2. Look for: GST, CGST, SGST, IGST, VAT, Service Tax, TDS, Surcharge, Cess, Invoice Total, Net Amount, Gross Amount, Subtotal, Discount, Tax, etc.
3. Extract the EXACT term as written in the document (preserve original spelling/format)
4. Extract numeric values only (remove currency symbols)
5. For each term, capture surrounding context (evidence)
6. Estimate page number based on text position (1-${totalPages})
7. Assign confidence score (0-100) based on clarity

Return a JSON array with this EXACT structure:
[
  {
    "page": 1,
    "term": "GST",
    "value": "2340.00",
    "evidence": "GST (18%): Rs. 2,340.00 on taxable amount",
    "confidence": 98
  }
]

DOCUMENT TEXT:
${pdfText}

Return ONLY the JSON array, no markdown, no explanation, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise financial document analyzer. Always return valid JSON arrays only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    console.log(`\n========== OPENAI RESPONSE ==========`);
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Full response:\n${responseText}`);
    console.log(`=====================================\n`);

    let parsed;
    try {
      parsed = JSON.parse(responseText);
      console.log('Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
      
      if (parsed.results && Array.isArray(parsed.results)) {
        console.log('Found results array in response');
        parsed = parsed.results;
      }
      else if (parsed.term && parsed.value && !Array.isArray(parsed)) {
        console.log('Single result object detected, wrapping in array');
        parsed = [parsed];
      }
      else if (!Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        console.log('Response keys:', keys);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            console.log(`Found array in key: ${key}`);
            parsed = parsed[key];
            break;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      parsed = [];
    }

    const results: ExtractedFinancialData[] = Array.isArray(parsed) ? parsed : [];
    console.log(`Converted to array with ${results.length} items`);

    const validResults = results
      .filter(r => r.term && r.value)
      .map(r => ({
        page: Math.min(Math.max(1, r.page || 1), totalPages),
        term: String(r.term).trim(),
        value: String(r.value).replace(/[^\d.,]/g, '').trim(),
        evidence: String(r.evidence || '').replace(/\s+/g, ' ').trim().substring(0, 200),
        confidence: Math.min(Math.max(0, r.confidence || 90), 100),
      }));

    console.log(`✓ Validated ${validResults.length} financial terms`);
    if (validResults.length > 0) {
      console.log(`Sample extracted terms:`, validResults.slice(0, 2).map(r => `${r.term}: ${r.value}`).join(', '));
    }

    return {
      filename,
      totalPages,
      results: validResults,
      rawText: pdfText,
    };
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw new Error('Failed to extract financial data with AI');
  }
}

export async function processPDFWithAI(
  file: File
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== Processing ${file.name} ==========`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✓ Converted to buffer: ${buffer.length} bytes`);

    const { text, pages } = await extractTextFromPDF(buffer);
    console.log(`✓ Extracted text: ${text.length} characters, ${pages} pages`);
    console.log(`First 500 chars: ${text.substring(0, 500)}`);

    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF - possibly a scanned document');
    }

    const result = await extractFinancialDataWithAI(text, file.name, pages);
    console.log(`✓ OpenAI returned ${result.results.length} results`);

    return result;
  } catch (error) {
    console.error(`✗ Error processing ${file.name}:`, error);
    throw error;
  }
}

export async function processPDFBatch(
  files: File[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }

    try {
      const result = await processPDFWithAI(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      results.push({
        filename: file.name,
        totalPages: 0,
        results: [],
        rawText: '',
      });
    }
  }

  return results;
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

function getMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

export async function extractFinancialDataFromImage(
  file: File
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== Processing ${file.name} with OpenAI Vision ==========`);
    
    const base64Data = await fileToBase64(file);
    const mimeType = getMimeType(file);
    
    console.log(`✓ File converted to base64: ${base64Data.length} characters`);
    console.log(`✓ MIME type: ${mimeType}`);

    const prompt = `You are an expert financial document OCR and data extraction specialist. Analyze this HANDWRITTEN invoice image and extract ALL financial terms and their values.

STEP-BY-STEP PROCESS:
1. FIRST, carefully read through the ENTIRE document, focusing on:
   - All numerical values
   - All financial term labels (Subtotal, Discount, Tax, Total, etc.)
   - Any percentages
   - Any negative amounts

2. IDENTIFY these CRITICAL fields (they MUST be extracted if present):
   - "Subtotal" or "Sub Total" - the amount before discounts/taxes
   - "Discount" - can appear as percentage (10%) or dollar amount (-$500.00) or both
   - "Tax" - can appear as percentage (5%) or dollar amount ($225.00) or both
   - "Total" or "Invoice Total" or "Amount Due" - final amount
   - Line items with rates, quantities, and totals
   - Any GST, VAT, TDS, Cess, Surcharge, etc.

3. EXTRACTION RULES:
   - Extract EVERY financial term you find, not just a few
   - For "Discount": If both percentage AND dollar amount are shown, extract the DOLLAR AMOUNT
   - For "Tax": Extract the dollar amount value. If only percentage is shown, note it in evidence but extract the calculated amount
   - Preserve exact term spelling as written (handwritten may have variations)
   - Remove currency symbols ($, Rs., €, etc.), commas, plus signs (+), and minus signs (-) from values
   - Extract numbers EXACTLY as written - DO NOT add extra zeros or decimal places
   - If a number is "100", extract "100" NOT "100.00" or "10000"
   - If a number is "100.50", extract "100.50" (preserve the decimal as written)
   - NEVER include + or - signs in the extracted values

4. VALUE FORMATTING:
   - Remove: $, Rs., commas, currency symbols, + signs, - signs
   - Keep: numbers, decimal point (only if present in source)
   - Extract numbers EXACTLY as they appear - do not modify or add zeros, remove all signs
   - Examples: "$5,250.00" → "5250.00", "$100" → "100" (not "100.00"), "-$500.00" → "500.00", "+$225.00" → "225.00", "10%" → extract dollar amount if available

5. TERM VARIATIONS TO RECOGNIZE:
   - "Subtotal", "Sub Total", "Sub-total", "Sub total"
   - "Discount", "Disc.", "Disc"
   - "Tax", "Taxes", "GST", "VAT"
   - "Total", "Invoice Total", "Amount Due", "Grand Total"

CRITICAL: You MUST extract "Subtotal" and "Discount" if they are visible in the image, even if handwritten unclearly. Look carefully in the summary/totals section at the bottom of the invoice.

Return a JSON object with a "results" key containing an array with this EXACT structure:
{
  "results": [
    {"page": 1, "term": "Subtotal", "value": "5250", "evidence": "Subtotal: $5,250 written clearly in bottom section", "confidence": 98},
    {"page": 1, "term": "Discount", "value": "500", "evidence": "Discount: 10% -$500 shown in summary section", "confidence": 97},
    {"page": 1, "term": "Tax", "value": "225", "evidence": "Tax: 5% $225 written next to Tax label", "confidence": 96},
    {"page": 1, "term": "Total", "value": "4725", "evidence": "Total: $4,725 shown at bottom", "confidence": 98}
  ]
}

IMPORTANT:
- Extract at least 5-10 financial terms if possible (don't stop at just 2-3)
- Include line item totals if visible
- Return ONLY valid JSON object with "results" key, nothing else
- Every extracted term must have: page, term, value, evidence, confidence`;

    console.log(`\n========== SENDING TO OPENAI VISION ==========`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise financial document analyzer specialized in OCR and handwritten text recognition. Always return valid JSON arrays only.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    console.log(`\n========== OPENAI VISION RESPONSE ==========`);
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Full response:\n${responseText}`);
    console.log(`============================================\n`);

    let parsed;
    try {
      parsed = JSON.parse(responseText);
      console.log('Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
      
      if (parsed.results && Array.isArray(parsed.results)) {
        console.log('Found results array in response');
        parsed = parsed.results;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        console.log('Found data array in response');
        parsed = parsed.data;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        console.log('Found items array in response');
        parsed = parsed.items;
      } else if (parsed.term && parsed.value && !Array.isArray(parsed)) {
        console.log('Single result object detected, wrapping in array');
        parsed = [parsed];
      } else if (!Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        console.log('Response keys:', keys);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            console.log(`Found array in key: ${key}`);
            parsed = parsed[key];
            break;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.error('Raw response (first 500 chars):', responseText.substring(0, 500));
      
      try {
        const fallbackMatch = responseText.match(/\[[\s\S]*\]/);
        if (fallbackMatch) {
          parsed = JSON.parse(fallbackMatch[0]);
          console.log('Fallback parsing successful');
        } else {
          parsed = [];
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        parsed = [];
      }
    }

    const results: ExtractedFinancialData[] = Array.isArray(parsed) ? parsed : [];
    console.log(`Converted to array with ${results.length} items`);

    const validResults = results
      .filter(r => r.term && r.value)
      .map(r => {
        const rawValue = String(r.value).trim();
        let cleanedValue = rawValue.replace(/[$Rs.,%\s+-]/g, '').trim();
        cleanedValue = cleanedValue.replace(/[+-]/g, '').trim();
        cleanedValue = cleanedValue.replace(/[^\d.]/g, '');

        if (!cleanedValue.match(/^\d+\.?\d*$/)) {
          cleanedValue = cleanedValue.replace(/[^\d.]/g, '');
        }
        
        return {
          page: Math.min(Math.max(1, r.page || 1), 10), // Default to page 1, max 10
          term: String(r.term).trim(),
          value: cleanedValue,
          evidence: String(r.evidence || '').substring(0, 200).trim(),
          confidence: Math.min(Math.max(0, r.confidence || 90), 100),
        };
      });

    console.log(`✓ Validated ${validResults.length} financial terms`);
    if (validResults.length > 0) {
      console.log(`All extracted terms:`);
      validResults.forEach((r, idx) => {
        console.log(`  [${idx + 1}] ${r.term}: ${r.value} (confidence: ${r.confidence}, page: ${r.page})`);
      });
    } else {
      console.warn(`⚠️ WARNING: No valid results extracted from ${file.name}`);
      console.warn(`Raw parsed data:`, parsed);
      console.warn(`Original response text length: ${responseText.length}`);
    }

    return {
      filename: file.name,
      totalPages: 1, // OpenAI processes whole document at once
      results: validResults,
      rawText: '', // No raw text for image-based processing
    };
  } catch (error) {
    console.error('OpenAI Vision extraction error:', error);
    throw new Error(`Failed to extract financial data with OpenAI Vision: ${(error as Error).message}`);
  }
}

export async function processHandwrittenInvoiceWithOpenAI(
  file: File
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== Processing Handwritten Invoice: ${file.name} ==========`);
    return await extractFinancialDataFromImage(file);
  } catch (error) {
    console.error(`✗ Error processing ${file.name}:`, error);
    throw error;
  }
}

export async function processHandwrittenInvoiceBatchOpenAI(
  files: File[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }

    try {
      const result = await processHandwrittenInvoiceWithOpenAI(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      results.push({
        filename: file.name,
        totalPages: 0,
        results: [],
        rawText: '',
      });
    }
  }

  return results;
}

