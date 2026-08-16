import { Module } from '@nestjs/common';
import { PersonalTemplatesController } from './personal-templates.controller';
import { PersonalTemplatesService } from './personal-templates.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [PersonalTemplatesController],
  providers: [PersonalTemplatesService],
})
export class PersonalTemplatesModule {}
