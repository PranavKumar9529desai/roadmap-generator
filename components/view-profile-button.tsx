import React from 'react';
import { Button } from './ui/button';
import Link from 'next/link';

interface ProfileButtonProps {
  dashboardUrl: string;
}

export function ViewProfileButton({ dashboardUrl }: ProfileButtonProps) {
  return (
    <div className="mt-4 flex justify-center">
      <Link href={dashboardUrl} passHref>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          View Your Profile
        </Button>
      </Link>
    </div>
  );
}