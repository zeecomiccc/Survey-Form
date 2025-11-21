'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CompanyLogo({ href = '/' }: { href?: string }) {
  const [logoError, setLogoError] = useState(false);

  const logoContent = logoError ? (
    <h1 className="text-2xl font-bold text-gray-900">Survey Platform</h1>
  ) : (
    <img 
      src="/logo.png" 
      alt="Company Logo" 
      className="h-10 w-auto cursor-pointer"
      onError={() => setLogoError(true)}
    />
  );

  return (
    <Link href={href} className="flex items-center">
      {logoContent}
    </Link>
  );
}

