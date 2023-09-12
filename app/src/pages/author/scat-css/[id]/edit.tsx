// @ts-nocheck

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  OrganizationFromDB,
  userMemberships,
} from "@lxcat/database/dist/auth/queries";
import {
  byOwnerAndId,
  CrossSectionSetInputOwned,
  getVersionInfo,
} from "@lxcat/database/dist/css/queries/author_read";
import type { ErrorObject } from "ajv";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { mustBeAuthor } from "../../../../auth/middleware";
import { EditForm } from "../../../../ScatteringCrossSectionSet/EditForm";
import { ErrorList } from "../../../../shared/ErrorList";
import { Layout } from "../../../../shared/Layout";

interface Props {
  set: CrossSectionSetInputOwned;
  setKey: string;
  commitMessage: string;
  organizations: OrganizationFromDB[];
}

const EditCrossSectionSetPage: NextPage<Props> = ({
  set,
  setKey,
  commitMessage,
  organizations,
}) => {
  const [errors, setErrors] = useState<ErrorObject[]>([]);
  const [id, setId] = useState("");

  async function onSubmit(
    newSet: CrossSectionSetInputOwned,
    newMessage: string,
  ) {
    const url = `/api/author/scat-css/${setKey}`;
    const body = JSON.stringify({
      doc: newSet,
      message: newMessage,
    });
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    const init = { method: "POST", body, headers };
    const res = await fetch(url, init);
    const data = await res.json();
    if (res.ok) {
      setId(data.id);
    } else {
      setErrors(data.errors);
    }
  }

  return (
    <Layout>
      <h1>Edit scattering cross section set</h1>
      <EditForm
        set={set}
        commitMessage={commitMessage}
        onSubmit={onSubmit}
        organizations={organizations}
      />
      {errors.length > 0 && <ErrorList errors={errors} />}
      {id && id === set._key && (
        <div>Update successful, a draft has been created with id is {id}</div>
      )}
      {id && id !== set._key && (
        <div>Update successful, the draft been updated.</div>
      )}
      <Link href={`/author/scat-css`}>Back</Link>
    </Layout>
  );
};

export default EditCrossSectionSetPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const me = await mustBeAuthor(context);
  const id = context.params?.id!;
  const set = await byOwnerAndId(me.email, id);
  const organizations = await userMemberships(me.email);
  const info = await getVersionInfo(id);
  const commitMessage = info !== undefined && info.commitMessage
    ? info.commitMessage
    : "";
  if (set === undefined) {
    return {
      // TODO should return notFound when id does not exist
      // , but should return forbidden response when not owned by user?
      // need to update query to distinguish bewteen the 2
      notFound: true,
    };
  }
  return {
    props: {
      set,
      setKey: id,
      commitMessage,
      organizations,
    },
  };
};
