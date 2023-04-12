// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Dialog, Text } from "@mantine/core";

export const ErrorDialog = (
  { opened, error, onClose }: {
    opened: boolean;
    error: string | Error;
    onClose: () => void;
  },
) => (
  <Dialog opened={opened} withCloseButton onClose={onClose}>
    <Text size="md" color="red" weight={700}>
      {typeof error === "string" ? error : error.message}
    </Text>
  </Dialog>
);
