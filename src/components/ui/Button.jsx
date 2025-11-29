import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Professional Button Component with variants and states
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.disabled - Disabled state
 */
const Button = React.forwardRef(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    children,
    className,
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-lg shadow-accent-500/20',
        secondary: 'bg-surface-raised border border-glass-border hover:bg-surface-overlay text-white',
        ghost: 'hover:bg-glass-bg text-gray-300 hover:text-white',
        danger: 'bg-error hover:bg-red-600 text-white',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                'rounded-lg font-medium transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
