import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../../../shared/Layout";
import type { ErrorObject } from "ajv";
import { useState, MouseEvent } from "react";
import { mustBeAuthor } from "../../../../auth/middleware";
import {
  CrossSectionSetInputOwned,
  byOwnerAndId,
  getVersionInfo,
} from "@lxcat/database/dist/css/queries/author_read";
import Link from "next/link";
import { EditForm } from "../../../../ScatteringCrossSectionSet/EditForm";
import {
  listOrganizations,
  OrganizationFromDB,
  userMemberships,
} from "@lxcat/database/dist/auth/queries";

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
    newMessage: string
  ) {
    const url = `/api/scat-css/${setKey}`;
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
      {errors.length > 0 && (
        <div>
          <span>Error(s) during upload</span>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                {e.message}, {JSON.stringify(e.params, undefined, 2)}{" "}
                {e.instancePath && `@ ${e.instancePath}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {id && id === set._key && (
        <span>Update successful, a draft has been created with id is {id}</span>
      )}
      {id && id !== set._key && (
        <span>Update successful, the draft been updated.</span>
      )}
      <Link href={`/author/scat-css`}>
        <a>Back</a>
      </Link>
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
  const commitMessage =
    info !== undefined && info.commitMessage ? info.commitMessage : "";
  if (set === undefined) {
    return {
      // TODO should return notFound when id does not exist
      //, but should return forbidden response when not owned by user?
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
