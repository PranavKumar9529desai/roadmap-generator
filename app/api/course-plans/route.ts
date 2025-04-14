import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCoursePlansByUserId, getCoursePlanById, saveCoursePlan } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coursePlans = await getCoursePlansByUserId(session.user.id);

    return NextResponse.json({ coursePlans });
  } catch (error) {
    console.error('Error fetching course plans:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, moduleId, topicId, completed } = await request.json();
    
    // Get the current course plan
    const currentPlan = await getCoursePlanById(id);
    
    if (!currentPlan) {
      return NextResponse.json({ error: 'Course plan not found' }, { status: 404 });
    }
    
    // Verify the user owns this course plan
    if (currentPlan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update the completed status of the topic
    const updatedModules = currentPlan.modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          topics: module.topics.map(topic => {
            if (topic.id === topicId) {
              return {
                ...topic,
                completed
              };
            }
            return topic;
          })
        };
      }
      return module;
    });
    
    // Save the updated course plan
    await saveCoursePlan({
      ...currentPlan,
      modules: updatedModules
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Course progress updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating course progress:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
