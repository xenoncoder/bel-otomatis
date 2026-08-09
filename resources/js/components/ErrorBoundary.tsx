import React from "react";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n";

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const t = useT();
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="bg" p={6}>
      <VStack gap={4} textAlign="center" maxW="md">
        <Heading size="xl" className="sw-gradient-text">{t("error.title")}</Heading>
        <Text color="fg.muted">
          {t("error.desc")}
        </Text>
        {error && (
          <Box
            as="pre"
            p={4}
            borderRadius="xl"
            bg="bg.subtle"
            color="fg.subtle"
            fontSize="xs"
            overflowX="auto"
            maxW="full"
          >
            {error.message}
          </Box>
        )}
        <Button colorPalette="brand" borderRadius="999px" onClick={onReset}>
          {t("error.backToDashboard")}
        </Button>
      </VStack>
    </Box>
  );
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
