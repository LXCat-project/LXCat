// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Fieldset, Space, Text, Title } from "@mantine/core";
import { HowToCite } from "./how-to-cite";
import { TermsOfUse } from "./terms-of-use";

export const TermsOfUseCheckForDeveloper = () => {
  return (
    <Fieldset>
      <Title order={2}>Terms of use</Title>
      <Space h="sm" />
      <TermsOfUse />
      <p>
        <Text>
          The data retrieved from API endpoints should be cited using their
          references.
        </Text>
      </p>
      <HowToCite references={[]} />
    </Fieldset>
  );
};
