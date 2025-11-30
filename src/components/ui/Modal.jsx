import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Modal Component - Accessible dialog using Radix UI
 * 
 * @param {Object} props
 * @param {boolean} props.open - Control modal open state
 * @param {Function} props.onOpenChange - Callback when modal state changes
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size - Modal size
 * @param {boolean} props.closeOnOverlayClick - Allow closing on overlay click (default: true)
 * @param {boolean} props.showCloseButton - Show X button (default: true)
 */
const Modal = ({
    open,
    onOpenChange,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    children,
    className,
}) => {
    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-7xl',
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* Overlay */}
                <Dialog.Overlay
                    className={cn(
                        'fixed inset-0 bg-black/80 backdrop-blur-sm',
                        'data-[state=open]:animate-fade-in',
                        'data-[state=closed]:animate-fade-out',
                        'z-[var(--z-modal)]'
                    )}
                />

                {/* Content */}
                <Dialog.Content
                    onPointerDownOutside={(e) => {
                        if (!closeOnOverlayClick) {
                            e.preventDefault();
                        }
                    }}
                    className={cn(
                        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-[90vw] max-h-[85vh] overflow-y-auto',
                        'bg-app-elevated border border-glass-border rounded-2xl shadow-2xl',
                        'p-6',
                        'data-[state=open]:animate-scale-in',
                        'data-[state=closed]:animate-scale-out',
                        'z-[var(--z-modal)]',
                        'focus:outline-none',
                        sizes[size],
                        className
                    )}
                >
                    {children}

                    {/* Close Button */}
                    {showCloseButton && (
                        <Dialog.Close
                            className={cn(
                                'absolute right-4 top-4 p-2 rounded-lg',
                                'text-text-tertiary hover:text-text-primary',
                                'hover:bg-white/10 transition-all',
                                'focus:outline-none focus:ring-2 focus:ring-accent-500'
                            )}
                        >
                            <X size={20} />
                            <span className="sr-only">Close</span>
                        </Dialog.Close>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

// Sub-components for Modal structure
const ModalHeader = ({ className, children }) => (
    <div className={cn('mb-4 pr-8', className)}>
        {children}
    </div>
);

const ModalTitle = React.forwardRef(({ className, children, ...props }, ref) => (
    <Dialog.Title
        ref={ref}
        className={cn('text-2xl font-bold text-text-primary', className)}
        {...props}
    >
        {children}
    </Dialog.Title>
));
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef(({ className, children, ...props }, ref) => (
    <Dialog.Description
        ref={ref}
        className={cn('text-sm text-text-secondary mt-2', className)}
        {...props}
    >
        {children}
    </Dialog.Description>
));
ModalDescription.displayName = 'ModalDescription';

const ModalBody = ({ className, children }) => (
    <div className={cn('my-4', className)}>
        {children}
    </div>
);

const ModalFooter = ({ className, children }) => (
    <div className={cn('mt-6 flex items-center justify-end gap-3', className)}>
        {children}
    </div>
);

// Export Trigger for opening modal from outside
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

export {
    Modal,
    ModalHeader,
    ModalTitle,
    ModalDescription,
    ModalBody,
    ModalFooter,
    ModalTrigger,
    ModalClose,
};

export default Modal;
