import * as fs from 'fs';
import * as mammoth from 'mammoth';

export async function extractText(
  filePath: string,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'application/pdf') {
    // pdf-parse has no typed ESM export; require keeps it simple in CommonJS output
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
    throw new Error(
      'Image OCR is not enabled in this build yet. Please upload a PDF or DOCX for now.',
    );
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
