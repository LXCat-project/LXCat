// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { TermsOfUseCheckForDeveloper } from "@/citation/terms-of-use-developer";
import {
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
        The API endpoints of the LXCat web service require authentication. Use
        <Code>Authorization: Bearer &lt;token&gt;</Code>{" "}
        as header in the HTTP request.
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
