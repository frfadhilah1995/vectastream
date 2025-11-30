import React, { useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Input Component - Modern text input with variants and icons
 * 
 * @param {Object} props
 * @param {'text'|'email'|'password'|'search'|'url'|'number'} props.type - Input type
 * @param {'sm'|'md'|'lg'} props.size - Input size
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 * @param {boolean} props.clearable - Show clear button
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below input
 */
const Input = React.forwardRef(({
    type = 'text',
    size = 'md',
    leftIcon,
    rightIcon,
    clearable = false,
    error,
    helperText,
    className,
    onChange,
    value,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');

    const sizes = {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-13 px-5 text-lg',
    };

    const handleChange = (e) => {
        setInternalValue(e.target.value);
        onChange?.(e);
    };

    const handleClear = () => {
        const event = { target: { value: '' } };
        setInternalValue('');
        onChange?.(event);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const hasValue = value !== undefined ? value.length > 0 : internalValue.length > 0;

    return (
        <div className="w-full">
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                {/* Search Icon (for search type) */}
                {type === 'search' && !leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                        <Search size={18} />
                    </div>
                )}

                {/* Input Field */}
                <input
                    ref={ref}
                    type={inputType}
                    value={value}
                    onChange={handleChange}
                    className={cn(
                        'w-full rounded-lg border bg-app-surface text-text-primary',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
                        'placeholder:text-text-tertiary',
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-app-surface/50',
                        sizes[size],
                        leftIcon || type === 'search' ? 'pl-10' : '',
                        (rightIcon || clearable || type === 'password') ? 'pr-10' : '',
                        error ? 'border-error focus:ring-error focus:border-error' : 'border-glass-border',
                        className
                    )}
                    {...props}
                />

                {/* Right Icons */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Clear Button */}
                    {clearable && hasValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-text-tertiary hover:text-text-primary transition-colors p-0.5 hover:bg-white/10 rounded"
                            tabIndex={-1}
                        >
                            <X size={16} />
                        </button>
                    )}

                    {/* Password Toggle */}
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-tertiary hover:text-text-primary transition-colors p-0.5 hover:bg-white/10 rounded"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {/* Custom Right Icon */}
                    {rightIcon && (
                        <div className="text-text-tertiary">
                            {rightIcon}
                        </div>
                    )}
                </div>
            </div>

            {/* Helper Text or Error Message */}
            {(error || helperText) && (
                <div className={cn(
                    'mt-1.5 text-xs',
                    error ? 'text-error' : 'text-text-secondary'
                )}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// Textarea variant
const Textarea = React.forwardRef(({
    className,
    error,
    helperText,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            <textarea
                ref={ref}
                className={cn(
                    'w-full rounded-lg border bg-app-surface text-text-primary px-4 py-3',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
                    'placeholder:text-text-tertiary',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-app-surface/50',
                    'resize-none',
                    error ? 'border-error focus:ring-error focus:border-error' : 'border-glass-border',
                    className
                )}
                {...props}
            />
            {(error || helperText) && (
                <div className={cn(
                    'mt-1.5 text-xs',
                    error ? 'text-error' : 'text-text-secondary'
                )}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

export { Input, Textarea };
export default Input;
