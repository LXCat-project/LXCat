import {
  Facets,
  ReactionChoices,
  ReactionOptions,
  Reversible,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { Box, Button } from "@mantine/core";
import { IconCopy, IconEye, IconPencil } from "@tabler/icons";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import {
  fetchCSSets,
  fetchReversible,
  fetchTypeTags,
  StatefulReactionPicker,
  StateSelectIds,
} from "../shared/StatefulReactionPicker";

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

  function onReset() {
    onChange({
      // TODO dedup packages/database/src/cs/queries/public.ts:defaultSearchOptions()
      reactions: [
        {
          consumes: [],
          produces: [],
          type_tags: [],
          reversible: Reversible.Both,
          set: [],
        },
      ],
    });
  }

  function onReactionsChange(newReactions: SearchOptions["reactions"]) {
    console.log(JSON.stringify(newReactions, undefined, 2));
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
                  onChange={function (newChoices, newIds) {
                    setReactions((prevReactions) =>
                      prevReactions.map((reaction, index) =>
                        index === i
                          ? {
                              ...reaction,
                              choices: newChoices,
                              ids: newIds,
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
                // TODO: initialize choices if undefined.
                const choices = {
                  consumes: [],
                  produces: [],
                  typeTags: await fetchTypeTags(
                    [],
                    [],
                    Reversible.Both,
                    new Set()
                  ),
                  reversible: await fetchReversible([], [], [], new Set()),
                  set: await fetchCSSets([], [], [], Reversible.Both),
                };
                setReactions((prevReactions) => [
                  ...prevReactions,
                  {
                    id: nanoid(),
                    choices,
                    options: {
                      consumes: [],
                      produces: [],
                      reversible: Reversible.Both,
                      type_tags: [],
                      set: [],
                    },
                    ids: { consumes: [], produces: [] },
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
