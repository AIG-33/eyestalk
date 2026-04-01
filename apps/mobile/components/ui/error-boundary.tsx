import { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
    // Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0F0E17',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#FFFFFE', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  message: { color: '#A7A9BE', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#6C5CE7', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
});
