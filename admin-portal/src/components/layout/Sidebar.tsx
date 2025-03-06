'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
  { name: 'Activities', href: '/dashboard/activities', icon: ClipboardDocumentListIcon },
  { name: 'Sessions', href: '/dashboard/sessions', icon: CalendarIcon },
  { name: 'Tutorials', href: '/dashboard/tutorials', icon: BookOpenIcon },
  { name: 'Forum', href: '/dashboard/forum', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
        <Link href="/dashboard" className="text-xl font-bold hover:opacity-90 tracking-wider">
          <span className="text-white font-extrabold">SAGA</span>
          <span className="text-turquoise-400 font-medium">fit</span>
        </Link>
      </div>
      
      <div className="flex flex-col justify-between flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-2 py-4 space-y-1">
          <div className="px-4 py-2 text-sm text-gray-400">
            <p>Signed in as:</p>
            <p className="font-medium">{user?.name || 'Admin'}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
