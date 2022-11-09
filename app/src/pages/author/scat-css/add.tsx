// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../../shared/Layout";
import type { ErrorObject } from "ajv";
import { useState } from "react";
import { mustBeAuthor } from "../../../auth/middleware";
import { CrossSectionSetInputOwned } from "@lxcat/database/dist/css/queries/author_read";
import Link from "next/link";
import {
  OrganizationFromDB,
  userMemberships,
} from "@lxcat/database/dist/auth/queries";
import { AddForm } from "../../../ScatteringCrossSectionSet/AddForm";
import { ErrorList } from "../../../shared/ErrorList";

interface Props {
  organizations: OrganizationFromDB[];
}

const AddCrossSectionSetPage: NextPage<Props> = ({ organizations }) => {
  const [errors, setErrors] = useState<ErrorObject[]>([]);
  const [id, setId] = useState("");

  async function onSubmit(newSet: CrossSectionSetInputOwned) {
    const url = `/api/author/scat-css`;
    const body = JSON.stringify(newSet);
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
      // TODO dont list errors under form, but each error should be near input field
      // form uses `set.` prefix in path to field,
      // so it should be prepended to data.errors[*].instancePath
      setErrors(data.errors);
    }
  }

  return (
    <Layout>
      <h1>Add scattering cross section set</h1>
      <AddForm onSubmit={onSubmit} organizations={organizations} />
      {errors.length > 0 && <ErrorList errors={errors} />}
      {id && (
        <div className="status">
          Adding successful, a draft has been created with id is {id}
        </div>
      )}
      <Link href={`/author/scat-css`}>
        <a>Back</a>
      </Link>
    </Layout>
  );
};

export default AddCrossSectionSetPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const me = await mustBeAuthor(context);

  const organizations = await userMemberships(me.email);
  return {
    props: {
      organizations,
    },
  };
};
