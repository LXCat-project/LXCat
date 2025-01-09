"use client";

import { listSetsOfOwner } from "@/cs-set/client";
import { DeleteDialog } from "@/cs-set/delete-dialog";
import { PublishDialog } from "@/cs-set/publish-dialog";
import { RetractDialog } from "@/cs-set/retract-dialog";
import { ErrorDialog } from "@/shared/error-dialog";
import { User } from "@lxcat/database/auth";
import { KeyedSet } from "@lxcat/database/set";
import { DataTable } from "mantine-datatable";
import Link from "next/link";
import { useState } from "react";

interface Props {
  initialItems: KeyedSet[];
  user: User;
}

export const ClientPage = ({ initialItems, user }: Props) => {
  const [items, setItems] = useState(initialItems);
  const [selectedSetId, setselectedSetId] = useState("");
  const [openRestractDialog, setOpenRetractDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [error, setError] = useState<string>();

  async function reloadItems() {
    // TODO instead of reloading whole list only alter the item that was changed
    const newItems = await listSetsOfOwner();
    setItems(newItems);
  }

  return (
    <>
      <h1>Author scattering cross section sets</h1>

      <DataTable
        columns={[
          { accessor: "name" },
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
        ]}
        records={items}
      />

      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Created on</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* TODO a set can be published and a new version of it can be in draft. Should make clear to user which set is published and in draft. */}
          {items.map((item) => (
            <tr key={item.name}>
              <td>
                {item.versionInfo.status === "published"
                    || item.versionInfo.status === "retracted"
                  ? <Link href={`/scat-css/${item._key}`}>{item.name}</Link>
                  : <>{item.name}</>}
                {/* TODO link to preview a draft + create preview page reusing components from public page */}
              </td>
              <td>{item.versionInfo.status}</td>
              <td>{item.versionInfo.createdOn}</td>
              <td>{item.versionInfo.version}</td>
              <td>
                {item.versionInfo.status === "draft" && (
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
                          onClick={() => {
                            setselectedSetId(item._key);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {user.roles?.includes("publisher")
                      && (
                        <button
                          onClick={() => {
                            setselectedSetId(item._key);
                            setOpenPublishDialog(true);
                          }}
                        >
                          Publish
                        </button>
                      )}
                  </>
                )}
                {item.versionInfo.status === "published" && (
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
                          onClick={() => {
                            setselectedSetId(item._key);
                            setOpenRetractDialog(true);
                          }}
                        >
                          Retract
                        </button>
                      )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

      <RetractDialog
        isOpened={openRestractDialog}
        selectedSetId={selectedSetId}
        onClose={(error) => {
          // TODO give user feed back
          setOpenRetractDialog(false);
          if (error === undefined) {
            reloadItems();
          }

          setError(error);
        }}
      />
      <DeleteDialog
        isOpened={openDeleteDialog}
        selectedSetId={selectedSetId}
        onClose={async (confirmed, error) => {
          setOpenDeleteDialog(false);
          if (confirmed) {
            if (error) {
              // TODO give user feed back
              console.log(error);
            }
            await reloadItems();
          }
        }}
      />
      <PublishDialog
        isOpened={openPublishDialog}
        selectedSetId={selectedSetId}
        onClose={(error) => {
          setOpenPublishDialog(false);

          if (error === undefined) {
            reloadItems();
          }

          setError(error);
        }}
      />
      <ErrorDialog
        opened={error !== undefined}
        error={error ?? ""}
        onClose={() => setError(undefined)}
      />
    </>
  );
};
