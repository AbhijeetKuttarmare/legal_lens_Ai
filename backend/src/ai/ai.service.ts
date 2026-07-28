import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
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

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  ur: 'Urdu',
};

function languageName(code?: string): string {
  return SUPPORTED_LANGUAGES[code || 'en'] || 'English';
}

const ANALYSIS_SYSTEM_PROMPT_BASE = `You are LegalLens AI, a document explainer that turns legal and business documents into plain, simple language. You are NOT a lawyer and must never claim to give legal advice.

Given the extracted text of a document, analyze it and produce:
- documentType: the closest matching type
- summary: 2-5 short plain-language sentences describing what this document does, for a non-lawyer
- clauses: 4-10 short field/value pairs (e.g. Salary / ₹800000, Notice Period / 90 Days)
- riskScore: integer 0-100 (higher = riskier for the person signing/receiving this document)
- riskLevel: LOW, MEDIUM, or HIGH
- riskFlags: 0-8 flagged concerns with severity, a short title, and a one-sentence explanation
- suggestions: 2-6 short questions or negotiation points to raise before signing

Keep language simple, avoid legal jargon, and be concise.`;

function analysisSystemPrompt(language?: string): string {
  const name = languageName(language);
  if (name === 'English') return ANALYSIS_SYSTEM_PROMPT_BASE;
  return `${ANALYSIS_SYSTEM_PROMPT_BASE}\n\nWrite all free-text output fields (summary, clause labels and values, risk flag titles and details, suggestions) in ${name}. Keep "documentType", "riskLevel" and flag "severity" as the exact English enum values given, not translated. If an "extractedText" field is requested, it must be a literal transcription of the document in its original language exactly as written — never translate it.`;
}

const CHAT_SYSTEM_PROMPT_BASE = `You are LegalLens AI, a friendly document explainer. Answer the user's question using ONLY the provided document text as context. Explain in simple, plain language. If the answer isn't in the document, say so clearly.
Always end your answer with this exact disclaimer on its own line: "This is an informational explanation, not professional legal advice. Consult a qualified lawyer for important decisions."`;

function chatSystemPrompt(documentText: string, language?: string): string {
  const name = languageName(language);
  const languageLine =
    name === 'English' ? '' : `\n\nRespond in ${name}, including the disclaimer line.`;
  return `${CHAT_SYSTEM_PROMPT_BASE}${languageLine}\n\nDocument text:\n${documentText}`;
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    documentType: { type: 'string', enum: DOCUMENT_TYPES },
    summary: { type: 'string' },
    clauses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value'],
        additionalProperties: false,
      },
    },
    riskScore: { type: 'integer' },
    riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    riskFlags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          title: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['severity', 'title', 'detail'],
        additionalProperties: false,
      },
    },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'documentType',
    'summary',
    'clauses',
    'riskScore',
    'riskLevel',
    'riskFlags',
    'suggestions',
  ],
  additionalProperties: false,
};

const IMAGE_ANALYSIS_SCHEMA = {
  ...ANALYSIS_SCHEMA,
  properties: {
    ...ANALYSIS_SCHEMA.properties,
    extractedText: {
      type: 'string',
      description: 'Full plain-text transcription of every word visible in the document image.',
    },
  },
  required: [...ANALYSIS_SCHEMA.required, 'extractedText'],
};

const IMAGE_MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png'> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
};

function firstText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text : '';
}

@Injectable()
export class AiService {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
  }

  async analyzeDocument(text: string, language?: string): Promise<DocumentAnalysis> {
    try {
      const truncated = text.slice(0, 20000);
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        thinking: { type: 'disabled' },
        system: analysisSystemPrompt(language),
        messages: [{ role: 'user', content: truncated }],
        output_config: {
          format: { type: 'json_schema', schema: ANALYSIS_SCHEMA },
        },
      } as Anthropic.MessageCreateParamsNonStreaming);

      const raw = firstText(response.content) || '{}';
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
        `AI analysis failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }

  async analyzeDocumentFromImage(
    filePath: string,
    mimeType: string,
    language?: string,
  ): Promise<{ analysis: DocumentAnalysis; extractedText: string }> {
    const mediaType = IMAGE_MEDIA_TYPES[mimeType];
    if (!mediaType) {
      throw new InternalServerErrorException(`Unsupported image type: ${mimeType}`);
    }
    try {
      const base64 = fs.readFileSync(filePath).toString('base64');
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        thinking: { type: 'disabled' },
        system: analysisSystemPrompt(language),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: 'This image is a photo/scan of a document. Read all the text in it and analyze it.',
              },
            ],
          },
        ],
        output_config: {
          format: { type: 'json_schema', schema: IMAGE_ANALYSIS_SCHEMA },
        },
      } as Anthropic.MessageCreateParamsNonStreaming);

      const raw = firstText(response.content) || '{}';
      const parsed = JSON.parse(raw);
      return {
        analysis: {
          documentType: parsed.documentType || 'OTHER',
          summary: parsed.summary || '',
          clauses: parsed.clauses || [],
          riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0,
          riskLevel: parsed.riskLevel || 'LOW',
          riskFlags: parsed.riskFlags || [],
          suggestions: parsed.suggestions || [],
        },
        extractedText: parsed.extractedText || '',
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `AI image analysis failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }

  async chatAboutDocument(
    documentText: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    question: string,
    language?: string,
  ): Promise<string> {
    try {
      const truncated = documentText.slice(0, 20000);
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: chatSystemPrompt(truncated, language),
        messages: [...history, { role: 'user', content: question }],
      });

      return firstText(response.content) || 'Sorry, I could not generate an answer.';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI chat failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }
}
