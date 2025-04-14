import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserProfileByUserId } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getUserProfileByUserId(session.user.id);
    
    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      userProfile: {
        name: userProfile.name,
        education: userProfile.education || '',
        pastExperience: userProfile.pastExperience || '',
        learningGoals: userProfile.learningGoals || '',
        dailyTimeCommitment: userProfile.dailyTimeCommitment || '',
        priorKnowledge: userProfile.priorKnowledge || '',
        currentGoal: userProfile.currentGoal || '',
        avatarFallback: userProfile.avatarFallback || userProfile.name.charAt(0).toUpperCase(),
        updatedAt: userProfile.updatedAt || new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}