import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface Resource {
  type: 'video' | 'article' | 'quiz';
  title: string;
  url?: string | null;
  duration?: string | null;
  estimatedReadTime?: string | null;
  questions?: number | null;
}

interface Topic {
  id: string;
  title: string;
  estimatedTime: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  topics: Topic[];
  resources: Resource[];
}

interface ModuleCardProps {
  module: Module;
  coursePlanId: string;
  expandedModules: Record<string, boolean>;
  toggleModule: (moduleId: string) => void;
  completedTopics: Record<string, boolean>;
  toggleTopicCompletion: (moduleId: string, topicId: string, completed: boolean) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  coursePlanId,
  expandedModules,
  toggleModule,
  completedTopics,
  toggleTopicCompletion,
}) => {
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const calculateModuleProgress = () => {
    const totalTopics = module.topics.length;
    if (totalTopics === 0) return 0;

    const completedTopicsCount = module.topics.filter(
      (topic) => completedTopics[topic.id] || topic.completed,
    ).length;

    return (completedTopicsCount / totalTopics) * 100;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'article':
        return '📄';
      case 'quiz':
        return '✅';
      default:
        return '📚';
    }
  };

  const handleTopicToggle = async (topic: Topic) => {
    setIsUpdating(prev => ({ ...prev, [topic.id]: true }));
    const newCompletedState = !(completedTopics[topic.id] || topic.completed);
    
    try {
      toggleTopicCompletion(module.id, topic.id, newCompletedState);
    } catch (error) {
      console.error("Failed to update topic completion:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, [topic.id]: false }));
    }
  };

  return (
    <Card key={module.id} className="p-0 overflow-hidden">
      <div
        className="p-4 bg-zinc-50 dark:bg-zinc-800 cursor-pointer flex justify-between items-center"
        onClick={() => toggleModule(module.id)}
      >
        <div>
          <h3 className="text-lg font-medium">{module.title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {module.estimatedTime} • {module.topics.length} topics
          </p>
        </div>
        <div className="flex items-center">
          <div className="w-32 mr-4">
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${calculateModuleProgress()}%`,
                }}
              />
            </div>
            <div className="text-xs mt-1 text-right">
              {Math.round(calculateModuleProgress())}%
              complete
            </div>
          </div>
          <span className="text-lg">
            {expandedModules[module.id] ? '▼' : '►'}
          </span>
        </div>
      </div>

      {expandedModules[module.id] && (
        <div className="p-4">
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            {module.description}
          </p>

          <h4 className="font-medium mb-2">Topics</h4>
          <ul className="space-y-2 mb-6">
            {module.topics.map((topic) => (
              <li key={topic.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`topic-${topic.id}`}
                  checked={completedTopics[topic.id] || topic.completed || false}
                  onChange={() => handleTopicToggle(topic)}
                  className="mr-3 h-4 w-4 rounded"
                  disabled={isUpdating[topic.id]}
                />
                <label
                  htmlFor={`topic-${topic.id}`}
                  className={`flex-grow ${
                    completedTopics[topic.id] || topic.completed
                      ? 'line-through text-zinc-400'
                      : ''
                  } cursor-pointer transition-colors duration-200`}
                >
                  {topic.title} ({topic.estimatedTime})
                </label>
                {isUpdating[topic.id] && (
                  <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent ml-2"></div>
                )}
              </li>
            ))}
          </ul>

          {module.resources.length > 0 && (
            <>
              <h4 className="font-medium mb-2">Resources</h4>
              <ul className="space-y-3">
                {module.resources.map((resource, idx) => (
                  <li
                    key={idx}
                    className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-md transition-all hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {getResourceIcon(resource.type)}
                      </span>
                      <div>
                        <div className="font-medium">
                          {resource.title}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {resource.type === 'video' &&
                            resource.duration &&
                            `Duration: ${resource.duration}`}
                          {resource.type === 'article' &&
                            resource.estimatedReadTime &&
                            `Reading time: ${resource.estimatedReadTime}`}
                          {resource.type === 'quiz' &&
                            resource.questions &&
                            `${resource.questions} questions`}
                        </div>
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-sm py-1.5 px-3 rounded-md transition-colors"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Card>
  );
};