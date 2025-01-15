// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Anchor,
  Button,
  JsonInput,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { MouseEvent, useState } from "react";
import { ZodError } from "zod";
import { uploadCS } from "./client-queries";

export const AddRawSetClient = () => {
  const [doc, setDoc] = useState("");
  const [id, setId] = useState("");

  return (
    <>
      <Title order={1}>Add a scattering cross section set</Title>
      <Text>
        This page allows contributors to upload new cross section sets in JSON
        format. The JSON schema for uploading cross section sets can be found
        {" "}
        <Anchor
          component={Link}
          href="/api/scat-css/schema/upload-document"
          target="_blank"
        >
          here
        </Anchor>.
      </Text>
      <Space h="xs" />
      <form>
        <Stack align="center">
          <JsonInput
            value={doc}
            onChange={setDoc}
            style={{ width: "70%" }}
            placeholder="Paste JSON document formatted according to the NewLTPDocument JSON schema."
            formatOnBlur
            autosize
            minRows={4}
            maxRows={60}
          />
          <div>
            <Button
              type="submit"
              onClick={async (event) => {
                event.preventDefault();
                setId("");

                const result = await uploadCS(doc);

                notifications.clean();

                if (result.isErr) {
                  for (const error of result.error) {
                    notifications.show({
                      color: "red",
                      "title": "Error encountered during upload.",
                      "message": error,
                      autoClose: false,
                    });
                  }
                  return;
                }
                notifications.show({
                  color: "green",
                  "title": "Draft creation succesful.",
                  "message":
                    `The ID of the newly created draft is ${result.value}.`,
                  autoClose: false,
                });

                setId(result.value);
              }}
            >
              Upload cross section set
            </Button>
          </div>
        </Stack>
      </form>
    </>
  );
};
