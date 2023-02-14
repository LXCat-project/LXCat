// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyedVersionInfo } from "@lxcat/database/dist/css/queries/public";
import Link from "next/link";
import styles from "./HistoryTable.module.css";

interface Props {
  versions: KeyedVersionInfo[];
}

export const HistoryTable = ({ versions }: Props) => (
  <table className={styles.htable}>
    <thead>
      <tr>
        <th>Version</th>
        <th>Status</th>
        <th>Created on</th>
        <th>Commit message</th>
      </tr>
    </thead>
    <tbody>
      {versions.map((h) => (
        <tr key={h.version}>
          <td>
            <Link href={`/scat-css/${h._key}`}>{h.version}</Link>
          </td>
          <td>
            <Link href={`/scat-css/${h._key}`}>{h.status}</Link>
          </td>
          <td title={h.createdOn}>
            <Link href={`/scat-css/${h._key}`}>
              {new Date(h.createdOn).toDateString()}
            </Link>
          </td>
          <td>
            <Link href={`/scat-css/${h._key}`}>{h.commitMessage}</Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
// TODO add 2 radio columns to select 2 versions to compare them as JSON documents
// Similar to https://www.uniprot.org/uniprot/P35367?version=*
