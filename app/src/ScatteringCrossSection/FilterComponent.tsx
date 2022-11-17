// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  defaultReactionOptions,
  Facets,
  ReactionChoices,
  ReactionOptions,
  Reversible,
  SearchOptions,
  StateProcess,
} from "@lxcat/database/dist/cs/queries/public";
import { Box, Button } from "@mantine/core";
import { IconCopy, IconEye, IconPencil } from "@tabler/icons";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import {
  fetchCSSets,
  fetchReversible,
  fetchStateTreeForSelection,
  fetchTypeTags,
  StatefulReactionPicker,
  StateSelectIds,
} from "../shared/StatefulReactionPicker";

// TODO: Memoize this call.
async function defaultReactionChoices() {
  const [consumes, produces, typeTags, reversible, set] = await Promise.all([
    fetchStateTreeForSelection(
      StateProcess.Consumed,
      [],
      [],
      [],
      Reversible.Both,
      new Set()
    ),
    fetchStateTreeForSelection(
      StateProcess.Produced,
      [],
      [],
      [],
      Reversible.Both,
      new Set()
    ),
    fetchTypeTags([], [], Reversible.Both, new Set()),
    fetchReversible([], [], [], new Set()),
    fetchCSSets([], [], [], Reversible.Both),
  ]);
  return {
    consumes: [consumes],
    produces: [produces],
    typeTags,
    reversible,
    set,
  } as ReactionChoices;
}

export const FilterComponent = ({
  facets,
  selection,
  onChange,
}: {
  facets: Facets;
  selection: SearchOptions;
  onChange: (selection: SearchOptions, event?: string) => void;
}) => {
  const [reactions, setReactions] = useState<
    Array<{
      id: string;
      choices: ReactionChoices;
      options: ReactionOptions;
      ids: StateSelectIds;
    }>
  >(
    facets.reactions.map((choices, index) => ({
      id: nanoid(),
      choices,
      options: selection.reactions[index],
      ids: {
        consumes: choices.consumes.map(() => nanoid()),
        produces: choices.produces.map(() => nanoid()),
      },
    }))
  );

  useEffect(() => {
    onReactionsChange(reactions.map((reaction) => reaction.options));
  }, [reactions]);

  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );

  async function onReset() {
    const choices = await defaultReactionChoices();
    setReactions((_) => [
      {
        id: nanoid(),
        choices,
        options: defaultReactionOptions(),
        ids: { consumes: [nanoid()], produces: [nanoid()] },
      },
    ]);
    onChange(
      {
        reactions: [defaultReactionOptions()],
      },
      "reactions"
    );
  }

  function onReactionsChange(newReactions: SearchOptions["reactions"]) {
    onChange(
      {
        ...selection,
        reactions: newReactions,
      },
      "reactions"
    );
  }
  const [editableReaction, setEditableReaction] = useState(
    reactions.length - 1
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
                <StatefulReactionPicker
                  ids={r.ids}
                  choices={r.choices}
                  selection={r.options}
                  onTagsChange={(selectedTags) =>
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              options: {
                                ...reaction.options,
                                type_tags: selectedTags,
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onConsumesChange={(selectedConsumed) =>
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              options: {
                                ...reaction.options,
                                consumes: selectedConsumed,
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onConsumesAppend={(newChoices) =>
                    setReactions((prevReactions) => {
                      const test = prevReactions.map((reaction, index) =>
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
                              choices: {
                                ...reaction.choices,
                                consumes: [
                                  ...reaction.choices.consumes,
                                  newChoices,
                                ],
                              },
                            }
                          : reaction
                      );
                      return test;
                    })
                  }
                  onConsumesRemove={(indexToRemove) =>
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              ids: {
                                ...reaction.ids,
                                consumes: reaction.ids.consumes.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                              options: {
                                ...reaction.options,
                                consumes: reaction.options.consumes.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                              choices: {
                                ...reaction.choices,
                                consumes: reaction.choices.consumes.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onProducesChange={(selectedProduced) =>
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              options: {
                                ...reaction.options,
                                produces: selectedProduced,
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onProducesAppend={(newChoices) =>
                    setReactions((prevReactions) =>
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
                              choices: {
                                ...reaction.choices,
                                produces: [
                                  ...reaction.choices.produces,
                                  newChoices,
                                ],
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onProducesRemove={(indexToRemove) =>
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              ids: {
                                ...reaction.ids,
                                produces: reaction.ids.produces.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                              options: {
                                ...reaction.options,
                                produces: reaction.options.produces.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                              choices: {
                                ...reaction.choices,
                                produces: reaction.choices.produces.filter(
                                  (_, j) => indexToRemove !== j
                                ),
                              },
                            }
                          : reaction
                      )
                    )
                  }
                  onReversibleChange={(selectedReversible) =>
                    setReactions((prevReactions) =>
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
                    )
                  }
                  onCSSetsChange={(selectedCSSets) =>
                    setReactions((prevReactions) =>
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
                    )
                  }
                  onChange={function (newChoices) {
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              choices: newChoices,
                            }
                          : reaction
                      )
                    );
                  }}
                  editable={i == editableReaction}
                />
                {i == editableReaction ? (
                  <>
                    <Button.Group>
                      <Button
                        variant="subtle"
                        title="Remove reaction"
                        onClick={() =>
                          setReactions((prevReactions) =>
                            prevReactions.filter((_, j) => i !== j)
                          )
                        }
                      >
                        -
                      </Button>
                      <Button
                        variant="subtle"
                        title="Clone reaction"
                        onClick={() =>
                          setReactions((prevReactions) => [
                            ...prevReactions,
                            { ...structuredClone(r), id: nanoid() },
                          ])
                        }
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
                ) : (
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
                const choices = await defaultReactionChoices();
                setReactions((prevReactions) => [
                  ...prevReactions,
                  {
                    id: nanoid(),
                    choices,
                    options: defaultReactionOptions(),
                    ids: { consumes: [nanoid()], produces: [nanoid()] },
                  },
                ]);
                setEditableReaction(reactions.length);
              }}
            >
              +
            </Button>
          </Box>
          <div>
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
          </div>
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
