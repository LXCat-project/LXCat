// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Element } from "@lxcat/schema/species";
import { Center, Fieldset, Stack } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PeriodicSearchResult } from "../../../../packages/database/dist/elements/queries";
import { PeriodicTable } from "./periodic-table";

export const PageClient = (
  { activeElements }: { activeElements: Set<Element> },
) => {
  const [headers, setHeaders] = useState<Array<PeriodicSearchResult>>([]);

  const router = useRouter();

  return (
    <Center>
      <Stack style={{ marginTop: 10 }}>
        <Fieldset legend="Select elements to search for datasets">
          <PeriodicTable
            activeElements={activeElements}
            onChange={setHeaders}
          />
        </Fieldset>
        <Fieldset legend="Search results">
          <DataTable
            idAccessor="_key"
            minHeight={150}
            maxHeight={280}
            highlightOnHover
            withTableBorder
            borderRadius="sm"
            onRowClick={({ record }) => router.push(`/set/${record._key}`)}
            columns={[
              { accessor: "organization", title: "Contributor" },
              { accessor: "name" },
              {
                accessor: "complete",
                render: ({ complete }) => complete ? <IconCheck /> : <IconX />,
              },
              {
                accessor: "versionInfo",
                title: "Version",
                render: (record) => record.versionInfo.version,
              },
            ]}
            records={headers}
          />
        </Fieldset>
      </Stack>
    </Center>
  );
};
