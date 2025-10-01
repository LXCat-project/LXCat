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
      title="Welcome to the demo deployment of ChemCat!"
      variant="filled"
      color="red"
      style={{ width: "90%", marginTop: 10 }}
    >
      This is the prototype deployment of ChemCat. ChemCat is a data platform
      for sharing plasma chemistry data. The purpose of this prototype is to
      test and showcase ChemCat. The code is available on the{" "}
      <Link
        className={classes.link}
        href="https://github.com/LXCat-project/LXCat"
        target="_blank"
      >
        LXCat GitHub page
      </Link>{" "}
      <b>
        Do not use data downloaded from this deployment in publications yet.
        Until the platform is officially released, unique identifiers of
        datasets and data items will be unstable.
      </b>
    </Alert>
  </Center>
);
