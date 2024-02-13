// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Reference } from "@lxcat/schema";
import { ActionIcon, Button, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useState } from "react";
import Result, { err, ok } from "true-myth/result";
import { getReferenceLabel } from "../../../../../shared/cite";
import { doi2csl } from "../../../../../shared/doi2csl";
import { Reference as ReferenceComponent } from "../../../../../shared/reference";

export const ReferenceTable = (
  { references, onChange }: {
    references: Array<Reference>;
    onChange: (refs: Array<Reference>) => void;
  },
) => {
  const [doiOpened, { open: doiOpen, close: doiClose }] = useDisclosure(false);
  const [doiError, setDoiError] = useState<string>();
  const [doiValue, setDoiValue] = useState<string>("");

  const importFromDoi = async (
    doi: string,
  ): Promise<Result<Reference, string>> => {
    try {
      const csl = await doi2csl(doi);
      return ok(csl);
    } catch (_) {
      return err("Invalid DOI");
    }
  };

  return (
    <>
      <Modal
        opened={doiOpened}
        onClose={() => {
          doiClose();
          setDoiError(undefined);
        }}
        title="Import from DOI"
        centered
        size="auto"
      >
        <Stack align="center">
          <TextInput
            placeholder="e.g. 10.5284/1015681"
            error={doiError}
            value={doiValue}
            onChange={(event) => setDoiValue(event.currentTarget.value)}
          />
          <Button
            onClick={async () => {
              const result = await importFromDoi(doiValue);
              if (result.isOk) {
                const label = getReferenceLabel(result.value);
                if (references.map(getReferenceLabel).includes(label)) {
                  setDoiError(
                    `Cannot import duplicate reference with id ${label}.`,
                  );
                } else {
                  setDoiValue("");
                  onChange([...references, result.value]);
                }
              } else {
                setDoiError(result.error);
              }
            }}
          >
            Import
          </Button>
        </Stack>
      </Modal>
      <Stack align="center">
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
        <Button.Group>
          <Button onClick={doiOpen}>Import from DOI</Button>
          <Button variant="light" disabled>Import from BibTeX</Button>
        </Button.Group>
      </Stack>
    </>
  );
};
