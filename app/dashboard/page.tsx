'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Activity } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Create a client-only version of the ActivityCalendar component
const ClientOnlyActivityCalendar = dynamic(
  () => import('react-activity-calendar'),
  { ssr: false }
);

// Define types for dashboard props
interface UserProfile {
  name: string;
  education?: string;
  pastExperience?: string;
  learningGoals?: string;
  dailyTimeCommitment?: string;
  priorKnowledge?: string;
  avatarUrl?: string;
  avatarFallback: string;
  currentGoal?: string;
}

interface DashboardProps {
  userProfile: UserProfile;
  currentGoal: string;
  activityData: Activity[];
  totalActivities?: {
    count: number;
    year: number;
  };
  onRefresh?: () => void;
}

// Default props for testing or when data is not provided
const defaultProps: DashboardProps = {
  userProfile: {
    name: 'naem_writean_here',
    education: '',
    pastExperience: '',
    learningGoals: 'topic generated by the AI.',
    dailyTimeCommitment: '',
    priorKnowledge: '',
    avatarFallback: 'P',
  },
  currentGoal: 'Learning React in 10 days',
  activityData: [],
  totalActivities: {
    count: 1721,
    year: 2025,
  },
};

// The main DashboardPage component that receives props
function DashboardPage(props: DashboardProps = defaultProps) {
  const { userProfile, currentGoal, totalActivities, onRefresh } = props;
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Ensure activity data is never empty to avoid the ActivityCalendar error
  const activityData =
    props.activityData && props.activityData.length > 0
      ? props.activityData
      : [{ date: new Date().toISOString().split('T')[0], count: 1, level: 1 }];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl">
      <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="pb-0 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="rounded-full px-6 transition-all hover:bg-gray-100"
                onClick={onRefresh}
              >
                Refresh Data
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 transition-all hover:bg-gray-100"
                onClick={() => setShowFullCalendar(!showFullCalendar)}
              >
                {showFullCalendar ? 'Collapse calendar' : 'Open full calendar'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4">
          {/* User Profile Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Name:
                  </span>
                  <span className="text-gray-800">{userProfile.name}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Education:
                  </span>
                  {userProfile.education ? (
                    <span className="text-gray-800">
                      {userProfile.education}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Past Experience:
                  </span>
                  {userProfile.pastExperience ? (
                    <span className="text-gray-800">
                      {userProfile.pastExperience}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Learning Goals:
                  </span>
                  {userProfile.learningGoals ? (
                    <span className="text-gray-800">
                      {userProfile.learningGoals}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Daily Time Commitment:
                  </span>
                  {userProfile.dailyTimeCommitment ? (
                    <span className="text-gray-800">
                      {userProfile.dailyTimeCommitment}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-700 font-semibold text-base">
                    Prior Knowledge:
                  </span>
                  {userProfile.priorKnowledge ? (
                    <span className="text-gray-800">
                      {userProfile.priorKnowledge}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>
              </div>

              <Avatar className="size-20 border-2 border-white shadow-sm">
                <AvatarImage
                  src={userProfile.avatarUrl || ''}
                  alt={userProfile.name}
                />
                <AvatarFallback className="bg-indigo-100 text-indigo-800 text-xl font-medium">
                  {userProfile.avatarFallback}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Goal Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Current Goal
              </h2>
              <p className="text-indigo-700 font-medium text-lg">
                {currentGoal}
              </p>
            </div>
          </div>

          {/* Activity Calendar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Activity Tracker
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Less</span>
                <div className="flex gap-1">
                  {['#f0f0f0', '#c4edde', '#7ac7c4', '#4aaee3', '#2777c4'].map(
                    (color) => (
                      <div
                        key={color}
                        className="size-3 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
                <span className="text-sm text-gray-500">More</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">
                Similar to the github heatmap
              </p>
            </div>

            <div
              className={`${showFullCalendar ? 'h-auto' : 'h-52'} overflow-hidden transition-all duration-300`}
            >
              <ClientOnlyActivityCalendar
                data={activityData}
                labels={{
                  months: [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  totalCount: '{{count}} activities in {{year}}',
                }}
                theme={{
                  light: [
                    '#f0f0f0',
                    '#c4edde',
                    '#7ac7c4',
                    '#4aaee3',
                    '#2777c4',
                  ],
                  dark: ['#1f2937', '#2dd4bf', '#0ea5e9', '#8b5cf6', '#6366f1'],
                }}
                renderBlock={(block, activity) => {
                  // Use any type assertion to avoid type errors
                  const blockAny = block as any;
                  // Handle date formatting safely for client-side only
                  let dateTitle = `${activity.count} activities`;
                  if (typeof window !== 'undefined' && activity.date) {
                    try {
                      dateTitle = `${activity.count} activities on ${format(new Date(activity.date), 'do MMM yyyy')}`;
                    } catch (e) {
                      // Fall back to simpler format if there's an error
                      dateTitle = `${activity.count} activities on ${activity.date}`;
                    }
                  }
                  
                  return (
                    <div
                      key={`${activity.date}-${activity.count}`}
                      title={dateTitle}
                      className="rounded-sm"
                      style={{
                        backgroundColor: blockAny?.color || '#f0f0f0',
                        opacity: blockAny?.opacity || 1,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  );
                }}
              />
            </div>

            {totalActivities && (
              <div className="text-center mt-4">
                <p className="text-gray-500 text-sm">
                  {totalActivities.count} activities in {totalActivities.year}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// The page component that provides data to the DashboardPage component
export default function Dashboard() {
  const router = useRouter();
  // Use isClientSide to prevent hydration issues
  const [isClientSide, setIsClientSide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This is where you would fetch data from an API or other data source
  const [activityData, setActivityData] = useState<Activity[]>(() => {
    // Import generateActivityData here to keep it in this component
    // and not in the reusable DashboardPage component
    const { generateActivityData } = require('@/lib/utils');
    return generateActivityData(52);
  });

  // State for profile data with initial default values
  const [profileData, setProfileData] = useState<DashboardProps>({
    ...defaultProps,
    activityData: activityData, // Make sure activity data is included from the start
  });

  // Function to fetch the user profile from our API endpoint
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch the profile data from our API endpoint
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        console.error('Failed to fetch profile:', response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.userProfile) {
        console.log('Loaded user profile from API:', data.userProfile);
        // Update the profile data from the API
        setProfileData((prev) => ({
          ...prev,
          userProfile: {
            name: data.userProfile.name,
            education: data.userProfile.education || '',
            pastExperience: data.userProfile.pastExperience || '',
            learningGoals: data.userProfile.learningGoals || '',
            dailyTimeCommitment: data.userProfile.dailyTimeCommitment || '',
            priorKnowledge: data.userProfile.priorKnowledge || '',
            avatarFallback: data.userProfile.avatarFallback,
          },
          currentGoal: data.userProfile.currentGoal || 'Learning React in 10 days',
          // We keep the existing activity data for now
        }));
      } else {
        console.log('No user profile found in API response, using defaults');
      }
    } catch (error) {
      console.error('Failed to fetch user profile from API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to check if we're on the client side
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Effect to fetch the profile when the component mounts on the client side
  useEffect(() => {
    if (!isClientSide) return;
    
    fetchUserProfile();
  }, [isClientSide]);

  // Only render the dashboard when on the client side to prevent hydration issues
  if (!isClientSide || isLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return <DashboardPage {...profileData} onRefresh={fetchUserProfile} />;
}
