// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { EditedLTPDocument } from "@lxcat/schema";
import {
  Anchor,
  Button,
  JsonInput,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { uploadCS } from "./client-queries";

interface Props {
  set: EditedLTPDocument;
  setKey: string;
  commitMessage: string;
}

export const EditRawSetClient: NextPage<Props> = ({
  set,
  setKey,
  commitMessage,
}) => {
  const [doc, setDoc] = useState(JSON.stringify(set, undefined, 4));
  const [message, setMessage] = useState(commitMessage);
  const [id, setId] = useState(setKey);

  return (
    <>
      <Title order={1}>Edit a scattering cross section set</Title>
      <Text>
        This page allows contributors to edit existing cross section sets in
        JSON format. The JSON schema for edited cross section sets can be found
        {" "}
        {
          // FIXME: This link should point to EditedLTPDocument.
        }
        <Anchor
          component={Link}
          href="/api/set/schema/upload-document"
          target="_blank"
        >
          here
        </Anchor>. Please do not change identifiers, they are used to determine
        whether to update or create a nested item.
      </Text>
      <Space h="xs" />
      <form>
        <Stack align="center">
          <JsonInput
            label="JSON document"
            value={doc}
            onChange={setDoc}
            style={{ width: "70%" }}
            placeholder="Paste JSON document formatted according to the EditedLTPDocument JSON schema."
            formatOnBlur
            autosize
            minRows={4}
            maxRows={60}
          />
          <TextInput
            label="Commit message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Optionally describe which changes have been made."
          />
          <Button
            type="submit"
            onClick={async (event) => {
              event.preventDefault();

              const result = await uploadCS(id, doc, commitMessage);

              notifications.clean();

              if (result.isErr) {
                for (const error of result.error) {
                  notifications.show({
                    color: "red",
                    "title": "Error encountered during update.",
                    "message": error,
                    autoClose: false,
                  });
                }
                return;
              }
              notifications.show({
                color: "green",
                "title": setKey === result.value
                  ? "Draft update successful."
                  : "Draft creation successful.",
                "message": `The ID of the draft is ${result.value}.`,
                autoClose: false,
              });

              setId(result.value);
            }}
          >
            Update cross section set
          </Button>
        </Stack>
      </form>
    </>
  );
};
