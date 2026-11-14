import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';

@Module({
  imports: [WhatsappModule, ChatbotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
