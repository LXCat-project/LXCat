// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Alert, Center } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";

export const DemoAlert = () => (
  <Center>
    <Alert
      icon={<IconInfoCircle />}
      title="Welcome to the demo deployment of LXCat 3!"
      variant="filled"
      color="red"
      style={{ width: "90%", marginTop: 10 }}
    >
      This is the next version of the LXCat web site. The purpose of this demo
      is to gather feedback on the interfaces, data format, and general
      usability of the new website. Please communicate such feedback in the form
      of issues on the{" "}
      <Link href="https://github.com/LXCat-project/LXCat" target="_blank">
        LXCat GitHub page
      </Link>{" "}
      or in the form of an e-mail to{" "}
      <Link href="mailto:info@lxcat.net">info@lxcat.net</Link>.{" "}
      <b>
        Do not use data downloaded from this deployment in publications. Until
        the platform is officially released, unique identifiers of datasets and
        cross sections will be unstable.
      </b>{" "}
      For now, please obtain your cross section data from{" "}
      <Link href={"https://www.lxcat.net"} target="_blank">
        the LXCat 2 website.
      </Link>
    </Alert>
  </Center>
);
