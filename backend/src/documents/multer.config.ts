import * as fs from 'fs';
import * as path from 'path';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export function buildMulterOptions() {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOCX, JPG, PNG.`,
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
}
