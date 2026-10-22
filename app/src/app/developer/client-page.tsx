// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { TermsOfUseCheckForDeveloper } from "@/citation/terms-of-use-developer";
import {
  Anchor,
  Button,
  Center,
  Code,
  Space,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { generateTokenAction } from "./actions";

export const DeveloperClientPage = () => {
  const [token, setToken] = useState("");
  const [expires, setExpires] = useState("");

  async function generateToken() {
    const body = await generateTokenAction();
    setToken(body.token);
    setExpires(body.expires);
  }

  return (
    <div>
      <Title order={2}>Generate API token</Title>
      <Space h="5pt" />
      <Text>
        The API endpoints of the LXCat web service that retrieve or modify data
        require an API token. Use{" "}
        <Code>Authorization: Bearer &lt;token&gt;</Code>{" "}
        as header in the HTTP request. See the{" "}
        <Anchor href="/docs/5-developer">developer documentation</Anchor>{" "}
        and the <Anchor href="/api-doc">API reference</Anchor>.
      </Text>
      <Space h="md" />
      <TermsOfUseCheckForDeveloper />
      <Space h="md" />
      <Stack align="center">
        <Button onClick={generateToken}>
          I agree with terms of usage & generate token
        </Button>
        {token && (
          <div>
            <Textarea autosize readOnly cols={120}>
              {token}
            </Textarea>
            <Text>
              The token expires on <Text fw={700} span>{expires}</Text>.
            </Text>
          </div>
        )}
      </Stack>
    </div>
  );
};
