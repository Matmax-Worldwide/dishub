// src/app/api/graphql/dataloaders/userByIdLoader.ts
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export type PublicUser = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profileImageUrl'> & {
  // Example of adding a related field if needed, e.g., role name
  // roleName?: string | null;
};

export const batchUsersByIds = async (userIds: readonly string[]): Promise<(PublicUser | null)[]> => {
  console.log(`UserByIdLoader: Batch loading users for IDs: [${userIds.join(', ')}]`);

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds as string[] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
      // Example: include role name if your User model has a role relation
      // role: { select: { name: true } }
    }
  });

  const usersById: Record<string, PublicUser> = {};
  users.forEach(user => {
    // If role was included and needs to be mapped to roleName:
    // const { role, ...userData } = user;
    // usersById[user.id] = { ...userData, roleName: role?.name || null };
    // Else, if no role transformation needed:
    usersById[user.id] = user as PublicUser;
  });

  return userIds.map(id => usersById[id] || null);
};
