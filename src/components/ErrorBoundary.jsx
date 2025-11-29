import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

/**
 * Error Boundary to catch React errors gracefully
 * Provides a user-friendly fallback UI when errors occur
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🔴 [ErrorBoundary] App Error:', error, errorInfo);

        // Log to error tracking service (e.g., Sentry)
        if (window.errorTracker) {
            window.errorTracker.captureException(error, { extra: errorInfo });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-screen bg-background text-white p-6">
                    <div className="text-center space-y-4 max-w-md">
                        <AlertTriangle className="w-16 h-16 text-error mx-auto" strokeWidth={1.5} />
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="text-gray-400 leading-relaxed">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <div className="flex gap-3 justify-center pt-4">
                            <Button
                                variant="primary"
                                onClick={() => window.location.reload()}
                            >
                                Reload Application
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => this.setState({ hasError: false, error: null })}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
