// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  defaultReactionTemplate,
  defaultSearchTemplate,
} from "@lxcat/database/dist/cs/picker/default";
import {
  ReactionTemplate,
  Reversible,
} from "@lxcat/database/dist/cs/picker/types";
import { Box, Button, Group } from "@mantine/core";
import { IconCopy, IconEye, IconPencil } from "@tabler/icons-react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { useState } from "react";
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

type ReactionInformation = {
  id: string;
  options: ReactionTemplate;
  ids: StateSelectIds;
  latex: { consumes: Array<string>; produces: Array<string> };
};

export const SWRFilterComponent = ({
  selection,
  onChange,
}: {
  selection: Array<ReactionTemplate>;
  onChange: (selection: Array<ReactionTemplate>, event?: string) => void;
}) => {
  const [reactions, setReactions] = useState<Array<ReactionInformation>>(
    selection.map((options) => ({
      id: nanoid(),
      options,
      ids: {
        consumes: options.consumes.map(() => nanoid()),
        produces: options.produces.map(() => nanoid()),
      },
      // TODO: Think of a way to obtain state latex on page load.
      latex: {
        consumes: options.consumes.map(() => ""),
        produces: options.produces.map(() => ""),
      },
    })),
  );

  const updateReactions = async (
    callback: (
      prevReactions: Array<ReactionInformation>,
    ) => Array<ReactionInformation>,
  ) => {
    setReactions((prevReactions) => {
      const newReactions = callback(prevReactions);
      onChange(newReactions.map((reaction) => reaction.options));
      return newReactions;
    });
  };

  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0)
      || (typeof s === "object" && Object.keys(s).length > 0),
  );

  async function onReset() {
    updateReactions((_) => [
      {
        id: nanoid(),
        options: defaultReactionTemplate(),
        ids: { consumes: [nanoid()], produces: [nanoid()] },
        latex: { consumes: [""], produces: [""] },
      },
    ]);
    onChange(defaultSearchTemplate());
  }

  const [editableReaction, setEditableReaction] = useState(
    reactions.length - 1,
  );

  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset style={{ flexGrow: 1 }}>
          <legend>Reaction</legend>
          <ul>
            {reactions.map((r, i) => (
              <li
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <SWRReactionPicker
                  ids={r.ids}
                  selection={r.options}
                  latex={getLatexForReaction(r.options, r.latex)}
                  onTagsChange={(selectedTags) =>
                    updateReactions(produce((selection) => {
                      selection[i].options.typeTags = selectedTags;
                      return selection;
                    }))}
                  onConsumesChange={(updatedIndex, path, latex) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].options.consumes[updatedIndex] = path;
                      reactions[i].latex.consumes[updatedIndex] = latex;
                      return reactions;
                    }))}
                  onConsumesAppend={() =>
                    updateReactions(produce((reactions) => {
                      reactions[i].ids.consumes.push(nanoid());
                      reactions[i].options.consumes.push({});
                      reactions[i].latex.consumes.push("");
                      return reactions;
                    }))}
                  onConsumesRemove={(indexToRemove) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].ids.consumes.splice(indexToRemove, 1);
                      reactions[i].options.consumes.splice(indexToRemove, 1);
                      reactions[i].latex.consumes.splice(indexToRemove, 1);
                      return reactions;
                    }))}
                  onProducesChange={(updatedIndex, path, latex) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].options.produces[updatedIndex] = path;
                      reactions[i].latex.produces[updatedIndex] = latex;
                      return reactions;
                    }))}
                  onProducesAppend={() =>
                    updateReactions(produce((reactions) => {
                      reactions[i].ids.produces.push(nanoid());
                      reactions[i].options.produces.push({});
                      reactions[i].latex.produces.push("");
                      return reactions;
                    }))}
                  onProducesRemove={(indexToRemove) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].ids.produces.splice(indexToRemove, 1);
                      reactions[i].options.produces.splice(indexToRemove, 1);
                      reactions[i].latex.produces.splice(indexToRemove, 1);
                      return reactions;
                    }))}
                  onReversibleChange={(selectedReversible) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].options.reversible = selectedReversible;
                      return reactions;
                    }))}
                  onCSSetsChange={(selectedSets) =>
                    updateReactions(produce((reactions) => {
                      reactions[i].options.set = [...selectedSets];
                      return reactions;
                    }))}
                  editable={i == editableReaction}
                />
                {i == editableReaction
                  ? (
                    <>
                      <Button.Group>
                        <Button
                          variant="subtle"
                          title="Remove reaction"
                          onClick={() =>
                            updateReactions((prevReactions) =>
                              prevReactions.filter((_, j) => i !== j)
                            )}
                        >
                          -
                        </Button>
                        <Button
                          variant="subtle"
                          title="Clone reaction"
                          onClick={() =>
                            updateReactions(produce((reactions) => {
                              reactions.push({ ...reactions[i], id: nanoid() });
                              return reactions;
                            }))}
                        >
                          <IconCopy size={16} />
                        </Button>
                        <Button
                          variant="subtle"
                          title="Toggle view mode"
                          onClick={() => setEditableReaction(-1)}
                        >
                          <IconEye size={16} />
                        </Button>
                      </Button.Group>
                    </>
                  )
                  : (
                    <>
                      <Button
                        variant="subtle"
                        title="Edit"
                        onClick={() => setEditableReaction(i)}
                      >
                        <IconPencil size={16} />
                      </Button>
                    </>
                  )}
              </li>
            ))}
          </ul>
          <Box sx={{ display: "flex", justifyContent: "end" }}>
            <Button
              title="Add reaction filter"
              onClick={async () => {
                updateReactions(produce((reactions) => {
                  reactions.push({
                    id: nanoid(),
                    options: defaultReactionTemplate(),
                    ids: { consumes: [nanoid()], produces: [nanoid()] },
                    latex: { consumes: [""], produces: [""] },
                  });
                  return reactions;
                }));
                setEditableReaction(reactions.length);
              }}
            >
              +
            </Button>
          </Box>
          {
            /*<div>
            Examples:{" "}
            <Button
              variant="subtle"
              onClick={() => {
                // TODO get reaction for Ar from db
                onReactionsChange([]);
              }}
            >
              Argon
            </Button>
          </div>*/
          }
        </fieldset>
      </div>
      <div>
        <Button variant="outline" disabled={!hasAnySelection} onClick={onReset}>
          Clear selection
        </Button>
      </div>
    </div>
  );
};
