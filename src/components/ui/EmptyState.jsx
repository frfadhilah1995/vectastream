import React from 'react';
import Button from './Button';

/**
 * Professional Empty State component for better UX
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.title - Main heading
 * @param {string} props.description - Supporting text
 * @param {Function} props.action - Optional action callback
 * @param {string} props.actionLabel - Optional action button text
 */
const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel
}) => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        {Icon && <Icon className="w-16 h-16 text-accent-500/30 mb-4" strokeWidth={1.5} />}
        <h3 className="text-xl font-semibold text-white mb-2">
            {title}
        </h3>
        <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
            {description}
        </p>
        {action && actionLabel && (
            <Button variant="primary" onClick={action}>
                {actionLabel}
            </Button>
        )}
    </div>
);

export default EmptyState;
