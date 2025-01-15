// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import type { KeyedOrganization, User, UserFromDB } from "@lxcat/database/auth";
import { Role } from "@lxcat/database/auth";
import { ActionIcon, Checkbox, Group, MultiSelect, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import type { NextPage } from "next";
import { useState } from "react";
import { deleteUser, updateOrganization, updateRole } from "./client-queries";

interface Props {
  users: UserFromDB[];
  organizations: KeyedOrganization[];
  me: User;
}

export const AdminUsersClient: NextPage<Props> = ({
  me,
  users: initalUsers,
  organizations,
}) => {
  const [users, setUsers] = useState(initalUsers);

  const openDeleteModal = (user: UserFromDB) =>
    modals.openConfirmModal({
      title:
        `Are you sure you want to delete the ${user.name} user with key ${user._key}?`,
      centered: true,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const response = deleteUser(user);

        const notification_id = notifications.show({
          loading: true,
          title: `Deleting the ${user.name} user with key ${user._key}.`,
          message: "",
          autoClose: false,
          withCloseButton: false,
        });

        const result = await response;

        if (result.isOk) {
          setUsers((users) => users.filter((u) => u.email === user.email));
          notifications.update({
            id: notification_id,
            color: "teal",
            title: `Succesfully deleted the ${user.name} user.`,
            message: "",
            loading: false,
            autoClose: 2000,
          });
        } else {
          notifications.update({
            id: notification_id,
            color: "red",
            title: `Cannot delete the ${user.name} user.`,
            message: result.error,
            loading: false,
            autoClose: 2000,
          });
        }
      },
    });

  return (
    <>
      <Title order={1}>Administrate users</Title>

      <DataTable
        records={users}
        idAccessor="_key"
        columns={[
          {
            accessor: "name",
          },
          {
            accessor: "email",
          },
          {
            accessor: "roles",
            render: (user) => (
              <Group gap="xs">
                {Role.options
                  .filter((r) => r !== "download")
                  .map((r) => (
                    <Checkbox
                      key={r}
                      label={r}
                      checked={user.roles?.includes(r)}
                      onChange={async () => {
                        const result = await updateRole(user, r);

                        if (result.isErr) {
                          notifications.show({
                            color: "red",
                            title: `Cannot toggle ${r} role on ${user.name}`,
                            message: result.error,
                          });
                          return;
                        }

                        const newUsers = users.map((
                          u,
                        ) => (u.email === user.email
                          ? { ...user, roles: result.value }
                          : u)
                        );
                        setUsers(newUsers);
                        notifications.show({
                          color: "green",
                          title:
                            `Succesfully toggled ${r} role on ${user.name}`,
                          message: "",
                        });
                      }}
                    />
                  ))}
              </Group>
            ),
          },
          {
            accessor: "organizations",
            render: (user) => (
              <MultiSelect
                aria-label={`Memberships of ${user.email}`}
                onChange={async (selection) => {
                  const result = await updateOrganization(user, selection);

                  if (result.isErr) {
                    notifications.show({
                      color: "red",
                      title: `Cannot set organizations for ${user.name}`,
                      message: result.error,
                    });
                    return;
                  }

                  setUsers((users) =>
                    users.map((u) =>
                      u.email === user.email
                        ? { ...user, organizations: result.value }
                        : u
                    )
                  );
                  notifications.show({
                    color: "green",
                    title: `Succesfully set organizations for ${user.name}`,
                    message: "",
                  });
                }}
                value={user.organizations}
                data={organizations.map((o) => ({
                  value: o._key,
                  label: o.name,
                }))}
              />
            ),
          },
          {
            accessor: "actions",
            render: (user) => (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => openDeleteModal(user)}
                disabled={me.email === user.email}
              >
                <IconTrash size={16} />
              </ActionIcon>
            ),
          },
        ]}
      />
    </>
  );
};
