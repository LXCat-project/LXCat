// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTemplate } from "@lxcat/database/item/picker";
import { Button, Modal } from "@mantine/core";
import { useState } from "react";
import { Picked, Picker } from "./Picker";
import { emptyFilter, ReactionInformation } from "./SWRFilterComponent";

export const PickerModal = ({
  onSubmit,
}: {
  onSubmit: (picked: Picked) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [filterSelection, setFilterSelection] = useState<
    Array<ReactionInformation>
  >([emptyFilter()]);
  const [items, setItems] = useState<Picked>([]);

  const getAuthorCS = async (
    selection: Array<ReactionTemplate>,
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
      setItems(
        await getAuthorCS(filterSelection.map(({ options }) => options)),
      );
    }

    setOpen(open);
  };

  const onChangeFilterSelection = async (
    newSelection: Array<ReactionInformation>,
  ) => {
    if (!open) {
      return;
    }
    setFilterSelection(newSelection);
    setItems(await getAuthorCS(newSelection.map(({ options }) => options)));
  };

  const onLocalSubmit = (picked: Picked) => {
    setOpen(false);
    onSubmit(picked);
  };

  // TODO: implement api route that returns filter options for cross sections
  // that are public or drafts of the current organization.
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
