import { axiosClient } from "./axiosClient.js";

export async function createMessage(listingId, payload) {
  const response = await axiosClient.post(`/listings/${listingId}/messages`, payload);
  return response.data;
}

export async function getListingMessages(listingId) {
  const response = await axiosClient.get(`/my-listings/${listingId}/messages`);
  return response.data;
}

export async function getInboxMessages() {
  const response = await axiosClient.get("/messages/inbox");
  return response.data;
}

export async function getConversations() {
  const response = await axiosClient.get("/messages/conversations");
  return response.data;
}

export async function getConversation(conversationId) {
  const response = await axiosClient.get(`/messages/conversations/${conversationId}`);
  return response.data;
}

export async function replyToConversation(conversationId, payload) {
  const response = await axiosClient.post(`/messages/conversations/${conversationId}/messages`, payload);
  return response.data;
}
