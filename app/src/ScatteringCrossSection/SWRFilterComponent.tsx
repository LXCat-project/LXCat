// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  defaultReactionTemplate,
  ReactionTemplate,
  Reversible,
} from "@lxcat/database/item/picker";
import { Button, Group, Stack } from "@mantine/core";
import { IconCopy, IconEye, IconPencil, IconTrash } from "@tabler/icons-react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { Latex } from "../shared/Latex";
import { StateSelectIds, SWRReactionPicker } from "../shared/SWRReactionPicker";

const getLatexForReaction = (
  options: ReactionTemplate,
  latex: { consumes: Array<string>; produces: Array<string> },
) => {
  let lhs = latex.consumes.join("+");
  if (lhs === "") {
    lhs = "*";
  }
  let rhs = latex.produces.join("+");
  if (rhs === "") {
    rhs = "*";
  }

  const arrow = options.reversible === Reversible.Both
    ? "\\rightarrow \\\\ \\leftrightarrow"
    : options.reversible === Reversible.False
    ? "\\rightarrow"
    : "\\leftrightarrow";

  return (
    <Group>
      <Latex>{lhs}</Latex>
      <Latex>{arrow}</Latex>
      <Latex>{rhs}</Latex>
    </Group>
  );
};

export const emptyFilter = () => ({
  id: nanoid(),
  options: defaultReactionTemplate(),
  ids: { consumes: [nanoid()], produces: [nanoid()] },
  latex: { consumes: [""], produces: [""] },
});

export const informationFromTemplates = (
  templates: Array<ReactionTemplate>,
): Array<ReactionInformation> =>
  templates.map((template) => ({
    id: nanoid(),
    options: template,
    ids: {
      consumes: template.consumes.map(() => nanoid()),
      produces: template.produces.map(() => nanoid()),
    },
    latex: {
      consumes: template.consumes.map(() => ""),
      produces: template.produces.map(() => ""),
    },
  }));

export type ReactionInformation = {
  id: string;
  options: ReactionTemplate;
  ids: StateSelectIds;
  latex: { consumes: Array<string>; produces: Array<string> };
};

export type FilterComponentProps = {
  selection: Array<ReactionInformation>;
  onChange: (selection: Array<ReactionInformation>) => void;
  editableReaction: number;
  onEditableReactionChange: (index: number) => void;
};

export const SWRFilterComponent = ({
  selection,
  onChange,
  editableReaction,
  onEditableReactionChange,
}: FilterComponentProps) => {
  const updateSelection = async (
    callback: (
      prevSelection: Array<ReactionInformation>,
    ) => Array<ReactionInformation>,
  ) => {
    onChange(callback(selection));
  };

  return (
    <Stack>
      {selection.map((r, i) => (
        <Group key={r.id} position="center">
          <SWRReactionPicker
            ids={r.ids}
            selection={r.options}
            latex={getLatexForReaction(r.options, r.latex)}
            onTagsChange={(selectedTags) =>
              updateSelection(produce((selection) => {
                selection[i].options.typeTags = selectedTags;
                return selection;
              }))}
            onConsumesChange={(updatedIndex, path, latex) =>
              updateSelection(produce((selection) => {
                selection[i].options.consumes[updatedIndex] = path;
                selection[i].latex.consumes[updatedIndex] = latex;
                return selection;
              }))}
            onConsumesAppend={() =>
              updateSelection(produce((selection) => {
                selection[i].ids.consumes.push(nanoid());
                selection[i].options.consumes.push({});
                selection[i].latex.consumes.push("");
                return selection;
              }))}
            onConsumesRemove={(indexToRemove) =>
              updateSelection(produce((selection) => {
                selection[i].ids.consumes.splice(indexToRemove, 1);
                selection[i].options.consumes.splice(indexToRemove, 1);
                selection[i].latex.consumes.splice(indexToRemove, 1);
                return selection;
              }))}
            onProducesChange={(updatedIndex, path, latex) =>
              updateSelection(produce((selection) => {
                selection[i].options.produces[updatedIndex] = path;
                selection[i].latex.produces[updatedIndex] = latex;
                return selection;
              }))}
            onProducesAppend={() =>
              updateSelection(produce((selection) => {
                selection[i].ids.produces.push(nanoid());
                selection[i].options.produces.push({});
                selection[i].latex.produces.push("");
                return selection;
              }))}
            onProducesRemove={(indexToRemove) =>
              updateSelection(produce((selection) => {
                selection[i].ids.produces.splice(indexToRemove, 1);
                selection[i].options.produces.splice(indexToRemove, 1);
                selection[i].latex.produces.splice(indexToRemove, 1);
                return selection;
              }))}
            onReversibleChange={(selectedReversible) =>
              updateSelection(produce((selection) => {
                selection[i].options.reversible = selectedReversible;
                return selection;
              }))}
            onCSSetsChange={(selectedSets) =>
              updateSelection(produce((selection) => {
                selection[i].options.set = [...selectedSets];
                return selection;
              }))}
            editable={i == editableReaction}
          />
          {i == editableReaction
            ? (
              <>
                <Button.Group>
                  <Button
                    color="red"
                    title="Remove reaction"
                    onClick={() =>
                      updateSelection((prevSelection) =>
                        prevSelection.filter((_, j) => i !== j)
                      )}
                  >
                    <IconTrash size={16} />
                  </Button>
                  <Button
                    variant="light"
                    title="Clone reaction"
                    onClick={() =>
                      updateSelection(produce((selection) => {
                        selection.push({ ...selection[i], id: nanoid() });
                        return selection;
                      }))}
                  >
                    <IconCopy size={16} />
                  </Button>
                  <Button
                    variant="filled"
                    title="Toggle view mode"
                    onClick={() => onEditableReactionChange(-1)}
                  >
                    <IconEye size={16} />
                  </Button>
                </Button.Group>
              </>
            )
            : (
              <Button
                variant="subtle"
                title="Edit"
                onClick={() => onEditableReactionChange(i)}
              >
                <IconPencil size={16} />
              </Button>
            )}
        </Group>
      ))}
    </Stack>
  );
  {
    /*<div>
            Examples:{" "}
            <Button
              variant="subtle"
              onClick={() => {
                // TODO get reaction for Ar from db
                onSelectionChange([]);
              }}
            >
              Argon
            </Button>
          </div>*/
  }
};
