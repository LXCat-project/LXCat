// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { TermsOfUseCheckForDeveloper } from "@/citation/terms-of-use-developer";
import type { ApiToken } from "@lxcat/database/auth";
import {
  Anchor,
  Button,
  Center,
  Code,
  Space,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import {
  generateTokenAction,
  listTokensAction,
  revokeTokenAction,
} from "./actions";

/** The times are in UTC, to render the same on the server and in the browser. */
const formatTime = (iso: string) =>
  `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

export const DeveloperClientPage = (
  { initialTokens }: { initialTokens: Array<ApiToken> },
) => {
  const [token, setToken] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [expires, setExpires] = useState("");
  const [name, setName] = useState("");
  const [tokens, setTokens] = useState(initialTokens);

  /** Run the action and show the new list, or tell the user what failed. */
  async function perform(failure: string, action: () => Promise<void>) {
    try {
      await action();
    } catch {
      notifications.show({
        color: "red",
        title: failure,
        message: "Reload the page to see your tokens, and try again.",
      });
      return;
    }

    try {
      setTokens(await listTokensAction());
    } catch {
      notifications.show({
        color: "red",
        title: "Could not load your tokens",
        message: "The change was made. Reload the page to see your tokens.",
      });
    }
  }

  const generateToken = () =>
    perform("Could not generate a token", async () => {
      const body = await generateTokenAction(name);
      setToken(body.token);
      setTokenId(body.jti);
      setExpires(body.expires);
      setName("");
    });

  const openRevokeModal = ({ jti, name, createdOn }: ApiToken) =>
    modals.openConfirmModal({
      title: `Revoke the token ${
        name ? `"${name}"` : "without a name"
      } that was created on ${formatTime(createdOn)}?`,
      children: (
        <Text size="sm">Programs that use it stop working at once.</Text>
      ),
      centered: true,
      labels: { confirm: "Revoke", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        perform("Could not revoke the token", async () => {
          await revokeTokenAction(jti);

          // Do not keep showing a token that does not work anymore.
          if (jti === tokenId) {
            setToken("");
            setTokenId("");
            setExpires("");
          }
        }),
    });

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
        <TextInput
          label="Name (optional)"
          description="Helps you to tell your tokens apart."
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Button onClick={generateToken}>
          I agree with terms of usage & generate token
        </Button>
        {token && (
          <div>
            <Textarea autosize readOnly cols={120} value={token} />
            <Text>
              The token expires on <Text fw={700} span>{expires}</Text>.
            </Text>
          </div>
        )}
      </Stack>
      <Space h="xl" />
      <Title order={2}>Your tokens</Title>
      <Space h="5pt" />
      {tokens.length === 0
        ? <Text>You have no valid tokens.</Text>
        : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tokens.map((apiToken) => (
                <Table.Tr key={apiToken.jti}>
                  <Table.Td>
                    {apiToken.name || <Text span c="dimmed">no name</Text>}
                  </Table.Td>
                  <Table.Td>{formatTime(apiToken.createdOn)}</Table.Td>
                  <Table.Td>{formatTime(apiToken.expires)}</Table.Td>
                  <Table.Td>
                    <Button
                      size="compact-sm"
                      variant="light"
                      color="red"
                      onClick={() => openRevokeModal(apiToken)}
                    >
                      Revoke
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
    </div>
  );
};
