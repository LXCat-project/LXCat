// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mustBeAuthor } from "@/auth/middleware";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { MouseEvent, useState } from "react";
import { ZodError } from "zod";
import { Layout } from "../../../shared/layout";

interface Props {}

const AddRawCrossSectionSetPage: NextPage<Props> = () => {
  const [doc, setDoc] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
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
    let resp_str = await res.text();
    try {
      const data = JSON.parse(resp_str);
      if (res.ok) {
        setId(data.id);
      } else {
        if (data.issues) {
          // Assume error is ZodError
          // TODO: better zod issue formatting.
          setErrors(
            (data as ZodError).issues.map((issue) =>
              JSON.stringify(issue, undefined, 2)
            ),
          );
        } else {
          setErrors([JSON.stringify(data, undefined, 2)]);
        }
      }
    } catch {
      if (res.ok) {
        setId("No ID received.");
      } else {
        setErrors([resp_str]);
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
                  {e}
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
