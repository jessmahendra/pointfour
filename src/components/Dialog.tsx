"use client";

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  dismissible?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]'
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
  size = 'md',
  dismissible = true
}: DialogProps) {
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      modal={true}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <BaseDialog.Popup 
          className={`
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-white rounded-lg shadow-xl z-50 w-full mx-4
            ${sizeClasses[size]}
            ${className}
          `}
        >
          {(title || description) && (
            <div className="p-6 border-b border-gray-200">
              {title && (
                <BaseDialog.Title className="text-lg font-semibold text-gray-900">
                  {title}
                </BaseDialog.Title>
              )}
              {description && (
                <BaseDialog.Description className="mt-1 text-sm text-gray-600">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
          
          <BaseDialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

// Export individual components for more flexibility
export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogPortal = BaseDialog.Portal;
export const DialogBackdrop = BaseDialog.Backdrop;
export const DialogPopup = BaseDialog.Popup;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;
export const DialogClose = BaseDialog.Close;
