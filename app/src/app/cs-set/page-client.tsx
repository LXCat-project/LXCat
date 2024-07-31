"use client";

import { Element } from "@lxcat/schema/species";
import { Center, Fieldset, Group, Stack } from "@mantine/core";
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
      <Stack style={{ marginTop: 50 }}>
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
            highlightOnHover
            withTableBorder
            borderRadius="sm"
            onRowClick={({ record }) => router.push(`/scat-css/${record._key}`)}
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
