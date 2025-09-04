import { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, Button, Box, Typography } from "@mui/material";
import { Refresh, BugReport } from "@mui/icons-material";
import { API_CONFIG } from "../config/api";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of the component tree that crashed.
 *
 * This follows React's error boundary pattern for production-ready applications.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for development
    console.error("Error caught by ErrorBoundary:", error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you would log this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BugReport />
              Something went wrong
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              An unexpected error occurred. This has been logged and our team
              has been notified.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                size="small"
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReload}
                size="small"
              >
                Reload Page
              </Button>
            </Box>
          </Alert>

          {/* Show error details in development */}
          {API_CONFIG.IS_DEVELOPMENT && this.state.error && (
            <Alert severity="warning" sx={{ textAlign: "left", mt: 2 }}>
              <AlertTitle>Development Error Details</AlertTitle>
              <Typography
                component="pre"
                variant="caption"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                }}
              >
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </Typography>
            </Alert>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}
