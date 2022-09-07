import Cite from "citation-js";
import { useEffect, useRef, useState } from "react";
import {
  Control,
  useFieldArray,
  useForm,
  UseFormRegister,
  useWatch,
} from "react-hook-form";

import { OrganizationFromDB } from "@lxcat/database/dist/auth/queries";
import { CrossSectionSetInputOwned } from "@lxcat/database/dist/css/queries/author_read";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";
import { Dict, Pair } from "@lxcat/schema/dist/core/util";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { Dialog } from "../shared/Dialog";

import { Reference } from "../shared/Reference";
import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { InState } from "@lxcat/schema/dist/core/state";
import { parse_state } from "@lxcat/schema/dist/core/parse";

interface Props {
  set: CrossSectionSetRaw; // TODO should be CrossSectionSetInputOwned, but gives type error
  setKey: string;
  commitMessage: string;
  onSubmit: (newSet: CrossSectionSetInputOwned, newMessage: string) => void;
  organizations: OrganizationFromDB[];
}

interface FieldValues {
  set: CrossSectionSetInputOwned;
  commitMessage: string;
}

const ReactionEntryForm = ({
  index: entryIndex,
  processIndex,
  side,
  register,
  control,
  onRemove,
}: {
  index: number;
  processIndex: number;
  side: "lhs" | "rhs";
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues, any>;
  onRemove: () => void;
}) => {
  const states = useWatch({
    control,
    name: `set.states`,
  });
  return (
    <div style={{ display: "flex" }}>
      <input
        title="Count"
        type="number"
        style={{ width: "2rem" }}
        {...register(
          `set.processes.${processIndex}.reaction.${side}.${entryIndex}.count`,
          { required: true, min: 1, valueAsNumber: true }
        )}
      />
      <select
        title="State"
        {...register(
          `set.processes.${processIndex}.reaction.${side}.${entryIndex}.state`,
          { required: true }
        )}
      >
        {Object.keys(states).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="button" title="Remove process" onClick={onRemove}>
        &minus;
      </button>
    </div>
  );
};

const ReactionForm = ({
  index: processIndex,
  register,
  control,
}: {
  index: number;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues, any>;
}) => {
  const reversible = useWatch({
    control,
    name: `set.processes.${processIndex}.reaction.reversible`,
  });
  const lhsField = useFieldArray({
    control,
    name: `set.processes.${processIndex}.reaction.lhs`,
  });
  const rhsField = useFieldArray({
    control,
    name: `set.processes.${processIndex}.reaction.rhs`,
  });
  return (
    <div>
      <h4>Reaction</h4>
      <div style={{ display: "flex" }}>
        <div style={{ border: "1px solid #333", padding: 2 }}>
          {lhsField.fields.map((field, index) => {
            const isNotLast = lhsField.fields.length - 1 !== index;
            return (
              <div key={field.id}>
                <ReactionEntryForm
                  side={"lhs"}
                  processIndex={processIndex}
                  index={index}
                  register={register}
                  control={control}
                  onRemove={() => lhsField.remove(index)}
                />
                {isNotLast && <span>+</span>}
              </div>
            );
          })}
          <button
            type="button"
            title="Add consumed reaction entry"
            onClick={() => lhsField.append({ count: 1, state: "" })}
          >
            +
          </button>
        </div>
        <div>{reversible ? "⇋" : "➙"}</div>
        <div style={{ border: "1px solid #333", padding: 2 }}>
          {rhsField.fields.map((field, index) => {
            const isNotLast = rhsField.fields.length - 1 !== index;
            return (
              <div key={field.id}>
                <ReactionEntryForm
                  key={field.id}
                  side={"rhs"}
                  processIndex={processIndex}
                  index={index}
                  register={register}
                  control={control}
                  onRemove={() => rhsField.remove(index)}
                />
                {isNotLast && <span>+</span>}
              </div>
            );
          })}
          <button
            type="button"
            title="Add produced reaction entry"
            onClick={() => rhsField.append({ count: 1, state: "" })}
          >
            +
          </button>
        </div>
      </div>
      <div>
        <label>
          Reversible
          <input
            type="checkbox"
            {...register(`set.processes.${processIndex}.reaction.reversible`)}
          />
        </label>
      </div>
      <div>
        <label>
          Type tags
          {/* TODO change to group of checkboxes */}
          <select
            multiple
            {...register(`set.processes.${processIndex}.reaction.type_tags`)}
          >
            {Object.keys(ReactionTypeTag).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

const CSDataUploadButton = ({
  onSubmit,
}: {
  onSubmit: (newData: Pair<number>[]) => void;
}) => {
  const uploadRef = useRef<HTMLInputElement>(null);

  async function mungeBlob(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    if (event.target.files == null) {
      return;
    }
    const file = event.target.files[0];
    const body = await file.text();
    const newData = JSON.parse(body);
    onSubmit(newData);
  }

  return (
    <button
      type="button"
      className="btn btn-light"
      onClick={() => uploadRef.current?.click()}
    >
      Upload JSON like `[[1,2]]`
      <input
        type="file"
        accept="application/json,.json"
        onChange={mungeBlob}
        ref={uploadRef}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
    </button>
  );
};

const LUTForm = ({
  index,
  register,
  control,
}: {
  index: number;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues, any>;
}) => {
  const dataRows = useFieldArray({
    control,
    name: `set.processes.${index}.data`,
  });
  const tableStyle = { border: "1px solid #333" };
  return (
    <div>
      <h4>Data</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>
              <input
                style={{ width: "6rem" }}
                {...register(`set.processes.${index}.labels.0`, {
                  required: true,
                })}
              />{" "}
              (
              <input
                style={{ width: "3rem" }}
                {...register(`set.processes.${index}.units.0`, {
                  required: true,
                })}
              />
              )
            </th>
            <th>
              <input
                style={{ width: "6rem" }}
                {...register(`set.processes.${index}.labels.1`, {
                  required: true,
                })}
              />{" "}
              (
              <input
                style={{ width: "3rem" }}
                {...register(`set.processes.${index}.units.1`, {
                  required: true,
                })}
              />
              )
            </th>
            <th>
              <button
                title="Add"
                type="button"
                onClick={() => dataRows.append([0, 0])}
              >
                +
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {dataRows.fields.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  style={{ width: "10rem" }}
                  {...register(`set.processes.${index}.data.${i}.0`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                />
              </td>
              <td>
                <input
                  style={{ width: "10rem" }}
                  {...register(`set.processes.${index}.data.${i}.1`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                />
              </td>
              <td>
                <button
                  title="Remove"
                  type="button"
                  onClick={() => dataRows.remove(i)}
                >
                  &minus;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <CSDataUploadButton onSubmit={(newData) => dataRows.replace(newData)} />
      </div>
    </div>
  );
};

const ProcessForm = ({
  index,
  onRemove,
  register,
  control,
}: {
  index: number;
  onRemove: () => void;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues, any>;
}) => {
  const [references, type] = useWatch({
    control,
    name: ["set.references", `set.processes.${index}.type`],
  });

  return (
    <div>
      <div>
        <label>
          References
          <select multiple {...register(`set.processes.${index}.reference`)}>
            {Object.keys(references).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Threshold
          <input
            {...register(`set.processes.${index}.threshold`, {
              required: true,
              valueAsNumber: true,
            })}
          />
        </label>
      </div>
      {type === Storage.LUT && (
        <LUTForm index={index} register={register} control={control} />
      )}
      <ReactionForm index={index} register={register} control={control} />
      <div>
        <h4>Parameters</h4>
        <div>
          <label>
            Mass ratio
            <input
              {...register(`set.processes.${index}.parameters.mass_ratio`, {
                valueAsNumber: true,
              })}
            />
          </label>
        </div>
        <div>
          <label>
            Statistical weight ratio
            <input
              {...register(
                `set.processes.${index}.parameters.statistical_weight_ratio`,
                {
                  valueAsNumber: true,
                }
              )}
            />
          </label>
        </div>
      </div>
      <button type="button" title="Remove" onClick={onRemove}>
        &minus;
      </button>
      <hr />
    </div>
  );
};

const SimpleParticleForm = ({
  label,
  register,
}: {
  label: string;
  register: UseFormRegister<FieldValues>;
}) => {
  return (
    <div>
      <div>
        <label>
          Particle
          <input
            {...register(`set.states.${label}.particle`, {
              required: true,
            })}
          />
        </label>
      </div>
      <div>
        <label>
          Charge
          <input
            type="number"
            {...register(`set.states.${label}.charge`, {
              required: true,
              valueAsNumber: true,
            })}
          />
        </label>
      </div>
    </div>
  );
};

const AtomLSForm = ({
  label,
  control,
  register,
}: {
  label: string;
  control: Control<FieldValues, any>;
  register: UseFormRegister<FieldValues>;
}) => {
  const scheme = useWatch({
    control,
    name: `set.states.${label}.electronic.0.scheme`,
  });
  return (
    <div>
      <h4>Electronic</h4>
      <div>
        <label>
          Type
          <select
            {...register(`set.states.${label}.electronic.0.scheme`, {
              setValueAs: (v) => (v === "" ? undefined : v),
            })}
          >
            <option value="">Simple</option>
            <option value="LS">LS</option>
          </select>
        </label>
      </div>
      {scheme === undefined ? (
        <div>
          <label>
            e
            <input
              // TODO electronic.1
              {...register(`set.states.${label}.electronic.0.e`)}
            />
          </label>
        </div>
      ) : (
        <div>
          <h5>Term</h5>
          <div>
            <label>
              L
              <input
                type="number"
                // TODO electronic.1
                {...register(`set.states.${label}.electronic.0.term.L`, {
                  valueAsNumber: true,
                })}
              />
            </label>
          </div>
          <div>
            <label>
              S
              <input
                type="number"
                {...register(`set.states.${label}.electronic.0.term.S`, {
                  valueAsNumber: true,
                })}
              />
            </label>
          </div>
          <div>
            <label>
              P
              <select
                {...register(`set.states.${label}.electronic.0.term.P`, {
                  valueAsNumber: true,
                })}
              >
                <option value={-1}>-1</option>
                <option value={1}>1</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              J
              <input
                type="number"
                {...register(`set.states.${label}.electronic.0.term.J`, {
                  valueAsNumber: true,
                })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

const StateForm = ({
  label: initialLabel,
  onRemove,
  register,
  control,
}: {
  label: string;
  control: Control<FieldValues, any>;
  register: UseFormRegister<FieldValues>;
  onRemove: () => void;
}) => {
  const [label, setLabel] = useState(initialLabel);
  const state = useWatch({
    control,
    name: `set.states.${label}`,
  });
  console.log(state);
  // TODO label update based on whole state tricky as existing label needs to be removed
  // useEffect(() => {
  //   const newLabel = parse_state(state as InState<any>);
  //   setLabel(newLabel.id);
  // }, [state]);
  return (
    <div>
      <h3>{label}</h3>
      <div>
        <label>
          Type
          <select
            {...register(`set.states.${label}.type`, {
              setValueAs: (v) => (v === "" ? undefined : v),
            })}
          >
            <option value="">Simple particle</option>
            <option value="AtomLS">AtomLS</option>
          </select>
        </label>
      </div>
      <SimpleParticleForm label={label} register={register} />
      {state.type === "AtomLS" && (
        <AtomLSForm label={label} register={register} control={control} />
      )}
      {/* // TODO other state types */}
      <button type="button" title="Remove state" onClick={onRemove}>
        &minus;
      </button>
      <hr />
    </div>
  );
};

const ReferenceForm = ({
  label,
  onRemove,
  control,
}: {
  label: string;
  control: Control<FieldValues, any>;
  onRemove: () => void;
}) => {
  const reference = useWatch({
    control,
    name: `set.references.${label}`,
  });
  return (
    <li>
      {label}:
      <Reference {...reference} />
      <button type="button" title="Remove reference" onClick={onRemove}>
        &minus;
      </button>
    </li>
  );
};

const ImportDOIButton = ({
  onAdd,
}: {
  onAdd: (newLabel: string, newReference: ReferenceRecord) => void;
}) => {
  const [doi, setDoi] = useState("");
  const [open, setOpen] = useState(false);
  async function onSubmit(value: string) {
    if (value !== "cancel") {
      const refs = await Cite.inputAsync(doi, {
        forceType: "@doi/id",
      });
      const ref = refs[0];
      // TODO handle fetch/parse errors
      const cite = new Cite(ref, {
        forceType: "@csl/object",
      });
      const labels = cite.format("label");
      if (typeof labels === "string") {
        return;
      }
      const label = Object.values(labels)[0];
      onAdd(label, ref);
    }
    setOpen(false);
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Import from DOI
      </button>
      <Dialog isOpened={open} onSubmit={onSubmit}>
        <b>Import reference based on DOI</b>
        {/* TODO get rid of `<form> cannot appear as a descendant of <form>` warning */}
        <form method="dialog">
          <div>
            <input
              value={doi}
              style={{ width: "12rem" }}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="Enter DOI like 10.5284/1015681"
              // DOI pattern from https://www.crossref.org/blog/dois-and-matching-regular-expressions/
              // Does not work for `10.1103/PhysRev.97.1671`
              // pattern="^10.\d{4,9}/[-._;()/:A-Z0-9]+$"
            />
          </div>
          <button value="cancel">Cancel</button>
          <button value="default" type="submit">
            Import
          </button>
        </form>
      </Dialog>
    </div>
  );
};

export const EditForm = ({
  set,
  commitMessage,
  onSubmit,
  organizations,
}: Props) => {
  const { control, register, handleSubmit, setValue, watch } =
    useForm<FieldValues>({
      defaultValues: {
        set,
        commitMessage,
      },
    });
  const onLocalSubmit = (data: FieldValues) => {
    onSubmit(data.set, data.commitMessage);
  };

  // States
  const states = watch("set.states");
  const setStates = (newStates: Dict<InState<AnyAtomJSON | AnyMoleculeJSON>>) =>
    setValue("set.states", newStates);
  const addState = () => {
    const newLabel = `s${Object.keys(states).length}`;
    const newStates = {
      ...states,
      [newLabel]: {
        particle: "",
        charge: 0,
      },
    };
    setStates(newStates);
  };
  const removeState = (label: string) => {
    const { [label]: _todrop, ...newStates } = states;
    setStates(newStates);
    // TODO remove state from `set.processes.[*].reaction...state` array
  };

  // References
  const references = watch("set.references");
  const setReferences = (newReferences: Dict<ReferenceRecord>) =>
    setValue("set.references", newReferences);
  const addReference = (newLabel: string, newReference: ReferenceRecord) => {
    const newReferences = {
      ...references,
      [newLabel]: newReference,
    };
    setReferences(newReferences);
  };
  const removeReference = (label: string) => {
    const { [label]: _todrop, ...newReferences } = references;
    setReferences(newReferences);
    // TODO remove reference from `set.processes.[*].reference` array
  };

  // Processes
  const processesField = useFieldArray({
    control,
    name: "set.processes",
  });

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)}>
      <fieldset>
        <div>
          <label>
            Name
            <input {...register("set.name")} />
          </label>
        </div>
        <div>
          <label>
            Description
            <textarea {...register("set.description")} />
          </label>
        </div>
        <div>
          <label>
            Complete
            <input type="checkbox" {...register("set.complete")} />
          </label>
        </div>
        <div>
          <label>
            Contributor
            <select {...register("set.contributor")}>
              {organizations.map((o) => (
                <option key={o._key} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>States</legend>
        {Object.keys(states).map((label) => (
          <StateForm
            key={label}
            label={label}
            register={register}
            control={control}
            onRemove={() => removeState(label)}
          />
        ))}
        <button type="button" title="Add a state" onClick={addState}>
          +
        </button>
      </fieldset>
      <fieldset>
        <legend>References</legend>
        <ul>
          {Object.keys(references).map((label) => (
            <ReferenceForm
              key={label}
              label={label}
              control={control}
              onRemove={() => removeReference(label)}
            />
          ))}
        </ul>
        <ImportDOIButton onAdd={addReference} />
      </fieldset>
      <fieldset>
        <legend>Processes</legend>
        {processesField.fields.map((field, index) => (
          <ProcessForm
            key={field.id}
            index={index}
            register={register}
            control={control}
            onRemove={() => processesField.remove(index)}
          />
        ))}
        <button
          type="button"
          title="Add process"
          onClick={() => processesField.append(initialProcess())}
        >
          +
        </button>
      </fieldset>
      <div>
        <input
          style={{ width: "50rem" }}
          placeholder="Optionally describe which changes have been made."
          {...register("commitMessage")}
        />
      </div>
      <input type="submit" />
    </form>
  );
};

function initialProcess(): CrossSectionSetRaw["processes"][0] {
  return {
    reaction: { lhs: [], rhs: [], reversible: false, type_tags: [] },
    threshold: 0,
    type: Storage.LUT,
    labels: ["", ""],
    units: ["", ""],
    data: [],
  };
}
