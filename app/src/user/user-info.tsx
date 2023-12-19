// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Avatar, Group, Text } from "@mantine/core";
import { IconAt, IconId } from "@tabler/icons-react";
import classes from "./user.module.css";

interface UserInfoIconsProps {
  avatar: string;
  name: string;
  orcid?: string;
  email?: string;
}

// TODO: Make email and orcid links?
// const orcidURL = process.env.ORCID_SANDBOX
//   ? `https://sandbox.orcid.org/${session.user.orcid}`
//   : `https://orcid.org/${session.user.orcid}`;

export function UserInfoIcons(
  { avatar, name, orcid, email }: UserInfoIconsProps,
) {
  return (
    <div>
      <Group wrap="nowrap">
        <Avatar src={avatar} size={80} radius="md" />
        <div>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            User
          </Text>

          <Text fz="lg" fw={500} className={classes.name}>
            {name}
          </Text>

          <Group wrap="nowrap" gap={10} mt={3}>
            <IconAt stroke={1.5} size="1rem" className={classes.icon} />
            <Text fz="xs" c="dimmed">
              {email}
            </Text>
          </Group>

          <Group wrap="nowrap" gap={10} mt={5}>
            <IconId stroke={1.5} size="1rem" className={classes.icon} />
            <Text fz="xs" c="dimmed">
              {orcid ? orcid : "-"}
            </Text>
          </Group>
        </div>
      </Group>
    </div>
  );
}
