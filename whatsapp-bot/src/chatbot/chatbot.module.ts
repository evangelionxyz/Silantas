import { Module } from '@nestjs/common';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatbotService } from './chatbot.service.js';

@Module({
  providers: [ChatbotService, ChatbotSessionStore],
  exports: [ChatbotService, ChatbotSessionStore],
})
export class ChatbotModule {}
