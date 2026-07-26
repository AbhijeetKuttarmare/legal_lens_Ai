import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { DocumentAnalysis } from './ai.types';

const DOCUMENT_TYPES = [
  'RENTAL_AGREEMENT',
  'EMPLOYMENT_CONTRACT',
  'NDA',
  'PROPERTY_AGREEMENT',
  'LOAN_AGREEMENT',
  'MSA',
  'PARTNERSHIP_AGREEMENT',
  'OTHER',
];

const ANALYSIS_SYSTEM_PROMPT = `You are LegalLens AI, a document explainer that turns legal and business documents into plain, simple English. You are NOT a lawyer and must never claim to give legal advice.

Given the extracted text of a document, respond with ONLY a JSON object (no markdown fences) matching this shape:
{
  "documentType": one of ${JSON.stringify(DOCUMENT_TYPES)},
  "summary": "2-5 short plain-English sentences describing what this document does, for a non-lawyer",
  "clauses": [ { "label": "short field name e.g. Salary, Notice Period, Termination", "value": "short value e.g. 90 Days" }, ... 4-10 items ],
  "riskScore": integer 0-100 (higher = riskier for the person signing/receiving this document),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskFlags": [ { "severity": "low"|"medium"|"high", "title": "short flag title", "detail": "one sentence explanation" }, ... 0-8 items ],
  "suggestions": [ "short question or negotiation point to raise before signing", ... 2-6 items ]
}
Keep language simple, avoid legal jargon, and be concise.`;

const CHAT_SYSTEM_PROMPT = `You are LegalLens AI, a friendly document explainer. Answer the user's question using ONLY the provided document text as context. Explain in simple, plain English. If the answer isn't in the document, say so clearly.
Always end your answer with this exact disclaimer on its own line: "This is an informational explanation, not professional legal advice. Consult a qualified lawyer for important decisions."`;

@Injectable()
export class AiService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    try {
      const truncated = text.slice(0, 20000);
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: truncated },
        ],
        temperature: 0.2,
      });
      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      return {
        documentType: parsed.documentType || 'OTHER',
        summary: parsed.summary || '',
        clauses: parsed.clauses || [],
        riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0,
        riskLevel: parsed.riskLevel || 'LOW',
        riskFlags: parsed.riskFlags || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `AI analysis failed: ${(err as Error).message}. Check OPENAI_API_KEY in backend/.env`,
      );
    }
  }

  async chatAboutDocument(
    documentText: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    question: string,
  ): Promise<string> {
    try {
      const truncated = documentText.slice(0, 20000);
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          { role: 'system', content: `Document text:\n${truncated}` },
          ...history,
          { role: 'user', content: question },
        ],
        temperature: 0.3,
      });
      return (
        completion.choices[0]?.message?.content ||
        'Sorry, I could not generate an answer.'
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `AI chat failed: ${(err as Error).message}. Check OPENAI_API_KEY in backend/.env`,
      );
    }
  }
}
