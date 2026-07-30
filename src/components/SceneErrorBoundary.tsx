"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onError: (message: string) => void;
};

type State = {
  failed: boolean;
};

export class SceneErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error): void {
    this.props.onError(error.message);
  }

  override render() {
    if (this.state.failed) {
      return (
        <div className="scene-fallback" role="alert">
          <p className="eyebrow">Display paused</p>
          <h2>The scene renderer needs to restart.</h2>
          <p>Your validated design has been preserved.</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
            type="button"
          >
            Restart display
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
