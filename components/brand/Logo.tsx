import React from 'react';
import Image from 'next/image';
import { Link } from '@/navigation';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  width = 160,
  height = 40,
  priority = false,
}) => {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-md ${className}`}
      aria-label="حاضر | Hader - Home"
    >
      <Image
        src="/brand/wordmark.svg"
        alt="حاضر - Hader"
        width={width}
        height={height}
        priority={priority}
        className="h-9 w-auto object-contain dark:invert"
      />
    </Link>
  );
};
