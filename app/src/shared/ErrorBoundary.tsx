"use client";

import React from "react";
import { Maybe } from "true-myth";
import { ErrorDialog } from "./ErrorDialog";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Maybe<Error>;
}

export default class ErrorBoundary
  extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
{
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: Maybe.nothing() };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error: Maybe.just(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log({ error, errorInfo });
  }

  render() {
    const { error } = this.state;

    return (
      <>
        {error.isJust && (
          <ErrorDialog
            opened={true}
            error={error.value}
            onClose={() => this.setState({ error: Maybe.nothing() })}
          />
        )}
        {this.props.children}
      </>
    );
  }
}
