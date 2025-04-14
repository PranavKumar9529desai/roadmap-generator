"use client"
import React from 'react';

type Topic = {
  id: string;
  title: string;
  estimatedTime: string;
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
  
  const toggleModule = (moduleId: string) => {
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

  return (
    <div className="w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
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
      
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {modules && modules.length > 0 ? (
          modules.map((module) => (
            <div key={module.id} className="text-sm">
              <div 
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700"
                onClick={() => toggleModule(module.id)}
              >
                <div>
                  <h3 className="font-medium">{module.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {module.estimatedTime} • {module.topics.length} topics
                  </p>
                </div>
                <span>{expandedModules[module.id] ? '▼' : '►'}</span>
              </div>
              
              {expandedModules[module.id] && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-700/50 text-xs">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-2">{module.description}</p>
                  
                  <div className="mb-3">
                    <h4 className="font-medium mb-1">Topics:</h4>
                    <ul className="space-y-1 pl-2">
                      {module.topics.map((topic) => (
                        <li key={topic.id} className="flex items-center">
                          <span className="mr-2">•</span>
                          <span>{topic.title}</span>
                          <span className="text-zinc-500 ml-1">({topic.estimatedTime})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {module.resources && module.resources.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Resources:</h4>
                      <ul className="space-y-1 pl-2">
                        {module.resources.map((resource, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="mr-1">{getResourceIcon(resource.type)}</span>
                            {resource.url ? (
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">
                                {resource.title}
                              </a>
                            ) : (
                              <span>{resource.title}</span>
                            )}
                            <span className="text-zinc-500 ml-1">
                              {resource.type === 'video' && resource.duration && `(${resource.duration})`}
                              {resource.type === 'article' && resource.estimatedReadTime && `(${resource.estimatedReadTime})`}
                              {resource.type === 'quiz' && resource.questions != null && `(${resource.questions} questions)`}
                            </span>
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