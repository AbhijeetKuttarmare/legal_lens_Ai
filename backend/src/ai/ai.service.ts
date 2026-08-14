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

// Split into two blocks so the (large, static-per-conversation) document text
// can carry its own cache_control marker. Every chat turn on the same
// document resends this same prefix — without caching, that's the full
// document cost paid again on every single message. With caching, only the
// first message in a conversation pays full price; every message after that
// reads the cached prefix at a fraction of the cost. The tiny instructions
// block above it is left uncached since caching it separately isn't worth
// the extra cache-write overhead for something this small.
function chatSystemBlocks(documentText: string, language?: string): Anthropic.TextBlockParam[] {
  const name = languageName(language);
  const languageLine =
    name === 'English' ? '' : `\n\nRespond in ${name}, including the disclaimer line.`;
  return [
    { type: 'text', text: `${CHAT_SYSTEM_PROMPT_BASE}${languageLine}` },
    {
      type: 'text',
      text: `Document text:\n${documentText}`,
      cache_control: { type: 'ephemeral' },
    },
  ];
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

const COMPARISON_SYSTEM_PROMPT_BASE = `You are LegalLens AI, comparing two documents for a non-lawyer. You are NOT a lawyer and must never claim to give legal advice.

Identify the meaningful differences between the two documents — payment terms, notice periods, liabilities, obligations, deadlines, and any other terms a person should know about before choosing between them or signing either one.

Produce:
- verdict: one or two plain-language sentences on which document is more favorable overall for the person receiving/signing it, and why
- differences: 3-10 items, each with the aspect being compared, what Document A says, what Document B says, and a short note on why it matters

Keep language simple, avoid legal jargon, and be concise.`;

function comparisonSystemPrompt(language?: string): string {
  const name = languageName(language);
  if (name === 'English') return COMPARISON_SYSTEM_PROMPT_BASE;
  return `${COMPARISON_SYSTEM_PROMPT_BASE}\n\nWrite all free-text output fields in ${name}.`;
}

const COMPARISON_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    differences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aspect: { type: 'string' },
          documentAValue: { type: 'string' },
          documentBValue: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['aspect', 'documentAValue', 'documentBValue', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdict', 'differences'],
  additionalProperties: false,
};

const KEY_DATES_SYSTEM_PROMPT_BASE = `You are LegalLens AI. Scan this document for any dates, deadlines, notice periods, renewal dates, expiry dates, or other time-bound obligations. For each one found, give a short label and a plain-language detail explaining what happens and when — use relative timing (e.g. "90 days from signing", "30 days before the end of the term") if no absolute date is given. If none are found, return an empty list. Do not invent dates that aren't in the text.`;

function keyDatesSystemPrompt(language?: string): string {
  const name = languageName(language);
  if (name === 'English') return KEY_DATES_SYSTEM_PROMPT_BASE;
  return `${KEY_DATES_SYSTEM_PROMPT_BASE}\n\nWrite the label and detail fields in ${name}.`;
}

const KEY_DATES_SCHEMA = {
  type: 'object',
  properties: {
    keyDates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['label', 'detail'],
        additionalProperties: false,
      },
    },
  },
  required: ['keyDates'],
  additionalProperties: false,
};

export const TEMPLATE_TYPES: Record<string, string> = {
  RENTAL_AGREEMENT: 'Rental Agreement (India)',
  RENTAL_AGREEMENT_US: 'Residential Lease Agreement (US)',
  RENTAL_AGREEMENT_UK: 'Assured Shorthold Tenancy Agreement (UK)',
  NDA: 'Non-Disclosure Agreement (India)',
  NDA_US: 'Non-Disclosure Agreement (US)',
  FREELANCE_CONTRACT: 'Freelance / Independent Contractor Agreement (India)',
  FREELANCE_CONTRACT_US: 'Independent Contractor Agreement (US)',
  EMPLOYMENT_OFFER_LETTER: 'Employment Offer Letter (India)',
  CONSULTING_AGREEMENT: 'Consulting Agreement (India)',
};

// Legal-system guidance per template, so jurisdiction-specific templates
// don't all default to Indian law/terminology.
const JURISDICTION_NOTES: Record<string, string> = {
  RENTAL_AGREEMENT: 'under Indian law, using terms like "lessor/lessee" and standard Indian stamp-duty and registration language',
  RENTAL_AGREEMENT_US: 'under general US residential landlord-tenant conventions, using terms like "landlord/tenant" and US-style clauses (security deposit limits, habitability, notice periods)',
  RENTAL_AGREEMENT_UK: 'under English/Welsh Assured Shorthold Tenancy (AST) conventions, using UK terminology (landlord/tenant, deposit protection scheme references, Section 21/Section 8 notice concepts)',
  NDA: 'under Indian contract law conventions',
  NDA_US: 'under general US contract law conventions, using US-style confidentiality and governing-law language',
  FREELANCE_CONTRACT: 'under Indian contract law conventions',
  FREELANCE_CONTRACT_US: 'under general US independent-contractor conventions, including a clear 1099/non-employee status clause',
  EMPLOYMENT_OFFER_LETTER: 'under Indian employment conventions, including CTC structure, notice period, and probation clauses',
  CONSULTING_AGREEMENT: 'under Indian contract law conventions, covering scope of services, fees, IP ownership, and termination',
};

function templateSystemPrompt(templateType: string, templateLabel: string, language?: string): string {
  const name = languageName(language);
  const languageLine = name === 'English' ? '' : `\n\nWrite the document in ${name}.`;
  const jurisdictionNote = JURISDICTION_NOTES[templateType] || 'using standard, widely-accepted clauses for this document type';
  return `You are LegalLens AI, drafting a DRAFT ${templateLabel} template for a non-lawyer based on the details they provide. You are NOT a lawyer and this is NOT legal advice.

Rules:
- Start the document with this exact notice on its own line: "DRAFT — Generated by AI. Not legal advice. Have a qualified lawyer review this before signing or using it."
- Use standard, fair, commonly-used clauses for this document type, ${jurisdictionNote}.
- Fill in the details the user provided. For any detail not provided, use a clear placeholder like [TENANT NAME] instead of inventing information.
- Output clean plain text with clear section headings and numbered clauses. No markdown, no commentary outside the document itself.${languageLine}`;
}

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

  async compareDocuments(
    docA: { name: string; text: string },
    docB: { name: string; text: string },
    language?: string,
  ): Promise<{
    verdict: string;
    differences: { aspect: string; documentAValue: string; documentBValue: string; note: string }[];
  }> {
    try {
      const prompt = `Document A is "${docA.name}":\n${docA.text.slice(0, 10000)}\n\nDocument B is "${docB.name}":\n${docB.text.slice(0, 10000)}`;
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        thinking: { type: 'disabled' },
        system: comparisonSystemPrompt(language),
        messages: [{ role: 'user', content: prompt }],
        output_config: {
          format: { type: 'json_schema', schema: COMPARISON_SCHEMA },
        },
      } as Anthropic.MessageCreateParamsNonStreaming);

      const raw = firstText(response.content) || '{}';
      const parsed = JSON.parse(raw);
      return {
        verdict: parsed.verdict || '',
        differences: parsed.differences || [],
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `AI comparison failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }

  async extractKeyDates(
    text: string,
    language?: string,
  ): Promise<{ label: string; detail: string }[]> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1200,
        thinking: { type: 'disabled' },
        system: keyDatesSystemPrompt(language),
        messages: [{ role: 'user', content: text.slice(0, 15000) }],
        output_config: {
          format: { type: 'json_schema', schema: KEY_DATES_SCHEMA },
        },
      } as Anthropic.MessageCreateParamsNonStreaming);

      const raw = firstText(response.content) || '{}';
      const parsed = JSON.parse(raw);
      return parsed.keyDates || [];
    } catch (err) {
      throw new InternalServerErrorException(
        `AI date extraction failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }

  async generateTemplate(
    templateType: string,
    fields: Record<string, string>,
    language?: string,
  ): Promise<string> {
    const templateLabel = TEMPLATE_TYPES[templateType];
    if (!templateLabel) {
      throw new InternalServerErrorException(`Unknown template type: ${templateType}`);
    }
    try {
      const fieldsText =
        Object.entries(fields)
          .filter(([, v]) => v && v.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n') || '(no details provided)';
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        thinking: { type: 'disabled' },
        system: templateSystemPrompt(templateType, templateLabel, language),
        messages: [{ role: 'user', content: `Generate the document using these details:\n${fieldsText}` }],
      });
      return firstText(response.content) || '';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI template generation failed: ${(err as Error).message}. Check ANTHROPIC_API_KEY in backend/.env`,
      );
    }
  }

  async *streamChatAboutDocument(
    documentText: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    question: string,
    language?: string,
  ): AsyncGenerator<{ type: 'text'; text: string } | { type: 'usage'; inputTokens: number; outputTokens: number }> {
    const truncated = documentText.slice(0, 20000);
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: chatSystemBlocks(truncated, language),
      messages: [...history, { role: 'user', content: question }],
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text };
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
      }
    }

    yield { type: 'usage', inputTokens, outputTokens };
  }
}
