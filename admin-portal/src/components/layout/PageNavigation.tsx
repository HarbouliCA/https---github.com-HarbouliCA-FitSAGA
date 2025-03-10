'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface PageNavigationAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface PageNavigationProps {
  title: string;
  actions?: PageNavigationAction[];
  backUrl?: string;
  onBack?: () => void;
  backButton?: {
    href: string;
    label: string;
  };
}

export function PageNavigation({ title, actions = [], backUrl, onBack, backButton }: PageNavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else if (backButton?.href) {
      router.push(backButton.href);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <button
          onClick={handleBack}
          className="mr-4 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          <span className="sr-only">{backButton?.label || 'Back'}</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 truncate">{title}</h1>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center space-x-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const className = action.variant === 'danger' 
              ? 'btn-danger' 
              : action.variant === 'secondary' 
                ? 'btn-secondary' 
                : 'btn-primary';

            return action.href ? (
              <Link
                key={index}
                href={action.href}
                className={`${className} inline-flex items-center`}
              >
                {Icon && <Icon className="h-5 w-5 mr-1.5" />}
                {action.label}
              </Link>
            ) : (
              <button
                key={index}
                onClick={action.onClick}
                className={`${className} inline-flex items-center`}
              >
                {Icon && <Icon className="h-5 w-5 mr-1.5" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
