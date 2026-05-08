import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

async function findListingOwnerOrThrow(listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true
    }
  });

  if (!listing) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  return listing;
}

function canAccessConversation(conversation, user) {
  return conversation.ownerId === user.id || conversation.buyerId === user.id;
}

const conversationInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      status: true,
      city: true,
      county: true
    }
  },
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  buyer: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  messages: {
    orderBy: {
      createdAt: "asc"
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  }
};

async function findConversationOrThrow(conversationId, user) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude
  });

  if (!conversation) {
    throw new AppError("Conversatia nu a fost gasita.", 404);
  }

  if (!canAccessConversation(conversation, user)) {
    throw new AppError("Nu poti accesa aceasta conversatie.", 403);
  }

  return conversation;
}

export async function createMessage(listingId, data, user) {
  const listing = await findListingOwnerOrThrow(listingId);

  if (listing.status !== "APPROVED") {
    throw new AppError("Mesajele pot fi trimise doar pentru anunturi aprobate.", 404);
  }

  if (user?.id === listing.ownerId) {
    throw new AppError("Nu poti trimite mesaj propriului anunt.", 403);
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      listingId_buyerId: {
        listingId,
        buyerId: user.id
      }
    },
    create: {
      listingId,
      ownerId: listing.ownerId,
      buyerId: user.id
    },
    update: {}
  });

  const message = await prisma.message.create({
    data: {
      listingId,
      conversationId: conversation.id,
      senderId: user.id,
      senderName: user.name,
      senderEmail: user.email,
      message: data.message
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  return message;
}

export async function getListingMessages(listingId, user) {
  const listing = await findListingOwnerOrThrow(listingId);

  if (user.role !== "ADMIN" && listing.ownerId !== user.id) {
    throw new AppError("Nu poti vedea mesajele acestui anunt.", 403);
  }

  return prisma.message.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getInboxMessages(user) {
  const legacyMessages = await prisma.message.findMany({
    where: {
      conversationId: null,
      listing: {
        ownerId: user.id
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          city: true,
          county: true
        }
      }
    }
  });

  return legacyMessages;
}

export async function getConversations(user) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { buyerId: user.id }
      ]
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          city: true,
          county: true
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  return conversations.map((conversation) => ({
    ...conversation,
    lastMessage: conversation.messages[0] ?? null,
    messages: undefined
  }));
}

export async function getConversation(conversationId, user) {
  return findConversationOrThrow(conversationId, user);
}

export async function addConversationMessage(conversationId, data, user) {
  const conversation = await findConversationOrThrow(conversationId, user);

  if (conversation.ownerId !== user.id && conversation.buyerId !== user.id) {
    throw new AppError("Nu poti raspunde in aceasta conversatie.", 403);
  }

  await prisma.message.create({
    data: {
      listingId: conversation.listingId,
      conversationId: conversation.id,
      senderId: user.id,
      senderName: user.name,
      senderEmail: user.email,
      message: data.message
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  return findConversationOrThrow(conversation.id, user);
}
