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
      title="Welcome to the demo deployment of LXCat 3!"
      variant="filled"
      color="red.7"
      radius="md"
    >
      This is the next version of the LXCat website. The purpose of this demo is
      to gather feedback on the interfaces, data format, and general usability
      of the new website. Please communicate such feedback in the form of issues
      on the{" "}
      <Anchor
        {...linkProps}
        href="https://github.com/LXCat-project/LXCat"
        target="_blank"
      >
        LXCat GitHub page
      </Anchor>{" "}
      or in the form of an e-mail to{" "}
      <Anchor
        {...linkProps}
        href="mailto:info@lxcat.net"
      >
        info@lxcat.net
      </Anchor>.{" "}
      Likewise, existing and new contributors that want to display their data on
      LXCat 3 can reach out to the LXCat team by using the aforementioned links.
      {" "}
      <b>
        Do not use data downloaded from this deployment in publications yet.
        Until the platform is officially released, unique identifiers of
        datasets and cross sections will be unstable.
      </b>{" "}
      For now, please obtain your cross section data from{" "}
      <Anchor
        {...linkProps}
        href="https://www.lxcat.net"
        target="_blank"
      >
        the LXCat 2 website.
      </Anchor>
    </Alert>
  </Container>
);
