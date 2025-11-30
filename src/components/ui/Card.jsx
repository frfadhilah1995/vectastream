import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card Component - Glassmorphism container for content
 * 
 * @param {Object} props
 * @param {'default'|'glass'|'elevated'|'flat'} props.variant - Card style
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.clickable - Make card clickable
 */
const Card = React.forwardRef(({
    variant = 'default',
    hover = false,
    clickable = false,
    children,
    className,
    ...props
}, ref) => {
    const variants = {
        default: 'bg-app-surface border border-glass-border',
        glass: 'bg-glass-bg backdrop-blur-xl border border-glass-border',
        elevated: 'bg-app-elevated shadow-xl border border-glass-border',
        flat: 'bg-app-surface',
    };

    const hoverEffects = hover || clickable
        ? 'hover:bg-app-elevated hover:border-accent-500/30 hover:shadow-glow-accent transition-all duration-300'
        : '';

    const clickableClass = clickable
        ? 'cursor-pointer active:scale-[0.98]'
        : '';

    return (
        <div
            ref={ref}
            className={cn(
                'rounded-xl p-4',
                variants[variant],
                hoverEffects,
                clickableClass,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

// Sub-components for Card structure
const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('mb-4 pb-4 border-b border-glass-border', className)}
        {...props}
    >
        {children}
    </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn('text-xl font-semibold text-text-primary', className)}
        {...props}
    >
        {children}
    </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-text-secondary mt-1', className)}
        {...props}
    >
        {children}
    </p>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('', className)}
        {...props}
    >
        {children}
    </div>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('mt-4 pt-4 border-t border-glass-border flex items-center gap-2', className)}
        {...props}
    >
        {children}
    </div>
));
CardFooter.displayName = 'CardFooter';

// Export all components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
