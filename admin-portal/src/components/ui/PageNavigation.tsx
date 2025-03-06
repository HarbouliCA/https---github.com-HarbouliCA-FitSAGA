import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PageNavigationProps {
  backUrl: string;
  backLabel?: string;
  title: string;
  actions?: React.ReactNode;
}

export default function PageNavigation({ backUrl, backLabel, title, actions }: PageNavigationProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link 
          href={backUrl} 
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {backLabel || 'Back'}
        </Link>
        {actions}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}
