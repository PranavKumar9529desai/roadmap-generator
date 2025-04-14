import React from 'react';
import { Button } from './ui/button';
import Link from 'next/link';

interface CourseButtonProps {
  courseUrl: string;
}

export function ViewCourseButton({ courseUrl }: CourseButtonProps) {
  return (
    <div className="mt-4 flex justify-center">
      <Link href={courseUrl} passHref>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          View Your Course Plan
        </Button>
      </Link>
    </div>
  );
}