'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CompanyLogoProps {
  href?: string;
  size?: 'default' | 'large' | 'xl';
}

export default function CompanyLogo({ href = '/', size = 'default' }: CompanyLogoProps) {
  const [logoError, setLogoError] = useState(false);

  const sizeClasses = {
    default: 'h-14',      // 56px - Used in header
    large: 'h-20',        // 80px - 25% increase from h-16 (was 64px, now 80px)
    xl: 'h-32',           // 128px - Extra large option
    // You can add more sizes here, for example:
    // 'custom-sm': 'h-12',   // 48px
    // 'custom-md': 'h-16',   // 64px
    // 'custom-lg': 'h-24',   // 96px
    // 'custom-xl': 'h-36',   // 144px
  };

  const textSizeClasses = {
    default: 'text-2xl',
    large: 'text-3xl',    // Adjusted to match increased logo size
    xl: 'text-5xl',
  };

  const logoContent = logoError ? (
    <h1 className={`${textSizeClasses[size]} font-bold text-gray-900`}>Survey Platform</h1>
  ) : (
    <img 
      src="/logo.png" 
      alt="Company Logo" 
      className={`${sizeClasses[size]} w-auto cursor-pointer`}
      onError={() => setLogoError(true)}
    />
  );

  return (
    <Link href={href} className="flex items-center">
      {logoContent}
    </Link>
  );
}

