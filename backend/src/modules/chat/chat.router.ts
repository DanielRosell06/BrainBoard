import { Router } from 'express';
import { chatService } from './chat.service.js';

export const chatRouter = Router();

chatRouter.get('/api/chat/conversations', async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations();
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

chatRouter.post('/api/chat/conversations', async (req, res, next) => {
  try {
    const { title } = req.body;
    const conversation = await chatService.createConversation(title);
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/api/chat/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await chatService.getConversation(req.params.id);
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

chatRouter.delete('/api/chat/conversations/:id', async (req, res, next) => {
  try {
    await chatService.deleteConversation(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

chatRouter.post('/api/chat/conversations/:id/messages', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const responseMessage = await chatService.processMessage(req.params.id, content);
    res.json(responseMessage);
  } catch (err) {
    next(err);
  }
});
