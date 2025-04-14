'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/app/(auth)/auth';
import { getCoursePlansByUserId } from '@/lib/db/queries';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CoursePlan } from '@/lib/db/schema';

export default function CoursePage() {
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoursePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [completedTopics, setCompletedTopics] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchCoursePlans = async () => {
      try {
        const session = await auth();
        if (session?.user?.id) {
          const plans = await getCoursePlansByUserId(session.user.id);
          setCoursePlans(plans);
          if (plans.length > 0) {
            setSelectedPlan(plans[0]); // Select the first plan by default
          }
        }
      } catch (error) {
        console.error('Error fetching course plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursePlans();
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleTopicCompletion = (topicId: string) => {
    setCompletedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const calculateModuleProgress = (moduleId: string) => {
    if (!selectedPlan) return 0;

    const module = selectedPlan.modules.find((m) => m.id === moduleId);
    if (!module) return 0;

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

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-pulse">Loading course plans...</div>
      </div>
    );
  }

  if (coursePlans.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Course Plans Found</h1>
        <p className="mb-4">
          You don't have any course plans yet. Chat with the assistant to create
          one!
        </p>
        <Button onClick={() => (window.location.href = '/')}>
          Chat with Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {selectedPlan ? (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{selectedPlan.title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {selectedPlan.description}
            </p>
            {selectedPlan.totalEstimatedTime && (
              <div className="text-sm bg-zinc-100 dark:bg-zinc-800 p-2 inline-block rounded-md">
                ⏱️ Total estimated time: {selectedPlan.totalEstimatedTime}
              </div>
            )}
          </div>

          {selectedPlan.learningObjectives &&
            selectedPlan.learningObjectives.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Learning Objectives
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {selectedPlan.learningObjectives.map((objective, index) => (
                    <li
                      key={index}
                      className="text-zinc-700 dark:text-zinc-300"
                    >
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <h2 className="text-2xl font-semibold mt-8 mb-4">Course Modules</h2>
          <div className="space-y-4">
            {selectedPlan.modules.map((module) => (
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
                          className="h-2 bg-green-500 rounded-full"
                          style={{
                            width: `${calculateModuleProgress(module.id)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs mt-1 text-right">
                        {Math.round(calculateModuleProgress(module.id))}%
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
                            checked={
                              completedTopics[topic.id] ||
                              topic.completed ||
                              false
                            }
                            onChange={() => toggleTopicCompletion(topic.id)}
                            className="mr-3 h-4 w-4 rounded"
                          />
                          <label
                            htmlFor={`topic-${topic.id}`}
                            className={`${completedTopics[topic.id] || topic.completed ? 'line-through text-zinc-400' : ''}`}
                          >
                            {topic.title} ({topic.estimatedTime})
                          </label>
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
                              className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-md"
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
                                    className="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
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
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>No course plan selected.</p>
        </div>
      )}
    </div>
  );
}
                                </div>
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
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
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>No course plan selected.</p>
        </div>
      )}
    </div>
  );
}
