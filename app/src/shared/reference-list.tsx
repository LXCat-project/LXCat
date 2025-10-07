// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "@/app/data/inspect/reference";
import { FormattedReference } from "@/app/data/inspect/types";
import { DataTable } from "mantine-datatable";
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
