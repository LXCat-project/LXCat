// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyedOrganization } from "@lxcat/database/auth";
import { NewLTPDocument } from "@lxcat/schema";
import { useMemo } from "react";
import { EditForm } from "./edit-form";

interface Props {
  // onSubmit: (newSet: CrossSectionSetInputOwned, newMessage: string) => void;
  onSubmit: (newSet: any, newMessage: string) => void;
  organizations: KeyedOrganization[];
}

export const AddForm = ({ onSubmit, organizations }: Props) => {
  const newSet: NewLTPDocument = useMemo(() => {
    return {
      $schema: "",
      url: "",
      termsOfUse: "",
      name: "",
      description: "",
      complete: false,
      contributor: organizations.length > 0 ? organizations[0].name : "",
      processes: [],
      states: {},
      references: {},
    };
  }, [organizations]);
  return (
    <EditForm
      set={newSet}
      commitMessage=""
      onSubmit={onSubmit}
      organizations={organizations}
    />
  );
};
