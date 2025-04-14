import { useState, useEffect } from 'react';
import { ModuleCard } from './ModuleCard';
import type { CoursePlan } from '@/lib/db/schema';
import { toast } from 'sonner';

interface ModulesListProps {
  coursePlan: CoursePlan;
}

export const ModulesList: React.FC<ModulesListProps> = ({ coursePlan }) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize completed topics from the coursePlan data
  useEffect(() => {
    const initialCompletedTopics: Record<string, boolean> = {};
    coursePlan.modules.forEach(module => {
      module.topics.forEach(topic => {
        if (topic.completed) {
          initialCompletedTopics[topic.id] = true;
        }
      });
    });
    
    setCompletedTopics(initialCompletedTopics);
    setIsInitialized(true);
  }, [coursePlan]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleTopicCompletion = async (moduleId: string, topicId: string, completed: boolean) => {
    // Optimistically update the UI
    setCompletedTopics(prev => ({
      ...prev,
      [topicId]: completed,
    }));
    
    try {
      // Send update to the backend
      const response = await fetch('/api/course-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: coursePlan.id,
          moduleId,
          topicId,
          completed,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }
      
      // Success notification
      toast.success(completed ? 'Topic marked as completed' : 'Topic marked as incomplete');
      
    } catch (error) {
      console.error('Error updating topic completion:', error);
      
      // Revert the optimistic update on failure
      setCompletedTopics(prev => ({
        ...prev,
        [topicId]: !completed,
      }));
      
      toast.error('Failed to update progress. Please try again.');
    }
  };

  if (!isInitialized) {
    return <div className="animate-pulse p-4 text-center">Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mt-8 mb-4">Course Modules</h2>
      {coursePlan.modules.map(module => (
        <ModuleCard
          key={module.id}
          module={module}
          coursePlanId={coursePlan.id}
          expandedModules={expandedModules}
          toggleModule={toggleModule}
          completedTopics={completedTopics}
          toggleTopicCompletion={toggleTopicCompletion}
        />
      ))}
    </div>
  );
};