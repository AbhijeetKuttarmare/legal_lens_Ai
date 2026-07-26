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

const ANALYSIS_SYSTEM_PROMPT = `You are LegalLens AI, a document explainer that turns legal and business documents into plain, simple English. You are NOT a lawyer and must never claim to give legal advice.

Given the extracted text of a document, analyze it and produce:
- documentType: the closest matching type
- summary: 2-5 short plain-English sentences describing what this document does, for a non-lawyer
- clauses: 4-10 short field/value pairs (e.g. Salary / ₹800000, Notice Period / 90 Days)
- riskScore: integer 0-100 (higher = riskier for the person signing/receiving this document)
- riskLevel: LOW, MEDIUM, or HIGH
- riskFlags: 0-8 flagged concerns with severity, a short title, and a one-sentence explanation
- suggestions: 2-6 short questions or negotiation points to raise before signing

Keep language simple, avoid legal jargon, and be concise.`;

const CHAT_SYSTEM_PROMPT = `You are LegalLens AI, a friendly document explainer. Answer the user's question using ONLY the provided document text as context. Explain in simple, plain English. If the answer isn't in the document, say so clearly.
Always end your answer with this exact disclaimer on its own line: "This is an informational explanation, not professional legal advice. Consult a qualified lawyer for important decisions."`;

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

  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    try {
      const truncated = text.slice(0, 20000);
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        thinking: { type: 'disabled' },
        system: ANALYSIS_SYSTEM_PROMPT,
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
        system: ANALYSIS_SYSTEM_PROMPT,
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
  ): Promise<string> {
    try {
      const truncated = documentText.slice(0, 20000);
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: `${CHAT_SYSTEM_PROMPT}\n\nDocument text:\n${truncated}`,
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
