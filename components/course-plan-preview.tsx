"use client"
import React, { useRef } from 'react';

type Topic = {
  id: string;
  title: string;
  estimatedTime: string;
  completed?: boolean;
};

type Resource = {
  type: 'video' | 'article' | 'quiz';
  title: string;
  url?: string | null; // Allow null or undefined
  duration?: string | null; // Allow null or undefined
  estimatedReadTime?: string | null; // Allow null or undefined
  questions?: number | null; // Allow null or undefined
};

type Module = {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  topics: Topic[];
  resources?: Resource[];
};

interface CoursePlanPreviewProps {
  title: string;
  description: string;
  learningObjectives?: string[];
  totalEstimatedTime?: string;
  modules?: Module[]; // Make modules optional
}

export function CoursePlanPreview({
  title,
  description,
  learningObjectives,
  totalEstimatedTime,
  modules = [], // Provide a default empty array
}: CoursePlanPreviewProps) {
  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  
  const toggleModule = (moduleId: string, event: React.MouseEvent) => {
    // Prevent the default behavior to avoid scrolling
    event.preventDefault();
    
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'article': return '📄';
      case 'quiz': return '✅';
      default: return '📚';
    }
  };

  // Calculate progress for each module
  const getModuleProgress = (module: Module) => {
    if (!module.topics || module.topics.length === 0) return 0;
    const completedTopics = module.topics.filter(topic => topic.completed).length;
    return Math.round((completedTopics / module.topics.length) * 100);
  };

  return (
    <div 
      ref={previewRef}
      className="w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
    >
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">{description}</p>
        
        {totalEstimatedTime && (
          <div className="text-xs bg-zinc-100 dark:bg-zinc-700 p-1 px-2 inline-block rounded-md">
            ⏱️ Total estimated time: {totalEstimatedTime}
          </div>
        )}
        
        {learningObjectives && learningObjectives.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-medium mb-1">Learning Objectives:</h3>
            <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1 pl-2">
              {learningObjectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-[400px] overflow-y-auto">
        {modules && modules.length > 0 ? (
          modules.map((module) => (
            <div key={module.id} className="text-sm">
              <div 
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                onClick={(e) => toggleModule(module.id, e)}
              >
                <div className="flex-grow">
                  <h3 className="font-medium">{module.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {module.estimatedTime} • {module.topics.length} topics
                  </p>
                </div>
                
                <div className="flex items-center">
                  {/* Progress indicator */}
                  <div className="mr-3 hidden sm:block">
                    <div className="h-1.5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                      <div 
                        className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${getModuleProgress(module)}%` }}
                      />
                    </div>
                    <div className="text-xs text-zinc-500 text-right mt-0.5">
                      {getModuleProgress(module)}%
                    </div>
                  </div>
                  <span className="text-xs w-4">{expandedModules[module.id] ? '▼' : '►'}</span>
                </div>
              </div>
              
              {expandedModules[module.id] && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-700/50 text-xs overflow-hidden transition-all duration-300">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-2">{module.description}</p>
                  
                  <div className="mb-3">
                    <h4 className="font-medium mb-1">Topics:</h4>
                    <ul className="space-y-1 pl-2">
                      {module.topics.map((topic) => (
                        <li key={topic.id} className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${topic.completed ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
                          <span className={topic.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}>
                            {topic.title}
                          </span>
                          <span className="text-zinc-500 ml-1">({topic.estimatedTime})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {module.resources && module.resources.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Resources:</h4>
                      <ul className="space-y-1.5 pl-2">
                        {module.resources.map((resource, idx) => (
                          <li key={idx} className="flex items-center bg-white dark:bg-zinc-800 p-1.5 rounded">
                            <span className="mr-2 text-base">{getResourceIcon(resource.type)}</span>
                            <div className="flex-grow">
                              {resource.url ? (
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:text-blue-500 font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {resource.title}
                                </a>
                              ) : (
                                <span className="font-medium">{resource.title}</span>
                              )}
                              <div className="text-xs text-zinc-500">
                                {resource.type === 'video' && resource.duration && `Duration: ${resource.duration}`}
                                {resource.type === 'article' && resource.estimatedReadTime && `Reading time: ${resource.estimatedReadTime}`}
                                {resource.type === 'quiz' && resource.questions != null && `${resource.questions} questions`}
                              </div>
                            </div>
                            {resource.url && (
                              <a 
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Open
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-zinc-500">
            No modules available in this course plan.
          </div>
        )}
      </div>
    </div>
  );
}