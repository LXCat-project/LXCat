// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CrossSectionSetOwned,
  listOwned,
} from "@lxcat/database/dist/css/queries/author_read";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { mustBeAuthor } from "../../../auth/middleware";
import { listSetsOfOwner } from "../../../ScatteringCrossSectionSet/client";
import { DeleteDialog } from "../../../ScatteringCrossSectionSet/DeleteDialog";
import { PublishDialog } from "../../../ScatteringCrossSectionSet/PublishDialog";
import { RetractDialog } from "../../../ScatteringCrossSectionSet/RetractDialog";
import { Layout } from "../../../shared/Layout";

interface Props {
  items: CrossSectionSetOwned[];
}

const Admin: NextPage<Props> = ({ items: initialItems }) => {
  const [items, setItems] = useState(initialItems);
  const [selectedSetId, setselectedSetId] = useState("");
  const [openRestractDialog, setOpenRetractDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);

  async function reloadItems() {
    // TODO instead of reloading whole list only alter the item that was changed
    const newItems = await listSetsOfOwner();
    setItems(newItems);
  }

  return (
    <Layout>
      <h1>Author scattering cross section sets</h1>

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
                    <Link href={`/author/scat-css/${item._key}/edit`}>
                      <button>Edit</button>
                    </Link>
                    <Link href={`/author/scat-css/${item._key}/editraw`}>
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
                    <button
                      onClick={() => {
                        setselectedSetId(item._key);
                        setOpenPublishDialog(true);
                      }}
                    >
                      Publish
                    </button>
                  </>
                )}
                {item.versionInfo.status === "published" && (
                  <>
                    <Link href={`/author/scat-css/${item._key}/edit`}>
                      <button>Edit</button>
                    </Link>
                    <Link href={`/author/scat-css/${item._key}/editraw`}>
                      <button>Edit JSON</button>
                    </Link>
                    <button
                      onClick={() => {
                        setselectedSetId(item._key);
                        setOpenRetractDialog(true);
                      }}
                    >
                      Retract
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <Link href="/author/scat-css/add">
          <button>Add</button>
        </Link>
        <Link href="/author/scat-css/addraw">
          <button>Add as JSON document</button>
        </Link>
      </div>
      <div>
        <Link href="/author">Back</Link>
      </div>

      <RetractDialog
        isOpened={openRestractDialog}
        selectedSetId={selectedSetId}
        onClose={(confirmed) => {
          // TODO give user feed back
          setOpenRetractDialog(false);
          if (confirmed) {
            reloadItems();
          }
        }}
      />
      <DeleteDialog
        isOpened={openDeleteDialog}
        selectedSetId={selectedSetId}
        onClose={(confirmed) => {
          // TODO give user feed back
          setOpenDeleteDialog(false);
          if (confirmed) {
            reloadItems();
          }
        }}
      />
      <PublishDialog
        isOpened={openPublishDialog}
        selectedSetId={selectedSetId}
        onClose={(confirmed) => {
          // TODO give user feed back
          setOpenPublishDialog(false);
          if (confirmed) {
            reloadItems();
          }
        }}
      />
    </Layout>
  );
};

export default Admin;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const me = await mustBeAuthor(context);
  const items = await listOwned(me.email);
  return {
    props: {
      items,
    },
  };
};
