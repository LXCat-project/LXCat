// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defaultSearchTemplate } from "@lxcat/database/dist/cs/picker/default";
import { ReactionTemplate } from "@lxcat/database/dist/cs/picker/types";
import { Button, Modal } from "@mantine/core";
import { useState } from "react";
import { Picker, Picked } from "./Picker";

export const PickerModal = ({
  onSubmit,
}: {
  onSubmit: (picked: Picked) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [filterSelection, setFilterSelection] = useState<
    Array<ReactionTemplate>
  >(defaultSearchTemplate());
  const [items, setItems] = useState<Picked>([]);

  const getAuthorCS = async (
    selection: Array<ReactionTemplate>
  ): Promise<Picked> => {
    const query = new URLSearchParams({
      reactions: JSON.stringify(selection),
    });
    const url = `/api/author/scat-cs?${query}`;
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    const response = await fetch(url, { headers });

    if (response.ok) {
      return response.json();
    } else {
      return [];
    }
  };

  const toggleModal = async (open: boolean) => {
    if (open) {
      setItems(await getAuthorCS(filterSelection));
    }

    setOpen(open);
  };

  const onChangeFilterSelection = async (
    newSelection: Array<ReactionTemplate>
  ) => {
    if (!open) {
      return;
    }
    setFilterSelection(newSelection);
    setItems(await getAuthorCS(newSelection));
  };

  const onLocalSubmit = (picked: Picked) => {
    setOpen(false);
    onSubmit(picked);
  };

  // TODO implement api route that returns filter facets (aka choices) for cross
  // sections that are public and drafts of author
  return (
    <>
      <Button type="button" variant="light" onClick={() => toggleModal(true)}>
        Pick from database
      </Button>
      <Modal
        opened={open}
        onClose={() => toggleModal(false)}
        title="Pick cross section(s) from database"
        size="90%"
      >
        <Picker
          filterSelection={filterSelection}
          setFilterSelection={onChangeFilterSelection}
          choices={items}
          onSubmit={onLocalSubmit}
        />
      </Modal>
    </>
  );
};
