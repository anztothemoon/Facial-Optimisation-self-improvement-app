import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors } from '../theme';

type Props = { children: ReactNode };

type State = {
  hasError: boolean;
  message: string | null;
  retryKey: number;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null, retryKey: 0 };

  static getDerivedStateFromError(err: Error): Partial<State> {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            {this.state.message ??
              'Please try again. If the problem continues, restart the app.'}
          </Text>
          <PrimaryButton
            label="Try again"
            onPress={() =>
              this.setState((s) => ({
                hasError: false,
                message: null,
                retryKey: s.retryKey + 1,
              }))
            }
          />
        </View>
      );
    }
    return (
      <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
