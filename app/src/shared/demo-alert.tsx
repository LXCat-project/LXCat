// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Alert, Center } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";

import classes from "./demo-alert.module.css";

export const DemoAlert = () => (
  <Center>
    <Alert
      icon={<IconInfoCircle />}
      title="Welcome to the demo deployment of LXCat 3!"
      variant="filled"
      color="red"
      style={{ width: "90%", marginTop: 10 }}
    >
      This is the next version of the LXCat website. The purpose of this demo is
      to gather feedback on the interfaces, data format, and general usability
      of the new website. Please communicate such feedback in the form of issues
      on the{" "}
      <Link
        className={classes.link}
        href="https://github.com/LXCat-project/LXCat"
        target="_blank"
      >
        LXCat GitHub page
      </Link>{" "}
      or in the form of an e-mail to{" "}
      <Link className={classes.link} href="mailto:info@lxcat.net">
        info@lxcat.net
      </Link>.{" "}
      Likewise, existing and new contributors that want to display their data on
      LXCat 3 can reach out to the LXCat team by using the aforementioned links.
      {" "}
      <b>
        Do not use data downloaded from this deployment in publications yet.
        Until the platform is officially released, unique identifiers of
        datasets and cross sections will be unstable.
      </b>{" "}
      For now, please obtain your cross section data from{" "}
      <Link
        className={classes.link}
        href={"https://www.lxcat.net"}
        target="_blank"
      >
        the LXCat 2 website.
      </Link>
    </Alert>
  </Center>
);
