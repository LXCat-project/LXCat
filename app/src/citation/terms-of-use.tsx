// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Text } from "@mantine/core";

export const TermsOfUse = () => {
  return (
    <>
      <Text>
        Users acknowledge understanding that LXCat is a community-based project
        with open-access databases being freely provided by individual
        contributors.{" "}
        <Text fw={700} span>
          Proper referencing of material retrieved from this site is essential
          for the longevity of the project.
        </Text>
      </Text>
    </>
  );
};
