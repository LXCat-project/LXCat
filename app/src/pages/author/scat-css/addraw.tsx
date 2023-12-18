// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ErrorObject } from "ajv";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { MouseEvent, useState } from "react";
import { mustBeAuthor } from "../../../auth/middleware";
import { Layout } from "../../../shared/layout";

interface Props {}

const AddRawCrossSectionSetPage: NextPage<Props> = () => {
  const [doc, setDoc] = useState("");
  const [errors, setErrors] = useState<ErrorObject[]>([]);
  const [id, setId] = useState("");
  const uploadCS = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setErrors([]);
    setId("");
    const url = `/api/author/scat-css`;
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    const init = { method: "POST", body: doc, headers };
    const res = await fetch(url, init);
    const data = await res.json();
    if (res.ok) {
      setId(data.id);
    } else {
      if (data.issues) {
        setErrors(data.issues);
      }
    }
  };

  return (
    <Layout>
      <h1>Add scattering cross section set</h1>
      The JSON schema can be found{" "}
      <a href="/api/scat-css/CrossSectionSetRaw.schema.json" target="_blank">
        here
      </a>
      <form>
        <textarea
          value={doc}
          onChange={(event) => setDoc(event.target.value)}
          placeholder="Paste JSON document formatted with CrossSectionSet JSON schema"
          rows={60}
          cols={160}
        />
        <div>
          <button type="submit" onClick={uploadCS}>
            Upload cross section set
          </button>
        </div>
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
        {id && <span>Upload successful, id is {id}</span>}
      </form>
      <Link href={`/author/scat-css`}>Back</Link>
    </Layout>
  );
};

export default AddRawCrossSectionSetPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  await mustBeAuthor(context);
  return { props: {} };
};
