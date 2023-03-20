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
import { IconCopy, IconEye, IconPencil } from "@tabler/icons";
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
      onReactionsChange(newReactions.map((reaction) => reaction.options));
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
    onChange(defaultSearchTemplate(), "reactions");
  }

  function onReactionsChange(newReactions: Array<ReactionTemplate>) {
    onChange(newReactions, "reactions");
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
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            options: {
                              ...reaction.options,
                              typeTags: selectedTags,
                            },
                          }
                          : reaction
                      )
                    )}
                  onConsumesChange={(updatedIndex, path, latex) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            options: {
                              ...reaction.options,
                              consumes: reaction.options.consumes.map(
                                (value, currentIndex) =>
                                  currentIndex === updatedIndex ? path : value,
                              ),
                            },
                            latex: {
                              ...reaction.latex,
                              consumes: reaction.latex.consumes.map(
                                (value, currentIndex) =>
                                  currentIndex === updatedIndex
                                    ? latex
                                    : value,
                              ),
                            },
                          }
                          : reaction
                      )
                    )}
                  onConsumesAppend={() =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            ids: {
                              ...reaction.ids,
                              consumes: [...reaction.ids.consumes, nanoid()],
                            },
                            options: {
                              ...reaction.options,
                              consumes: [...reaction.options.consumes, {}],
                            },
                            latex: {
                              ...reaction.latex,
                              consumes: [...reaction.latex.consumes, ""],
                            },
                          }
                          : reaction
                      )
                    )}
                  onConsumesRemove={(indexToRemove) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            ids: {
                              ...reaction.ids,
                              consumes: reaction.ids.consumes.filter(
                                (_, j) => indexToRemove !== j,
                              ),
                            },
                            options: {
                              ...reaction.options,
                              consumes: reaction.options.consumes.filter(
                                (_, j) => indexToRemove !== j,
                              ),
                            },
                          }
                          : reaction
                      )
                    )}
                  onProducesChange={(updatedIndex, path, latex) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            options: {
                              ...reaction.options,
                              produces: reaction.options.produces.map(
                                (value, currentIndex) =>
                                  currentIndex === updatedIndex ? path : value,
                              ),
                            },
                            latex: {
                              ...reaction.latex,
                              produces: reaction.latex.produces.map(
                                (value, currentIndex) =>
                                  currentIndex === updatedIndex
                                    ? latex
                                    : value,
                              ),
                            },
                          }
                          : reaction
                      )
                    )}
                  onProducesAppend={() =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            ids: {
                              ...reaction.ids,
                              produces: [...reaction.ids.produces, nanoid()],
                            },
                            options: {
                              ...reaction.options,
                              produces: [...reaction.options.produces, {}],
                            },
                            latex: {
                              ...reaction.latex,
                              produces: [...reaction.latex.produces, ""],
                            },
                          }
                          : reaction
                      )
                    )}
                  onProducesRemove={(indexToRemove) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            ids: {
                              ...reaction.ids,
                              produces: reaction.ids.produces.filter(
                                (_, j) => indexToRemove !== j,
                              ),
                            },
                            options: {
                              ...reaction.options,
                              produces: reaction.options.produces.filter(
                                (_, j) => indexToRemove !== j,
                              ),
                            },
                          }
                          : reaction
                      )
                    )}
                  onReversibleChange={(selectedReversible) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            options: {
                              ...reaction.options,
                              reversible: selectedReversible,
                            },
                          }
                          : reaction
                      )
                    )}
                  onCSSetsChange={(selectedCSSets) =>
                    updateReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                            ...reaction,
                            options: {
                              ...reaction.options,
                              set: [...selectedCSSets],
                            },
                          }
                          : reaction
                      )
                    )}
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
                            updateReactions((prevReactions) => [
                              ...prevReactions,
                              { ...structuredClone(r), id: nanoid() },
                            ])}
                        >
                          <IconCopy size={16} />
                        </Button>
                        <Button
                          variant="subtle"
                          title="Toggle view mode"
                          onClick={() => {
                            setEditableReaction(-1);
                          }}
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
                        onClick={() => {
                          setEditableReaction(i);
                        }}
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
                updateReactions((prevReactions) => [
                  ...prevReactions,
                  {
                    id: nanoid(),
                    options: defaultReactionTemplate(),
                    ids: { consumes: [nanoid()], produces: [nanoid()] },
                    latex: { consumes: [""], produces: [""] },
                  },
                ]);
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
