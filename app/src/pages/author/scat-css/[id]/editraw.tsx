import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../../../shared/Layout";
import type { ErrorObject } from "ajv";
import { useState, MouseEvent } from "react";
import { mustBeAuthor } from "../../../../auth/middleware";
import {
  byOwnerAndId,
  CrossSectionSetInputOwned,
  getVersionInfo,
} from "@lxcat/database/dist/css/queries";

interface Props {
  section: CrossSectionSetInputOwned;
  sectionKey: string;
  commitMessage: string;
}

const EditRawCrossSectionSetPage: NextPage<Props> = ({
  section,
  sectionKey,
  commitMessage,
}) => {
  const [doc, setDoc] = useState(JSON.stringify(section, undefined, 4));
  const [message, setMessage] = useState(commitMessage);
  const [errors, setErrors] = useState<ErrorObject[]>([]);
  const [id, setId] = useState("");
  const uploadCS = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setErrors([]);
    setId("");
    const url = `/api/scat-css/${sectionKey}`;
    const body = JSON.stringify({
      doc: JSON.parse(doc),
      message,
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
  };

  return (
    <Layout>
      <h1>Edit scattering cross section set</h1>
      The JSON schema can be found{" "}
      <a href="/api/scat-css/schema.json" target="_blank">
        here
      </a>
      <form>
        <textarea
          value={doc}
          onChange={(event) => setDoc(event.target.value)}
          placeholder="Paste JSON document formatted with CrossSectionSet JSON schema"
          rows={60}
          style={{ width: "80%" }}
        />
        <div>
          <label>
            <input
              style={{ width: "80%" }}
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Optionally describe which changes have been made."
            />
          </label>
        </div>
        <div>
          <button type="submit" onClick={uploadCS}>
            Update cross section set
          </button>
        </div>
        {errors.length > 0 && (
          <div>
            <span>Error(s) during upload</span>
            <ul>
              {errors.map((e, i) => (
                <li key={i}>
                  {e.message}, {JSON.stringify(e.params, undefined, 2)}{" "}
                  {e.dataPath && `@ ${e.dataPath}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        {id && id === section._key && (
          <span>
            Update successful, a draft has been created with id is {id}
          </span>
        )}
        {id && id !== section._key && (
          <span>Update successful, the draft been updated.</span>
        )}
      </form>
    </Layout>
  );
};

export default EditRawCrossSectionSetPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const me = await mustBeAuthor(context);
  const id = context.params?.id!;
  const section = await byOwnerAndId(me.email, id);
  const info = await getVersionInfo(id);
  const commitMessage =
    info !== undefined && info.commitMessage ? info.commitMessage : "";
  if (section === undefined) {
    return {
      // TODO should return notFound when id does not exist
      //, but should return forbidden response when not owned by user?
      // need to update query to distinguish bewteen the 2
      notFound: true,
    };
  }
  return {
    props: {
      section,
      sectionKey: id,
      commitMessage,
    },
  };
};
