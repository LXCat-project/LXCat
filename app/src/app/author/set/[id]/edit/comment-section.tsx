// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconPlaylistAdd, IconTrash } from "@tabler/icons-react";

export const CommentSection = (
  { comments, onChange }: {
    comments: Array<string> | undefined;
    onChange: (comments: Array<string> | undefined) => MaybePromise<void>;
  },
) => (
  <Stack justify="stretch">
    {comments?.map((comment, index) => {
      return (
        <Group key={index} justify="center">
          <TextInput
            style={{ flexGrow: 1 }}
            value={comment}
            onChange={(event) => {
              const newComments = [...comments];
              newComments[index] = event.currentTarget.value;
              return onChange(newComments);
            }}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() =>
              onChange(
                comments
                  ? comments.filter((_, curIndex) => curIndex !== index)
                  : undefined,
              )}
          >
            <IconTrash />
          </ActionIcon>
        </Group>
      );
    })}
    <Center>
      <Button
        variant="light"
        onClick={() => onChange(comments ? [...comments, ""] : [""])}
        rightSection={<IconPlaylistAdd />}
      >
        Add comment
      </Button>
    </Center>
  </Stack>
);
