import { createMessage, getListingMessages } from "../services/message.service.js";

export async function storeMessage(req, res) {
  const message = await createMessage(req.validated.params.id, req.validated.body, req.user);
  res.status(201).json({ data: message });
}

export async function listListingMessages(req, res) {
  const messages = await getListingMessages(req.validated.params.id, req.user);
  res.json({ data: messages });
}
