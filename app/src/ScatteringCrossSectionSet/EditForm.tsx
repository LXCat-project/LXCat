import {
  Accordion,
  Button,
  Checkbox,
  Group,
  NativeSelect,
  NumberInput,
  Radio,
  Select,
  Tabs,
  Textarea,
  TextInput,
} from "@mantine/core";
import Cite from "citation-js";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  FieldError,
  FieldErrors,
  FieldErrorsImpl,
  FieldPath,
  FormProvider,
  get,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { ErrorMessage as PlainErrorMessage } from "@hookform/error-message";
import { ajvResolver } from "@hookform/resolvers/ajv";

import { OrganizationFromDB } from "@lxcat/database/dist/auth/queries";
import { CrossSectionSetInputOwned } from "@lxcat/database/dist/css/queries/author_read";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";
import { Dict, Pair } from "@lxcat/schema/dist/core/util";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { InState } from "@lxcat/schema/dist/core/state";
import schema4set from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";
import { parse_state } from "@lxcat/schema/dist/core/parse";

import { Dialog } from "../shared/Dialog";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "../ScatteringCrossSection/ReactionSummary";

interface FieldValues {
  set: CrossSectionSetRaw;
  commitMessage: string;
}

const ErrorMessage = (props: any) => (
  <PlainErrorMessage
    {...props}
    render={
      ({ messages }) =>
        messages ? (
          Object.entries(messages).map(([type, message]) => (
            <p key={type} style={{ color: "#a94442" }}>
              ⚠ {message}
            </p>
          ))
        ) : (
          <></>
        ) // In else when a nested parameter has error
    }
  />
);

const errorMsg = (
  errors: FieldErrors<FieldValues>,
  name: FieldPath<FieldValues>
) => {
  const error: FieldError | undefined = get(errors, name);

  if (!error) {
    return false;
  }

  return error.message;
};

const ReactionEntryForm = ({
  index: entryIndex,
  processIndex,
  side,
  onRemove,
}: {
  index: number;
  processIndex: number;
  side: "lhs" | "rhs";
  onRemove: () => void;
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const states = watch(`set.states`);
  return (
    <div style={{ display: "flex" }}>
      <div>
        <TextInput
          label="Count"
          withAsterisk
          error={errorMsg(
            errors,
            `set.processes.${processIndex}.reaction.${side}.${entryIndex}.count`
          )}
          {...register(
            `set.processes.${processIndex}.reaction.${side}.${entryIndex}.count`,
            {
              valueAsNumber: true,
            }
          )}
        />
      </div>
      <select
        title="State"
        {...register(
          `set.processes.${processIndex}.reaction.${side}.${entryIndex}.state`,
          {
            deps: ["set.states"],
          }
        )}
      >
        {Object.keys(states).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <ErrorMessage
        errors={errors}
        name={`set.processes.${processIndex}.reaction.${side}.${entryIndex}.state`}
      />
      <Button type="button" title="Remove process" onClick={onRemove}>
        &minus;
      </Button>
    </div>
  );
};

const ReactionForm = ({ index: processIndex }: { index: number }) => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const reversible = watch(`set.processes.${processIndex}.reaction.reversible`);
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
                  onRemove={() => lhsField.remove(index)}
                />
                {isNotLast && <span>+</span>}
              </div>
            );
          })}
          <Button
            type="button"
            title="Add consumed reaction entry"
            onClick={() => lhsField.append({ count: 1, state: "" })}
          >
            +
          </Button>
        </div>
        <ErrorMessage
          errors={errors}
          name={`set.processes.${processIndex}.reaction.rhs`}
        />
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
                  onRemove={() => rhsField.remove(index)}
                />
                {isNotLast && <span>+</span>}
              </div>
            );
          })}
          <Button
            type="button"
            title="Add produced reaction entry"
            onClick={() => rhsField.append({ count: 1, state: "" })}
          >
            +
          </Button>
        </div>
        <ErrorMessage
          errors={errors}
          name={`set.processes.${processIndex}.reaction.lhs`}
        />{" "}
      </div>
      <div>
        <label>
          Reversible
          <input
            type="checkbox"
            {...register(`set.processes.${processIndex}.reaction.reversible`)}
          />
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.processes.${processIndex}.reaction.reversible`}
        />
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
        <ErrorMessage
          errors={errors}
          name={`set.processes.${processIndex}.reaction.type_tags`}
        />
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
    <Button
      type="button"
      variant="light"
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
    </Button>
  );
};

const LUTForm = ({ index }: { index: number }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
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
              <Group>
                <TextInput
                  style={{ width: "6rem" }}
                  error={errorMsg(errors, `set.processes.${index}.labels.0`)}
                  {...register(`set.processes.${index}.labels.0`)}
                />{" "}
                <TextInput
                  style={{ width: "4rem" }}
                  error={errorMsg(errors, `set.processes.${index}.units.0`)}
                  {...register(`set.processes.${index}.units.0`)}
                />
              </Group>
            </th>
            <th>
              <Group>
                <TextInput
                  style={{ width: "6rem" }}
                  error={errorMsg(errors, `set.processes.${index}.labels.1`)}
                  {...register(`set.processes.${index}.labels.1`)}
                />{" "}
                <TextInput
                  style={{ width: "4rem" }}
                  error={errorMsg(errors, `set.processes.${index}.units.1`)}
                  {...register(`set.processes.${index}.units.1`)}
                />
              </Group>
            </th>
            <th>
              <Button
                title="Add"
                type="button"
                onClick={() => dataRows.append([[0, 0]])}
              >
                +
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {dataRows.fields.map((r, i) => (
            <tr key={i}>
              <td>
                <TextInput
                  style={{ width: "11rem" }}
                  error={errorMsg(errors, `set.processes.${index}.data.${i}.0`)}
                  {...register(`set.processes.${index}.data.${i}.0`)}
                />
              </td>
              <td>
                <TextInput
                  style={{ width: "11rem" }}
                  error={errorMsg(errors, `set.processes.${index}.data.${i}.1`)}
                  {...register(`set.processes.${index}.data.${i}.1`)}
                />
              </td>
              <td>
                <Button
                  title="Remove"
                  type="button"
                  onClick={() => dataRows.remove(i)}
                >
                  &minus;
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ErrorMessage errors={errors} name={`set.processes.${index}.data`} />
      <div>
        <CSDataUploadButton onSubmit={(newData) => dataRows.replace(newData)} />
      </div>
    </div>
  );
};

const ProcessForm = ({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const [references, type] = watch([
    "set.references",
    `set.processes.${index}.type`,
  ]);
  return (
    <div>
      <div>
        <label>
          References
          <select
            multiple
            {...register(`set.processes.${index}.reference`, {
              deps: ["set.references"],
            })}
          >
            {Object.keys(references).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.processes.${index}.reference`}
        />
      </div>

      <div>
        <TextInput
          label="Threshold"
          error={errorMsg(errors, `set.processes.${index}.threshold`)}
          {...register(`set.processes.${index}.threshold`, {
            valueAsNumber: true,
          })}
        />
      </div>
      {type === Storage.LUT && <LUTForm index={index} />}
      <ReactionForm index={index} />
      <div>
        <h4>Parameters</h4>
        <div>
          <label>
            Mass ratio
            <input
              {...register(`set.processes.${index}.parameters.mass_ratio`, {
                setValueAs: (v) => (v === null ? undefined : Number(v)),
              })}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.processes.${index}.parameters.mass_ratio`}
          />
        </div>
        <div>
          <label>
            Statistical weight ratio
            <input
              {...register(
                `set.processes.${index}.parameters.statistical_weight_ratio`,
                {
                  setValueAs: (v) => (v === null ? undefined : Number(v)),
                }
              )}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.processes.${index}.parameters.statistical_weight_ratio`}
          />
        </div>
      </div>
      <Button type="button" title="Remove" onClick={onRemove}>
        &minus;
      </Button>
      <ErrorMessage errors={errors} name={`set.processes.${index}`} />
      <hr />
    </div>
  );
};

const SimpleParticleForm = ({ label }: { label: string }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <Group>
      <TextInput
        label="Particle"
        withAsterisk
        error={errorMsg(errors, `set.states.${label}.particle`)}
        {...register(`set.states.${label}.particle`)}
      />
      {/* TODO change to number input */}
      <TextInput
        label="Charge"
        error={errorMsg(errors, `set.states.${label}.charge`)}
        {...register(`set.states.${label}.charge`, { valueAsNumber: true })}
      />
    </Group>
  );
};

const AtomLSElectronicForm = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const scheme = watch(`set.states.${label}.electronic.${eindex}.scheme`);
  return (
    <>
      <div>
        <Controller
          control={control}
          name={`set.states.${label}.electronic.${eindex}.scheme`}
          render={({ field: { onChange, value } }) => (
            <Radio.Group
              label="Scheme"
              // TODO drop scheme key when simple scheme is selected
              onChange={onChange}
              value={value}
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.scheme`
              )}
            >
              <Radio value="" label="Simple" />
              <Radio value="LS" label="LS" />
            </Radio.Group>
          )}
        />
      </div>
      {scheme !== "LS" ? (
        <div>
          <label>
            e
            <input
              {...register(`set.states.${label}.electronic.${eindex}.e`)}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.e`}
          />
        </div>
      ) : (
        <div>
          <h5>Term</h5>
          <Group>
          <div>
            <TextInput
              label="L"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.term.L`
              )}
              {...register(`set.states.${label}.electronic.${eindex}.term.L`, {
                valueAsNumber: true,
              })}
            />
          </div>
          <div>
            <TextInput
              label="S"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.term.S`
              )}
              {...register(`set.states.${label}.electronic.${eindex}.term.S`, {
                valueAsNumber: true,
              })}
            />
          </div>
          <div>
            <Controller
              control={control}
              name={`set.states.${label}.electronic.${eindex}.term.P`}
              render={({ field: { onChange, value } }) => (
                <Radio.Group
                  label="P"
                  onChange={(v) => onChange(parseInt(v))}
                  value={value.toString()}
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.term.P`
                  )}
                >
                  <Radio value="-1" label="-1" />
                  <Radio value="1" label="1" />
                </Radio.Group>
              )}
            />
          </div>
          <div>
            <TextInput
              label="J"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.term.J`
              )}
              {...register(`set.states.${label}.electronic.${eindex}.term.J`, {
                valueAsNumber: true,
              })}
            />
          </div>
          </Group>
        </div>
      )}
    </>
  );
};

const AtomLSForm = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={{ e: "" }}
      item={(label, eindex) => (
        <AtomLSElectronicForm label={label} eindex={eindex} />
      )}
    />
  );
};

const initialValue4AtomJ1L2Config = () => ({ n: 0, l: 0, occupance: 0 });
const AtomJ1L2ConfigArray = ({
  label,
  eindex,
  side,
}: {
  label: string;
  eindex: number;
  side: "core" | "excited";
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const array = useFieldArray({
    control,
    name: `set.states.${label}.electronic.${eindex}.config.${side}.config`,
  });
  return (
    <div>
      <ol>
        {array.fields.map((_field, index) => (
          <ArrayItem
            key={index}
            removeTitle="Remove config"
            onRemove={() => array.remove(index)}
          >
            <Group>
              <div>
                <TextInput
                  label="n"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.n`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.n`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
              <div>
                <TextInput
                  label="l"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.l`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.l`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
              <div>
                <TextInput
                  label="Occupance"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.occupance`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.config.${side}.config.${index}.occupance`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
            </Group>
          </ArrayItem>
        ))}
      </ol>
      <Button
        type="button"
        title="Add config part"
        onClick={() => array.append(initialValue4AtomJ1L2Config())}
      >
        +
      </Button>
      <ErrorMessage errors={errors} name={`set.states.${label}.electronic`} />
    </div>
  );
};

const LSTermConfigForm = ({
  label,
  eindex,
  side,
}: {
  label: string;
  eindex: number;
  side: "core" | "excited";
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  return (
    <>
      <h6>Config</h6>
      <AtomJ1L2ConfigArray label={label} eindex={eindex} side={side} />
      <h6>Term</h6>
      <div>
        <div>
          <TextInput
            label="L"
            withAsterisk
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.config.${side}.term.L`
            )}
            {...register(
              `set.states.${label}.electronic.${eindex}.config.${side}.term.L`,
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
        <div>
          <TextInput
            label="S"
            withAsterisk
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.config.${side}.term.S`
            )}
            {...register(
              `set.states.${label}.electronic.${eindex}.config.${side}.term.S`,
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name={`set.states.${label}.electronic.${eindex}.config.${side}.term.P`}
            render={({ field: { onChange, value } }) => (
              <Radio.Group
                label="P"
                onChange={(v) => onChange(parseInt(v))}
                value={value.toString()}
                error={errorMsg(
                  errors,
                  `set.states.${label}.electronic.${eindex}.config.${side}.term.P`
                )}
              >
                <Radio value="-1" label="-1" />
                <Radio value="1" label="1" />
              </Radio.Group>
            )}
          />
        </div>
        {side === "core" && (
          <div>
            <TextInput
              label="J"
              withAsterisk
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.config.${side}.term.J`
              )}
              {...register(
                `set.states.${label}.electronic.${eindex}.config.${side}.term.J`,
                {
                  valueAsNumber: true,
                }
              )}
            />
          </div>
        )}
      </div>
    </>
  );
};

const AtomJ1L2FormElectronicForm = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <>
      <h5>Core</h5>
      <LSTermConfigForm label={label} eindex={eindex} side="core" />
      <h5>Excited</h5>
      <LSTermConfigForm label={label} eindex={eindex} side="excited" />
      <h5>Term</h5>
      <div>
        <div>
          <label>
            K
            <input
              {...register(`set.states.${label}.electronic.${eindex}.term.K`, {
                valueAsNumber: true,
              })}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.term.K`}
          />
        </div>
        <div>
          <label>
            S
            <input
              {...register(`set.states.${label}.electronic.${eindex}.term.S`, {
                valueAsNumber: true,
              })}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.term.S`}
          />
        </div>
        <div>
          <label>
            P{/* TODO is P also parity here, if so render as select 1 | -1 */}
            <input
              {...register(`set.states.${label}.electronic.${eindex}.term.P`, {
                valueAsNumber: true,
              })}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.term.P`}
          />
        </div>
        <div>
          <label>
            J
            <input
              {...register(`set.states.${label}.electronic.${eindex}.term.J`, {
                valueAsNumber: true,
              })}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.term.J`}
          />
        </div>
      </div>
    </>
  );
};

const initialValue4AtomJIL2 = () => ({
  scheme: "J1L2",
  config: {
    core: {
      scheme: "LS",
      config: [{ n: 0, l: 0, occupance: 0 }],
      term: { L: 0, S: 0, P: 1, J: 0 },
    },
    excited: {
      scheme: "LS",
      config: [{ n: 0, l: 0, occupance: 0 }],
      term: { L: 0, S: 0, P: 1, J: 0 },
    },
  },
  term: {
    K: 0,
    S: 0,
    P: 0,
    J: 0,
  },
});

const AtomJ1L2Form = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={initialValue4AtomJIL2()}
      item={(label, eindex) => (
        <AtomJ1L2FormElectronicForm label={label} eindex={eindex} />
      )}
    />
  );
};

const MolecularParityField = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  return (
    <div>
      <label>
        Parity
        <select
          {...register(`set.states.${label}.electronic.${eindex}.parity`)}
        >
          <option value="g">g</option>
          <option value="u">u</option>
        </select>
      </label>
      <ErrorMessage
        errors={errors}
        name={`set.states.${label}.electronic.${eindex}.parity`}
      />
    </div>
  );
};

const LinearTriatomVibrationalFieldItem = ({
  label,
  eindex,
  vindex,
}: {
  label: string;
  eindex: number;
  vindex: number;
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  return (
    <>
      <label>v</label>
      <div style={{ display: "flex" }}>
        <div>
          {/* // TODO in example data sets array could also be `n,0,0` string */}
          <input
            title="v0"
            min={1}
            style={{ width: "2rem" }}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.0`,
              {
                // TODO in example data sets could also be `n`
                valueAsNumber: true,
              }
            )}
          />
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.0`}
          />
        </div>
        <div>
          <input
            title="v1"
            min={1}
            style={{ width: "2rem" }}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.1`,
              {
                valueAsNumber: true,
              }
            )}
          />
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.1`}
          />
        </div>
        <div>
          <input
            title="v2"
            min={1}
            style={{ width: "2rem" }}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.2`,
              {
                valueAsNumber: true,
              }
            )}
          />
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.2`}
          />
        </div>
      </div>
    </>
  );
};

const LinearTriatomVibrationalField = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  return (
    <VibrationalArray
      label={label}
      eindex={eindex}
      initialValue={{ v: 0 }}
      item={(label, eindex, vindex) => (
        <LinearTriatomVibrationalFieldItem
          key={vindex}
          label={label}
          eindex={0}
          vindex={vindex}
        />
      )}
    />
  );
};

const LinearElectronicForm = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  return (
    <div>
      <div>
        <label>
          e
          <input {...register(`set.states.${label}.electronic.${eindex}.e`)} />
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.states.${label}.electronic.${eindex}.e`}
        />
      </div>
      <div>
        <label>
          Lambda
          <input
            {...register(`set.states.${label}.electronic.${eindex}.Lambda`)}
          />
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.states.${label}.electronic.${eindex}.Lambda`}
        />
      </div>
      <div>
        <label>
          S
          <input {...register(`set.states.${label}.electronic.${eindex}.S`)} />
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.states.${label}.electronic.${eindex}.S`}
        />
      </div>
      <div>
        <label>
          Reflection
          <select
            {...register(`set.states.${label}.electronic.${eindex}.reflection`)}
          >
            <option value=""></option>
            <option value="-">&minus;</option>
            <option value="+">+</option>
          </select>
        </label>
        <ErrorMessage
          errors={errors}
          name={`set.states.${label}.electronic.${eindex}.reflection`}
        />
      </div>
    </div>
  );
};

const ElectronicArray = ({
  label,
  item,
  initialValue,
}: {
  label: string;
  item: (label: string, eindex: number) => React.ReactNode;
  initialValue: any; // TODO add generic type
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const array = useFieldArray({
    control,
    name: `set.states.${label}.electronic`,
  });
  return (
    <div>
      <h4>Electronic</h4>
      <ol>
        {array.fields.map((_field, index) => (
          <ArrayItem
            key={index}
            removeTitle="Remove electronic part"
            onRemove={() => array.remove(index)}
          >
            {item(label, index)}
          </ArrayItem>
        ))}
        <Button
          type="button"
          title="Add electronic part"
          onClick={() => array.append(initialValue)}
        >
          +
        </Button>
      </ol>
      <ErrorMessage errors={errors} name={`set.states.${label}.electronic`} />
    </div>
  );
};

const ArrayItem = ({
  removeTitle,
  onRemove,
  children,
}: {
  removeTitle: string;
  onRemove: () => void;
  children: React.ReactNode;
}) => {
  return (
    <li>
      {children}
      <Button type="button" title={removeTitle} onClick={onRemove}>
        &minus;
      </Button>
    </li>
  );
};

const LinearTriatomInversionCenterForm = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={{ e: "X", Lambda: 0, S: 0, parity: "g" }}
      item={(label, eindex) => (
        <>
          <LinearElectronicForm label={label} eindex={eindex} />
          <MolecularParityField label={label} eindex={eindex} />
          <LinearTriatomVibrationalField label={label} eindex={eindex} />
        </>
      )}
    />
  );
};

const VibrationalArray = ({
  label,
  eindex,
  item,
  initialValue,
}: {
  label: string;
  eindex: number;
  item: (label: string, eindex: number, vindex: number) => React.ReactNode;
  initialValue: any;
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const array = useFieldArray({
    control,
    name: `set.states.${label}.electronic.${eindex}.vibrational`,
  });
  return (
    <div>
      <h5>Vibrational</h5>
      <ol>
        {array.fields.map((field, index) => (
          <ArrayItem
            removeTitle="Remove vibrational part"
            key={index}
            onRemove={() => array.remove(index)}
          >
            {item(label, eindex, index)}
          </ArrayItem>
        ))}
        <Button
          type="button"
          title="Add vibrational"
          onClick={() => array.append([initialValue])}
        >
          +
        </Button>
      </ol>

      <ErrorMessage
        errors={errors}
        name={`set.states.${label}.electronic.${eindex}.vibrational`}
      />
    </div>
  );
};

const RotationalArray = ({
  label,
  eindex,
  vindex,
}: {
  label: string;
  eindex: number;
  vindex: number;
}) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const array = useFieldArray({
    control,
    name: `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational`,
  });
  return (
    <div>
      <h5>Rotational</h5>
      <ol>
        {array.fields.map((field, index) => (
          <ArrayItem
            removeTitle="Remove rotational part"
            key={index}
            onRemove={() => array.remove(index)}
          >
            <label>
              J
              <input
                {...register(
                  `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`
                )}
              />
            </label>
            <ErrorMessage
              errors={errors}
              name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`}
            />
          </ArrayItem>
        ))}
        <Button
          type="button"
          title="Add rotational"
          onClick={() => array.append({ J: 0 })}
        >
          +
        </Button>
      </ol>

      <ErrorMessage
        errors={errors}
        name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational`}
      />
    </div>
  );
};

const DiatomicVibrationalForm = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <VibrationalArray
      label={label}
      eindex={eindex}
      initialValue={{ v: 0 }}
      item={(label, eindex, vindex) => (
        <>
          <label>
            v
            <input
              {...register(
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`,
                {
                  valueAsNumber: true,
                }
              )}
            />
          </label>
          <ErrorMessage
            errors={errors}
            name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`}
          />
          <RotationalArray label={label} eindex={eindex} vindex={vindex} />
        </>
      )}
    />
  );
};

const HeteronuclearDiatomForm = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={{ e: "", Lambda: 0, S: 0 }}
      item={(label, eindex) => (
        <>
          <LinearElectronicForm label={label} eindex={eindex} />
          <DiatomicVibrationalForm label={label} eindex={eindex} />
        </>
      )}
    />
  );
};

const HomonuclearDiatomForm = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={{ e: "", Lambda: 0, S: 0, parity: "g" }}
      item={(label, eindex) => (
        <>
          <LinearElectronicForm label={label} eindex={eindex} />
          <MolecularParityField label={label} eindex={eindex} />
          <DiatomicVibrationalForm label={label} eindex={eindex} />
        </>
      )}
    />
  );
};

const StateForm = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const [id, setId] = useState("");
  const state = watch(`set.states.${label}`);
  // TODO label update based on whole state tricky as existing label (a key in states object) needs to be removed
  useEffect(() => {
    const parsed = parse_state(state as InState<any>);
    setId(parsed.id);
  }, [state]);

  return (
    <Accordion.Item key={label} value={label}>
      <Accordion.Control>
        {label}: {id}
      </Accordion.Control>
      <Accordion.Panel>
        <div>
          <Controller
            control={control}
            name={`set.states.${label}.type`}
            render={({ field: { onChange, value } }) => (
              <Radio.Group
                label="Type"
                onChange={(v) => v === "" ? onChange(undefined) : onChange(v) }
                value={value}
                error={errorMsg(errors, `set.states.${label}.type`)}
              >
                <Radio value="" label="Simple particle" />
                <Radio value="AtomLS" label="Atom LS" />
                <Radio value="AtomJ1L2" label="Atom J1L2" />
                <Radio
                  value="HeteronuclearDiatom"
                  label="Heteronuclear Diatom"
                />
                <Radio value="HomonuclearDiatom" label="Homonuclear Diatom" />
                <Radio
                  value="LinearTriatomInversionCenter"
                  label="Linear Triatom Inversion Center"
                />
              </Radio.Group>
            )}
          />
        </div>
        <SimpleParticleForm label={label} />
        {state.type === "AtomLS" && <AtomLSForm label={label} />}
        {state.type === "AtomJ1L2" && <AtomJ1L2Form label={label} />}
        {state.type === "HeteronuclearDiatom" && (
          <HeteronuclearDiatomForm label={label} />
        )}
        {state.type === "HomonuclearDiatom" && (
          <HomonuclearDiatomForm label={label} />
        )}
        {state.type === "LinearTriatomInversionCenter" && (
          <LinearTriatomInversionCenterForm label={label} />
        )}
        {/* // TODO atomls1 */}
        <Button type="button" title="Remove state" onClick={onRemove}>
          &minus;
        </Button>
        <hr />
      </Accordion.Panel>
    </Accordion.Item>
  );
};

const ReferenceForm = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => {
  const { watch } = useFormContext();
  const reference = watch(`set.references.${label}`);
  return (
    <li>
      {label}:
      <Reference {...reference} />
      <Button type="button" title="Remove reference" onClick={onRemove}>
        &minus;
      </Button>
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
      // TODO resolving doi can take long time and timeout, should notify user when fetch fails
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
      <Button type="button" variant="light" onClick={() => setOpen(true)}>
        Import from DOI
      </Button>
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
              // Does not work for `10.3390/atoms9010016`
              // pattern="^10.\d{4,9}/[-._;()/:A-Z0-9]+$"
            />
          </div>
          <Button value="cancel">Cancel</Button>
          <Button value="default" type="submit">
            Import
          </Button>
        </form>
      </Dialog>
    </div>
  );
};

const ImportBibTeXDOIButton = ({
  onAdd,
}: {
  onAdd: (refs: Record<string, ReferenceRecord>) => void;
}) => {
  const [bibtex, setBibtex] = useState("");
  const [open, setOpen] = useState(false);
  async function onSubmit(value: string) {
    if (value !== "cancel") {
      // TODO resolving doi can take long time and timeout, should notify user when fetch fails
      const refs = await Cite.inputAsync(bibtex, {
        forceType: "@bibtex/text",
      });
      const labelRefs = Object.fromEntries(
        refs.map((r) => {
          const cite = new Cite(r, {
            forceType: "@csl/object",
          });
          const labels = cite.format("label");
          if (typeof labels === "string") {
            throw new Error("Unexpected type for citation label");
          }
          const label = Object.values(labels)[0];
          return [label, r];
        })
      );

      onAdd(labelRefs);
    }
    setOpen(false);
  }
  const placeholder = `Enter BibTeX like:
@Article{atoms9010016,
  AUTHOR = {Carbone, Emile and Graef, Wouter and Hagelaar, Gerjan and Boer, Daan and Hopkins, Matthew M. and Stephens, Jacob C. and Yee, Benjamin T. and Pancheshnyi, Sergey and van Dijk, Jan and Pitchford, Leanne},
  TITLE = {Data Needs for Modeling Low-Temperature Non-Equilibrium Plasmas: The LXCat Project, History, Perspectives and a Tutorial},
  JOURNAL = {Atoms},
  VOLUME = {9},
  YEAR = {2021},
  NUMBER = {1},
  ARTICLE-NUMBER = {16},
  URL = {https://www.mdpi.com/2218-2004/9/1/16},
  ISSN = {2218-2004},
  DOI = {10.3390/atoms9010016}
}`;
  return (
    <div>
      <Button type="button" variant="light" onClick={() => setOpen(true)}>
        Import from BibTeX
      </Button>
      <Dialog isOpened={open} onSubmit={onSubmit}>
        <b>Import references based on BibTeX</b>
        {/* TODO get rid of `<form> cannot appear as a descendant of <form>` warning */}
        <form method="dialog">
          <div>
            <textarea
              value={bibtex}
              style={{ width: "60rem", height: "16rem" }}
              placeholder={placeholder}
              onChange={(e) => setBibtex(e.target.value)}
            />
          </div>
          <Button value="cancel">Cancel</Button>
          <Button value="default" type="submit">
            Import
          </Button>
        </form>
      </Dialog>
    </div>
  );
};

const schema4form = {
  type: "object",
  properties: {
    set: schema4set,
    commitMessage: {
      type: "string",
    },
  },
  required: ["set", "commitMessage"],
  additionalProperties: false,
};

interface Props {
  set: CrossSectionSetRaw; // TODO should be CrossSectionSetInputOwned, but gives type error
  commitMessage: string;
  onSubmit: (newSet: CrossSectionSetInputOwned, newMessage: string) => void;
  organizations: OrganizationFromDB[];
}

export const EditForm = ({
  set,
  commitMessage,
  onSubmit,
  organizations,
}: Props) => {
  const methods = useForm<FieldValues>({
    defaultValues: {
      set,
      commitMessage,
    },
    resolver: ajvResolver(schema4form as any),
    reValidateMode: "onBlur", // Default onChange felt too slow
    criteriaMode: "all",
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = methods;

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
  const addReferences = (references2add: Record<string, ReferenceRecord>) => {
    const newReferences = { ...references };
    Object.entries(references2add).forEach(([k, v]) => (newReferences[k] = v));
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
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onLocalSubmit, (err) => {
          console.error(err);
          console.info(getValues());
        })}
      >
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="states">States</Tabs.Tab>
            <Tabs.Tab value="references">References</Tabs.Tab>
            <Tabs.Tab value="processes">Processes</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <div>
              <TextInput
                label="Name"
                withAsterisk
                error={errorMsg(errors, "set.name")}
                {...register("set.name")}
              />
            </div>
            <div>
              <Textarea
                label="Description"
                withAsterisk
                error={errorMsg(errors, "set.description")}
                minRows={10}
                {...register("set.description")}
              />
            </div>
            <div>
              <Checkbox label="Complete" {...register("set.complete")} />
            </div>
            <div>
              <NativeSelect
                label="Contributor"
                data={organizations.map((o) => o.name)}
                error={errorMsg(errors, "set.contributor")}
                {...register("set.contributor")}
              />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="states">
            <Accordion multiple>
              {Object.keys(states).map((label) => (
                <StateForm
                  key={label}
                  label={label}
                  onRemove={() => removeState(label)}
                />
              ))}
            </Accordion>
            <Button type="button" title="Add a state" onClick={addState}>
              +
            </Button>
            <ErrorMessage errors={errors} name="set.states" />
          </Tabs.Panel>
          <Tabs.Panel value="references">
            <ul>
              {Object.keys(references).map((label) => (
                <ReferenceForm
                  key={label}
                  label={label}
                  onRemove={() => removeReference(label)}
                />
              ))}
            </ul>
            <div style={{ display: "flex" }}>
              <ImportDOIButton onAdd={addReference} />
              <ImportBibTeXDOIButton onAdd={addReferences} />
            </div>
            <ErrorMessage errors={errors} name="set.references" />
          </Tabs.Panel>
          <Tabs.Panel value="processes">
            <Accordion multiple>
              {processesField.fields.map((field, index) => (
                <Accordion.Item key={field.id} value={field.id}>
                  <Accordion.Control>Reaction {field.id}</Accordion.Control>
                  <Accordion.Panel>
                    <ProcessForm
                      index={index}
                      onRemove={() => processesField.remove(index)}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
            <Button
              type="button"
              title="Add process"
              onClick={() => processesField.append(initialProcess())}
            >
              +
            </Button>
            <ErrorMessage errors={errors} name="set.processes" />
          </Tabs.Panel>
        </Tabs>
        <div>
          <TextInput
            placeholder="Optionally describe which changes have been made."
            error={errorMsg(errors, "commitMessage")}
            {...register("commitMessage")}
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
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
