import { Reference } from "@lxcat/schema";
import { ActionIcon, Stack } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { Reference as ReferenceComponent } from "../../../../../shared/Reference";
// import { Latex } from "../../../../../shared/Latex";

export const ReferenceTable = (
  { references, onChange }: {
    references: Array<Reference>;
    onChange: (refs: Array<Reference>) => void;
  },
) => {
  return (
    <Stack>
      <DataTable
        striped
        columns={[{
          accessor: "reference",
          render: (record) => <ReferenceComponent {...record} />,
        }, {
          accessor: "actions",
          title: "",
          textAlign: "right",
          render: (_, index) => (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() =>
                onChange(
                  references.filter((_, curIndex) => index !== curIndex),
                )}
            >
              <IconTrash />
            </ActionIcon>
          ),
        }]}
        records={references}
      />
    </Stack>
  );
};
