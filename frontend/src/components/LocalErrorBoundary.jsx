// src/components/LocalErrorBoundary.jsx
import React from "react";

/**
 * Simple error boundary that shows a fallback element when a child throws.
 * Usage:
 *   <LocalErrorBoundary fallback={<div>Failed…</div>}>
 *     <YourComponent />
 *   </LocalErrorBoundary>
 */
export default class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep your console noise minimal in prod
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[LocalErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}