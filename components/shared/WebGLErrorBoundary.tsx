'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for WebGL/Three.js crashes.
 * Catches render errors in the Canvas tree and shows a graceful fallback
 * instead of crashing the entire page.
 */
export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('WebGL Error Boundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-0 pointer-events-none">
          <div className="text-center max-w-md px-4 pointer-events-auto">
            <h2 className="text-xl font-bold mb-3 gradient-gold">
              Visual Experience Unavailable
            </h2>
            <p className="text-sm text-neutral-400">
              The 3D experience encountered an issue. The site content is still fully accessible below.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
