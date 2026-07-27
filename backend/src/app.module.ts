import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { LegalModule } from './legal/legal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AiModule,
    UsersModule,
    DocumentsModule,
    ChatModule,
    PaymentsModule,
    LegalModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
