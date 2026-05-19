import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notification.service.js";

async function findListingOwnerOrThrow(listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      title: true
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

async function markConversationMessagesRead(conversationId, userId) {
  await prisma.message.updateMany({
    where: {
      conversationId,
      readAt: null,
      NOT: {
        senderId: userId
      }
    },
    data: {
      readAt: new Date()
    }
  });
}

function unreadWhereForUser(userId) {
  return {
    readAt: null,
    NOT: {
      senderId: userId
    },
    conversation: {
      OR: [
        { ownerId: userId },
        { buyerId: userId }
      ]
    }
  };
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

  await createNotification({
    body: `${user.name} ti-a trimis un mesaj pentru anuntul "${listing.title}".`,
    targetUrl: `/messages/${conversation.id}`,
    title: "Mesaj nou",
    type: "NEW_MESSAGE",
    userId: listing.ownerId
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

  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: unreadWhereForUser(user.id),
    _count: {
      id: true
    }
  });
  const unreadCountByConversationId = new Map(
    unreadCounts.map((item) => [item.conversationId, item._count.id])
  );

  return conversations.map((conversation) => {
    const unreadCount = unreadCountByConversationId.get(conversation.id) ?? 0;

    return {
      ...conversation,
      hasUnread: unreadCount > 0,
      lastMessage: conversation.messages[0] ?? null,
      messages: undefined,
      unreadCount
    };
  });
}

export async function getConversation(conversationId, user) {
  await markConversationMessagesRead(conversationId, user.id);
  return findConversationOrThrow(conversationId, user);
}

export async function getUnreadConversationCount(user) {
  const unreadConversations = await prisma.message.groupBy({
    by: ["conversationId"],
    where: unreadWhereForUser(user.id),
    _count: {
      id: true
    }
  });

  return {
    totalUnreadMessages: unreadConversations.reduce((total, item) => total + item._count.id, 0),
    unreadConversations: unreadConversations.length
  };
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

  const recipientId = conversation.ownerId === user.id ? conversation.buyerId : conversation.ownerId;

  await createNotification({
    body: `${user.name} ti-a raspuns in conversatia pentru "${conversation.listing.title}".`,
    targetUrl: `/messages/${conversation.id}`,
    title: "Raspuns nou in conversatie",
    type: "NEW_MESSAGE",
    userId: recipientId
  });

  return findConversationOrThrow(conversation.id, user);
}
