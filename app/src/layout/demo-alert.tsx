// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Alert, Anchor, Container } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

const linkProps = {
  inherit: true,
  c: "inherit",
  fw: 600,
  underline: "always",
} as const;

export const DemoAlert = () => (
  <Container size="xl" w="100%" mt="md">
    <Alert
      icon={<IconInfoCircle />}
      title="Welcome to the demo deployment of ChemCat!"
      variant="filled"
      color="red.7"
      radius="md"
    >
      This is the prototype deployment of ChemCat. ChemCat is a data platform
      for sharing plasma chemistry data. The purpose of this prototype is to
      test and showcase ChemCat. The code is available on the{" "}
      <Anchor
        {...linkProps}
        href="https://github.com/LXCat-project/LXCat"
        target="_blank"
      >
        LXCat GitHub page
      </Anchor>{" "}
      <b>
        Do not use data downloaded from this deployment in publications yet.
        Until the platform is officially released, unique identifiers of
        datasets and data items will be unstable.
      </b>
    </Alert>
  </Container>
);
