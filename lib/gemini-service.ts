import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

/**
 * Convert image/PDF file to base64 for Gemini
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Get MIME type from file
 */
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

/**
 * Extract financial data from handwritten invoice using Gemini
 */
export async function extractFinancialDataWithGemini(
  file: File
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== Processing ${file.name} with Gemini ==========`);
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const mimeType = getMimeType(file);
    
    console.log(`✓ File converted to base64: ${base64Data.length} characters`);
    console.log(`✓ MIME type: ${mimeType}`);

    // Initialize Gemini model (using gemini-1.5-pro for better accuracy on handwritten text)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000, // Increased to handle more extraction results
      }
    });

    const prompt = `You are a financial document analyzer specialized in extracting data from handwritten invoices. Analyze this image/PDF and extract ALL financial terms and their values.

CRITICAL REQUIREMENTS:
1. This is a HANDWRITTEN invoice - carefully read ALL handwritten text, especially numbers and financial terms
2. You MUST extract "Subtotal" and "Discount" values - these are CRITICAL fields
3. For Discount: Extract BOTH the percentage (if shown) AND the dollar amount. If both exist, extract the dollar amount as the value (e.g., if "-$500.00" is written, extract "-500.00")
4. For Subtotal: Extract the subtotal amount before discounts/taxes are applied
5. Look for ALL these terms: Subtotal, Discount, Tax, GST, CGST, SGST, IGST, VAT, Service Tax, TDS, Surcharge, Cess, Invoice Total, Net Amount, Gross Amount, Total, Amount Due, etc.
6. Extract the EXACT term name as written (case-sensitive: "Subtotal", "Discount", "Tax", etc.)
7. For values: 
   - Remove currency symbols ($, Rs., etc.) and commas
   - PRESERVE negative signs for discounts (e.g., "-500.00")
   - For percentages, extract the dollar amount if shown, or convert percentage to amount if needed
   - Extract only numeric values with decimals (e.g., "5250.00", "-500.00", "225.00")
8. For each term, capture surrounding context (evidence) showing where it appears
9. Page number defaults to 1 if single page
10. Confidence score (0-100) based on clarity

SPECIAL INSTRUCTIONS FOR KEY FIELDS:
- "Subtotal": Look for amounts labeled as "Subtotal", "Sub Total", "Sub-total" before discounts
- "Discount": Look for discount amounts (may be negative like "-$500.00" or percentage like "10%"). Extract the dollar amount value.
- "Tax": Extract tax amounts (may be percentage + amount)

EXAMPLES:
If you see "Subtotal: $5,250.00", extract: {"term": "Subtotal", "value": "5250.00"}
If you see "Discount: 10.00% -$500.00", extract: {"term": "Discount", "value": "-500.00"}
If you see "Discount: -$500.00", extract: {"term": "Discount", "value": "-500.00"}
If you see "Tax: 5.00% $225.00", extract: {"term": "Tax", "value": "225.00"}

Return a JSON array with this EXACT structure:
[
  {
    "page": 1,
    "term": "Subtotal",
    "value": "5250.00",
    "evidence": "Subtotal: $5,250.00 written on invoice",
    "confidence": 95
  },
  {
    "page": 1,
    "term": "Discount",
    "value": "-500.00",
    "evidence": "Discount: 10.00% -$500.00 written on invoice",
    "confidence": 95
  }
]

Return ONLY the JSON array, no markdown, no explanation, no other text. Make sure to extract Subtotal and Discount if they exist in the document.`;

    // Prepare the image data
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    console.log(`\n========== SENDING TO GEMINI ==========`);
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const responseText = response.text();

    console.log(`\n========== GEMINI RESPONSE ==========`);
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Full response:\n${responseText}`);
    console.log(`=====================================\n`);

    // Parse response
    let parsed;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText.trim();
      
      parsed = JSON.parse(jsonText);
      console.log('Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
      
      // Handle wrapped responses
      if (parsed.results && Array.isArray(parsed.results)) {
        parsed = parsed.results;
      } else if (parsed.term && parsed.value && !Array.isArray(parsed)) {
        parsed = [parsed];
      } else if (!Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            parsed = parsed[key];
            break;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      console.error('Raw response:', responseText);
      parsed = [];
    }

    // Ensure it's an array
    const results: ExtractedFinancialData[] = Array.isArray(parsed) ? parsed : [];
    console.log(`Converted to array with ${results.length} items`);

    // Validate and clean results
    const validResults = results
      .filter(r => r.term && r.value)
      .map(r => {
        // Preserve negative signs for discounts
        const rawValue = String(r.value).trim();
        const isNegative = rawValue.startsWith('-');
        // Remove currency symbols, commas, and percentage signs, but preserve minus
        let cleanedValue = rawValue.replace(/[$Rs.,%]/g, '').trim();
        
        // If it was negative, add back the minus sign
        if (isNegative && !cleanedValue.startsWith('-')) {
          cleanedValue = '-' + cleanedValue;
        }
        
        // Remove any non-digit characters except minus, dot, and digits
        cleanedValue = cleanedValue.replace(/[^\d.-]/g, '');
        
        // Ensure proper format: allow negative numbers with decimals
        if (!cleanedValue.match(/^-?\d+\.?\d*$/)) {
          // Fallback: extract all digits and decimal point, preserve minus if original had it
          const digits = cleanedValue.replace(/[^\d.]/g, '');
          cleanedValue = (isNegative ? '-' : '') + digits;
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
      totalPages: 1, // Gemini processes whole document at once
      results: validResults,
      rawText: '', // No raw text for image-based processing
    };
  } catch (error) {
    console.error('Gemini extraction error:', error);
    throw new Error(`Failed to extract financial data with Gemini: ${(error as Error).message}`);
  }
}

/**
 * Process a single handwritten invoice file with Gemini
 */
export async function processHandwrittenInvoiceWithGemini(
  file: File
): Promise<ExtractionResult> {
  try {
    console.log(`\n========== Processing Handwritten Invoice: ${file.name} ==========`);
    return await extractFinancialDataWithGemini(file);
  } catch (error) {
    console.error(`✗ Error processing ${file.name}:`, error);
    throw error;
  }
}

/**
 * Batch process multiple handwritten invoices
 */
export async function processHandwrittenInvoiceBatch(
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
      const result = await processHandwrittenInvoiceWithGemini(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      // Continue with other files even if one fails
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

