import {
  addConversationMessage,
  createMessage,
  getConversation,
  getConversations,
  getInboxMessages,
  getListingMessages
} from "../services/message.service.js";

export async function storeMessage(req, res) {
  const message = await createMessage(req.validated.params.id, req.validated.body, req.user);
  res.status(201).json({ data: message });
}

export async function listListingMessages(req, res) {
  const messages = await getListingMessages(req.validated.params.id, req.user);
  res.json({ data: messages });
}

export async function listInboxMessages(req, res) {
  const messages = await getInboxMessages(req.user);
  res.json({ data: messages });
}

export async function listConversations(req, res) {
  const conversations = await getConversations(req.user);
  res.json({ data: conversations });
}

export async function showConversation(req, res) {
  const conversation = await getConversation(req.validated.params.id, req.user);
  res.json({ data: conversation });
}

export async function replyToConversation(req, res) {
  const conversation = await addConversationMessage(req.validated.params.id, req.validated.body, req.user);
  res.status(201).json({ data: conversation });
}
