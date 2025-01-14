// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { KeyedOrganization } from "@lxcat/database/auth";
import {
  ActionIcon,
  Button,
  Group,
  Space,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { DataTable } from "mantine-datatable";
import { useState } from "react";

import { modals } from "@mantine/modals";
import { IconTrash } from "@tabler/icons-react";
import classes from "./client-page.module.css";
import { addOrganization, dropOrganization } from "./client-queries";

interface Props {
  organizations: KeyedOrganization[];
}

export const AdminOrganizationsClient = ({ organizations }: Props) => {
  const [orgs, setOrgs] = useState(organizations);
  const [newOrgName, setNewOrgName] = useState("");

  const openDeleteModal = (key: string, name: string) =>
    modals.openConfirmModal({
      title:
        `Are you sure you want to delete the ${name} organization with key ${key}?`,
      centered: true,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const response = dropOrganization(key);

        const notification_id = notifications.show({
          loading: true,
          title: `Deleting the ${name} organization with key ${key}`,
          message: "",
          autoClose: false,
          withCloseButton: false,
        });

        const result = await response;

        if (result.isOk) {
          setOrgs((orgs) => orgs.filter((org) => org._key !== key));
          notifications.update({
            id: notification_id,
            color: "teal",
            title: `Succesfully deleted the ${name} organization`,
            message: "",
            loading: false,
            autoClose: 2000,
          });
        } else {
          notifications.update({
            id: notification_id,
            color: "red",
            title: `Cannot delete the ${name} organization`,
            message: result.error,
            loading: false,
            autoClose: 2000,
          });
        }
      },
    });

  //   setOrgs((orgs) => [...orgs, newOrg]);
  //   setNewOrgName("");
  // notifications.show({
  //   color: "red",
  //   title: `Cannot add the ${newOrgName} organization.`,
  //   message: await res.text(),
  // });

  return (
    <>
      <Title order={2}>Administrate organizations</Title>
      <Space h="md" />
      <Stack align="center">
        <DataTable
          className={classes.scrollableTable}
          withTableBorder
          borderRadius="sm"
          style={{ width: "70%" }}
          records={orgs}
          idAccessor="_key"
          columns={[{ accessor: "name" }, {
            accessor: "actions",
            render: (item) => (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => openDeleteModal(item._key, item.name)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            ),
          }]}
        />
        <Group>
          <TextInput
            placeholder="New organization name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.currentTarget.value)}
            minLength={1}
          />
          <Button
            onClick={async () => {
              const res = await addOrganization(newOrgName);

              if (res.isErr) {
                notifications.show({
                  color: "red",
                  title: `Cannot add the ${newOrgName} organization.`,
                  message: res.error,
                });
                return;
              }

              notifications.show({
                color: "green",
                title: `Succesfully created the ${newOrgName} organization.`,
                message: "",
              });

              setOrgs((orgs) => [...orgs, res.value]);
              setNewOrgName("");
            }}
          >
            Add
          </Button>
        </Group>
      </Stack>
    </>
  );
};
