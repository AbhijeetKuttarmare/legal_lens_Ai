import { IsObject } from 'class-validator';

export class FillPersonalTemplateDto {
  @IsObject()
  fieldValues: Record<string, string>;
}
