// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DataTable } from "mantine-datatable";
import classes from "./inspect.module.css";
import { Reference } from "./reference";
import { FormattedReference } from "./types";

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
