'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions?: ModalAction[];
  children?: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, description, actions = [], children }: ModalProps) => {
  const getButtonClasses = (variant: ModalAction['variant'] = 'primary') => {
    const baseClasses = 'inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600`;
      case 'secondary':
        return `${baseClasses} bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600`;
      default:
        return `${baseClasses} bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600`;
    }
  };

  return (
    <Transition appear show={isOpen === true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="div" className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {title}
                    </h3>
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </Dialog.Title>
                  {description && (
                    <p className="mt-2 text-sm text-gray-500">{description}</p>
                  )}
                </div>

                {children && (
                  <div className="px-6 py-4">
                    {children}
                  </div>
                )}

                {actions.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end space-x-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          type="button"
                          className={getButtonClasses(action.variant)}
                          onClick={action.onClick}
                          disabled={action.disabled}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
