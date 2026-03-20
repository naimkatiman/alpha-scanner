'use client'

import React, { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md rounded-xl border border-[#222] bg-[#111] p-6 text-center">
            {/* Error icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ef4444]/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-white">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h3>
            <p className="mb-4 text-xs text-gray-500 break-all">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>

            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2563eb] active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Export both named and default for compatibility
export { ErrorBoundaryComponent as ErrorBoundary }
export default ErrorBoundaryComponent
