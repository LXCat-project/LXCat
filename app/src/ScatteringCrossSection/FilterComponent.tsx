import {
  Facets,
  ReactionChoices,
  ReactionOptions,
  Reversible,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { Box, Button } from "@mantine/core";
import { IconCopy, IconEye, IconPencil } from "@tabler/icons";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  StatefulReactionPicker,
  StateSelectIds,
} from "../shared/StatefulReactionPicker";

interface FilterForm {
  reactions: Array<{
    choices?: ReactionChoices;
    options: ReactionOptions;
    ids: StateSelectIds;
  }>;
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
  const { control } = useForm<FilterForm>({
    defaultValues: {
      reactions: facets.reactions.map((choices, index) => ({
        choices,
        options: selection.reactions[index],
      })),
    },
  });
  const {
    fields: reactions,
    remove,
    append,
    update,
  } = useFieldArray({ name: "reactions", control });

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
                    update(i, {
                      choices: r.choices,
                      options: { ...r.options, type_tags: selectedTags },
                      ids: r.ids,
                    })
                  }
                  onConsumesChange={(selectedConsumed) =>
                    update(i, {
                      choices: r.choices,
                      options: { ...r.options, consumes: selectedConsumed },
                      ids: r.ids,
                    })
                  }
                  onProducesChange={(selectedProduced) =>
                    update(i, {
                      choices: r.choices,
                      options: { ...r.options, produces: selectedProduced },
                      ids: r.ids,
                    })
                  }
                  onReversibleChange={(selectedReversible) =>
                    update(i, {
                      choices: r.choices,
                      options: { ...r.options, reversible: selectedReversible },
                      ids: r.ids,
                    })
                  }
                  onCSSetsChange={(selectedCSSets) =>
                    update(i, {
                      choices: r.choices,
                      options: { ...r.options, set: [...selectedCSSets] },
                      ids: r.ids,
                    })
                  }
                  onChange={function (newChoices, newIds) {
                    update(i, {
                      choices: newChoices,
                      options: r.options,
                      ids: newIds,
                    });
                  }}
                  editable={i == editableReaction}
                />
                {i == editableReaction ? (
                  <>
                    <Button.Group>
                      <Button
                        variant="subtle"
                        title="Remove reaction"
                        onClick={() => remove(i)}
                      >
                        -
                      </Button>
                      <Button
                        variant="subtle"
                        title="Clone reaction"
                        onClick={() => append(structuredClone(r))}
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
              onClick={() => {
                append({
                  options: {
                    consumes: [],
                    produces: [],
                    reversible: Reversible.Both,
                    type_tags: [],
                    set: [],
                  },
                  ids: { consumes: [], produces: [] },
                });
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
