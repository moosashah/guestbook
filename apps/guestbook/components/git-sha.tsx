'use client';

import { useEffect, useState } from 'react';

export function GitSHA() {
  const [sha, setSha] = useState<string>('');

  useEffect(() => {
    // Get the Git SHA from the environment variable
    const gitSha = process.env.NEXT_PUBLIC_GIT_SHA || 'development';
    setSha(gitSha);
  }, []);

  return (
    <div className='text-center text-xs text-muted-foreground mt-8 mb-4'>
      <span>Version: {sha}</span>
    </div>
  );
}
