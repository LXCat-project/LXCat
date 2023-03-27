"use client";

import { Dialog, Text } from "@mantine/core";

export const ErrorDialog = (
  { opened, error, onClose }: {
    opened: boolean;
    error: string;
    onClose: () => void;
  },
) => (
  <Dialog opened={opened} withCloseButton onClose={onClose}>
    <Text size="md" color="red" weight={700}>{error}</Text>
  </Dialog>
);
