import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotSessionStore } from '../chatbot/chatbot-session.store.js';
import { ChatbotService } from '../chatbot/chatbot.service.js';
import { WhatsappService } from './whatsapp.service.js';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    // Mock connect to prevent real network connection during unit test
    vi.spyOn(WhatsappService.prototype as any, 'connect').mockImplementation(async () => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappService, ChatbotService, ChatbotSessionStore],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
