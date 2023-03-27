// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Dialog } from "../shared/Dialog";
import { deleteSet } from "./client";

interface Props {
  isOpened: boolean;
  selectedSetId: string;
  onClose: (error?: string) => void;
}

export const DeleteDialog = ({ isOpened, selectedSetId, onClose }: Props) => {
  async function onSubmit(pressedButton: string) {
    const confirmed = pressedButton === "default";

    if (confirmed) {
      const result = await deleteSet(selectedSetId);
      if (typeof result === "string") {
        onClose(result);
        return;
      }
    }

    onClose();
  }
  return (
    <Dialog isOpened={isOpened} onSubmit={onSubmit}>
      <form method="dialog">
        <div>The draft will be deleted. You will be unable to recover.</div>
        <button value="cancel">Cancel</button>
        <button value="default" type="submit">
          Delete
        </button>
      </form>
    </Dialog>
  );
};
