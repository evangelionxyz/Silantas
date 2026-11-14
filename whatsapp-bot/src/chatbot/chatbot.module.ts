import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatbotService } from './chatbot.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [ChatbotService, ChatbotSessionStore],
  exports: [ChatbotService, ChatbotSessionStore],
})
export class ChatbotModule {}
