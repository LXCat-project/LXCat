import { Avatar, createStyles, Group, Text } from "@mantine/core";
import { IconAt, IconId } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  icon: {
    color: theme.colorScheme === "dark"
      ? theme.colors.dark[3]
      : theme.colors.gray[5],
  },

  name: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },
}));

interface UserInfoIconsProps {
  avatar: string;
  name: string;
  orcid?: string;
  email?: string;
}

export function UserInfoIcons(
  { avatar, name, orcid, email }: UserInfoIconsProps,
) {
  const { classes } = useStyles();
  return (
    <div>
      <Group noWrap>
        <Avatar src={avatar} size={80} radius="md" />
        <div>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            User
          </Text>

          <Text fz="lg" fw={500} className={classes.name}>
            {name}
          </Text>

          <Group noWrap spacing={10} mt={3}>
            <IconAt stroke={1.5} size="1rem" className={classes.icon} />
            <Text fz="xs" c="dimmed">
              {email}
            </Text>
          </Group>

          <Group noWrap spacing={10} mt={5}>
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
