// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Badge, Center, Group, Paper, Text } from "@mantine/core";

import classes from "./card.module.css";

export type NewsCardProps = {
  title: string;
  body: string;
  type: "code" | "data";
  date: string;
};

export function NewsCard(
  { title, body, type, date }: NewsCardProps,
) {
  return (
    <Paper withBorder p="sm" radius="md" shadow="sm" className={classes.card}>
      <Group style={{ width: "100%" }} justify="space-between">
        <Badge>{date}</Badge>
        {type == "code"
          ? <Badge variant="outline" color="orange">code</Badge>
          : <Badge variant="outline" color="pink">data</Badge>}
      </Group>
      <Text ta="center" lineClamp={2} className={classes.title}>
        {title}
      </Text>
      <Center>
        <div style={{ width: "95%" }}>
          <Text ta="justify" fz="sm" c="dimmed" mt={5} lineClamp={3}>
            {body}
          </Text>
        </div>
      </Center>
    </Paper>
  );
}
