import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

type DropdownAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger' | 'success';
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const DropdownMenu: React.FC<{ 
  actions: DropdownAction[];
  align?: 'left' | 'right';
}> = ({ actions, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div className={`absolute z-10 ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100`}>
          <div className="py-1">
            {actions.map((action, index) => {
              const Element = action.href ? 'a' : 'button';
              return (
                <Element
                  key={index}
                  href={action.href}
                  onClick={(e) => {
                    if (!action.href) e.preventDefault();
                    if (action.onClick) {
                      action.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left block px-4 py-2 text-sm ${
                    action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 
                    action.variant === 'success' ? 'text-green-600 hover:bg-green-50' : 
                    'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    {action.icon && <action.icon className="mr-3 h-5 w-5" />}
                    {action.label}
                  </div>
                </Element>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
