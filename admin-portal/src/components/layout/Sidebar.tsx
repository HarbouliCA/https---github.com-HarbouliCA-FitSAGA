'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Define navigation items with role-based access
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'instructor'] },
  { name: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon, roles: ['admin'] },
  { name: 'Users', href: '/dashboard/users', icon: UsersIcon, roles: ['admin'] },
  { name: 'Activities', href: '/dashboard/activities', icon: ClipboardDocumentListIcon, roles: ['admin', 'instructor'] },
  { name: 'Sessions', href: '/dashboard/sessions', icon: CalendarIcon, roles: ['admin', 'instructor'] },
  { name: 'Instructors', href: '/dashboard/instructors', icon: AcademicCapIcon, roles: ['admin'] },
  { name: 'Tutorials', href: '/dashboard/tutorials', icon: BookOpenIcon, roles: ['admin', 'instructor'] },
  { name: 'Forum', href: '/dashboard/forum', icon: ChatBubbleLeftRightIcon, roles: ['admin', 'instructor'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, roles: ['admin', 'instructor'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || '';

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="flex flex-col w-64 bg-gray-900">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <span className="text-white text-2xl font-bold">FitSaga</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-6 w-6 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <p className="text-xs font-medium text-gray-300">Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full"
          >
            <ArrowLeftOnRectangleIcon
              className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
              aria-hidden="true"
            />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
