import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

export class WidgetErrorBoundary extends Component<{ children: ReactNode; title?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Render a safe widget state without exposing internals. */ }
  render() {
    if (this.state.failed) return <EmptyState icon="exclamation-circle" title={this.props.title ?? 'This section could not be displayed.'} description="Your other financial information is still available." action={<Button variant="outline" size="sm" onClick={() => this.setState({ failed: false })}>Try again</Button>} />;
    return this.props.children;
  }
}
