// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DataTable } from "mantine-datatable";
import { FormattedReference } from "./formatted-reference";
import { FormattedReferenceLink as Reference } from "./formatted-reference-link";
import classes from "./reference-list.module.css";

export const ReferenceList = ({
  references,
}: {
  references: Array<FormattedReference>;
}) => (
  <DataTable
    withTableBorder
    withRowBorders
    borderRadius="md"
    columns={[{
      title: "Reference",
      accessor: "ref",
      render: (record) => <Reference>{record}</Reference>,
    }]}
    records={references}
    className={classes.scrollableTable}
  />
);
