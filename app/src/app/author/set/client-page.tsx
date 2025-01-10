// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { User } from "@lxcat/database/auth";
import { KeyedSet } from "@lxcat/database/set";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useState } from "react";
import { deleteSet, listSetsOfOwner, publishSet } from "./client-queries";

interface Props {
  initialItems: KeyedSet[];
  user: User;
}

export const ClientPage = ({ initialItems, user }: Props) => {
  const [items, setItems] = useState(initialItems);

  async function reloadItems() {
    // TODO instead of reloading the whole list only alter the item that was changed.
    const newItems = await listSetsOfOwner();
    setItems(newItems);
  }

  const openRetractModal = (key: string, name: string) =>
    modals.openConfirmModal({
      title:
        `Are you sure you want to retract the ${name} dataset with key ${key}?`,
      centered: true,
      labels: { confirm: "Retract", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const response = deleteSet(key, "Retracted");

        const notification_id = notifications.show({
          loading: true,
          title: `Retracting the ${name} set with key ${key}.`,
          message: "",
          autoClose: false,
          withCloseButton: false,
        });

        const result = await response;

        if (result.isOk) {
          await reloadItems();
          notifications.update({
            id: notification_id,
            color: "teal",
            title: `Succesfully retracted the ${name} set!`,
            message: "",
            loading: false,
            autoClose: 2000,
          });
        } else {
          notifications.update({
            id: notification_id,
            color: "red",
            title: `Error encountered when retracting the ${name} set`,
            message: result.error,
            loading: false,
            autoClose: 2000,
          });
        }
      },
    });

  const openDeleteModal = (key: string, name: string) =>
    modals.openConfirmModal({
      title:
        `Are you sure you want to delete the ${name} dataset draft with key ${key}?`,
      centered: true,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const response = deleteSet(key, "Delete draft");

        const notification_id = notifications.show({
          loading: true,
          title: `Deleting the ${name} draft set with key ${key}.`,
          message: "",
          autoClose: false,
          withCloseButton: false,
        });

        const result = await response;

        if (result.isOk) {
          await reloadItems();
          notifications.update({
            id: notification_id,
            color: "teal",
            title: `Succesfully deleted the ${name} draft set!`,
            message: "",
            loading: false,
            autoClose: 2000,
          });
        } else {
          notifications.update({
            id: notification_id,
            color: "red",
            title: `Error encountered when deleting the ${name} draft set`,
            message: result.error,
            loading: false,
            autoClose: 2000,
          });
        }
      },
    });

  const openPublishModal = (key: string, name: string) =>
    modals.openConfirmModal({
      title:
        `Are you sure you want to publish the ${name} dataset with key ${key}?`,
      centered: true,
      labels: { confirm: "Publish", cancel: "Cancel" },
      onConfirm: async () => {
        const response = publishSet(key);

        const notification_id = notifications.show({
          loading: true,
          title: `Publishing the ${name} set with key ${key}.`,
          message: "",
          autoClose: false,
          withCloseButton: false,
        });

        const result = await response;

        if (result.isOk) {
          await reloadItems();
          notifications.update({
            id: notification_id,
            color: "teal",
            title: `Succesfully published the ${name} set!`,
            message: "",
            loading: false,
            autoClose: 2000,
          });
        } else {
          notifications.update({
            id: notification_id,
            color: "red",
            title: `Error encountered when publishing the ${name} draft set`,
            message: result.error,
            loading: false,
            autoClose: 2000,
          });
        }
      },
    });

  return (
    <>
      <h1>Author scattering cross section sets</h1>

      <DataTable
        idAccessor="_key"
        columns={[
          { accessor: "name", title: "Set name" },
          {
            accessor: "versionInfo.status",
            title: "Status",
          },
          {
            accessor: "versionInfo.createdOn",
            title: "Timestamp",
          },
          {
            accessor: "versionInfo.version",
            title: "Version",
          },
          {
            accessor: "actions",
            render: (item) => {
              if (item.versionInfo.status === "draft") {
                return (
                  <>
                    {user.roles?.includes("author") && (
                      <>
                        <Link href={`/author/set/${item._key}/edit`}>
                          <button>Edit</button>
                        </Link>
                        <Link href={`/author/set/${item._key}/editraw`}>
                          <button>Edit JSON</button>
                        </Link>
                        <button
                          onClick={() => openDeleteModal(item._key, item.name)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {user.roles?.includes("publisher")
                      && (
                        <button
                          onClick={() => openPublishModal(item._key, item.name)}
                        >
                          Publish
                        </button>
                      )}
                  </>
                );
              } else if (item.versionInfo.status === "published") {
                return (
                  <>
                    {user.roles?.includes("author")
                      && (
                        <>
                          <Link href={`/author/set/${item._key}/edit`}>
                            <button>Edit</button>
                          </Link>
                          <Link href={`/author/set/${item._key}/editraw`}>
                            <button>Edit JSON</button>
                          </Link>
                        </>
                      )}
                    {user.roles?.includes("publisher")
                      && (
                        <button
                          onClick={() => openRetractModal(item._key, item.name)}
                        >
                          Retract
                        </button>
                      )}
                  </>
                );
              }
            },
          },
        ]}
        records={items}
      />

      <div>
        <Link href="/author/set/add">
          <button>Add</button>
        </Link>
        <Link href="/author/set/addraw">
          <button>Add as JSON document</button>
        </Link>
      </div>
      <div>
        <Link href="/author">Back</Link>
      </div>
    </>
  );
};
