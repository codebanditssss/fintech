import OpenAI from 'openai';
import pdf from 'pdf-parse';

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

/**
 * Convert PDF file to text using pdf-parse
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const data = await pdf(fileBuffer);
    return {
      text: data.text,
      pages: data.numpages,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract financial data using OpenAI GPT-4
 */
export async function extractFinancialDataWithAI(
  pdfText: string,
  filename: string,
  totalPages: number
): Promise<ExtractionResult> {
  try {
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
    
    // Parse response - handle both direct array and wrapped object
    let parsed;
    try {
      parsed = JSON.parse(responseText);
      // If it's an object with a results key, use that
      if (parsed.results && Array.isArray(parsed.results)) {
        parsed = parsed.results;
      }
      // If it's wrapped in any key, try to find the array
      if (!Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            parsed = parsed[key];
            break;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      parsed = [];
    }

    // Ensure it's an array
    const results: ExtractedFinancialData[] = Array.isArray(parsed) ? parsed : [];

    // Validate and clean results
    const validResults = results
      .filter(r => r.term && r.value)
      .map(r => ({
        page: Math.min(Math.max(1, r.page || 1), totalPages),
        term: String(r.term).trim(),
        value: String(r.value).replace(/[^\d.,]/g, '').trim(),
        evidence: String(r.evidence || '').substring(0, 200).trim(),
        confidence: Math.min(Math.max(0, r.confidence || 90), 100),
      }));

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

/**
 * Process a single PDF file with OpenAI
 */
export async function processPDFWithAI(
  file: File
): Promise<ExtractionResult> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const { text, pages } = await extractTextFromPDF(buffer);

    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF - possibly a scanned document');
    }

    // Use OpenAI to extract financial data
    const result = await extractFinancialDataWithAI(text, file.name, pages);

    return result;
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    throw error;
  }
}

/**
 * Batch process multiple PDFs
 */
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

