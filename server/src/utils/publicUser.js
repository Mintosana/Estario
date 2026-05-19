export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    bio: user.bio,
    promotionCredits: user.promotionCredits ?? 0,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
