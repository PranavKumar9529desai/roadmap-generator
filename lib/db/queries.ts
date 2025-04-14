import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  userProfile,
  type UserProfile,
  coursePlan,
} from './schema';
import type { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Configure WebSocket for Neon
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = ws;

// biome-ignore lint: Forbidden non-null assertion.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database');
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function saveUserProfileToDB({
  userId,
  name,
  education,
  pastExperience,
  learningGoals,
  currentGoal,
  dailyTimeCommitment,
  priorKnowledge,
  avatarFallback,
}: {
  userId: string;
  name: string;
  education?: string;
  pastExperience?: string;
  learningGoals?: string;
  currentGoal?: string;
  dailyTimeCommitment?: string;
  priorKnowledge?: string;
  avatarFallback?: string;
}) {
  try {
    // Check if a profile already exists for this user
    const existingProfile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId));

    if (existingProfile.length > 0) {
      // Update existing profile
      return await db
        .update(userProfile)
        .set({
          name,
          education,
          pastExperience,
          learningGoals,
          currentGoal,
          dailyTimeCommitment,
          priorKnowledge,
          avatarFallback: avatarFallback || name.charAt(0).toUpperCase(),
          updatedAt: new Date(),
        })
        .where(eq(userProfile.userId, userId));
    } else {
      // Create new profile
      return await db.insert(userProfile).values({
        userId,
        name,
        education,
        pastExperience,
        learningGoals,
        currentGoal,
        dailyTimeCommitment,
        priorKnowledge,
        avatarFallback: avatarFallback || name.charAt(0).toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Failed to save user profile to database:', error);
    throw error;
  }
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  try {
    const profiles = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId));
    
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    console.error('Failed to get user profile from database:', error);
    throw error;
  }
}

export async function saveCoursePlan({
  userId,
  title,
  description,
  learningObjectives,
  totalEstimatedTime,
  modules,
}: {
  userId: string;
  title: string;
  description: string;
  learningObjectives?: string[];
  totalEstimatedTime?: string;
  modules: {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    topics: {
      id: string;
      title: string;
      estimatedTime: string;
      completed: boolean;
    }[];
    resources: {
      type: 'video' | 'article' | 'quiz';
      title: string;
      url?: string | null; // Allow null
      duration?: string | null; // Allow null
      estimatedReadTime?: string | null; // Allow null
      questions?: number | null; // Allow null
    }[];
  }[];
}) {
  try {
    // Check if a course plan already exists for this user
    const existingCoursePlans = await db
      .select()
      .from(coursePlan)
      .where(eq(coursePlan.userId, userId));

    const now = new Date();

    if (existingCoursePlans.length > 0) {
      // Update existing course plan - for simplicity, we'll just update the most recent one
      // In a production app, you might want to create a new one or have a more complex update strategy
      const latestCoursePlan = existingCoursePlans.reduce((latest, current) => 
        latest.updatedAt > current.updatedAt ? latest : current
      );
      
      return await db
        .update(coursePlan)
        .set({
          title,
          description,
          learningObjectives,
          totalEstimatedTime,
          modules,
          updatedAt: now,
        })
        .where(eq(coursePlan.id, latestCoursePlan.id));
    } else {
      // Create new course plan
      return await db.insert(coursePlan).values({
        userId,
        title,
        description,
        learningObjectives,
        totalEstimatedTime,
        modules,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('Failed to save course plan to database:', error);
    throw error;
  }
}

export async function getCoursePlansByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(coursePlan)
      .where(eq(coursePlan.userId, userId))
      .orderBy(desc(coursePlan.updatedAt));
  } catch (error) {
    console.error('Failed to get course plans by user ID from database:', error);
    throw error;
  }
}

export async function getCoursePlanById(id: string) {
  try {
    const plans = await db
      .select()
      .from(coursePlan)
      .where(eq(coursePlan.id, id));
    
    return plans.length > 0 ? plans[0] : null;
  } catch (error) {
    console.error('Failed to get course plan by ID from database:', error);
    throw error;
  }
}
