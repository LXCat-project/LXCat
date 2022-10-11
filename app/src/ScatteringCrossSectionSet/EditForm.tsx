import {
  Accordion,
  Button,
  Checkbox,
  FileButton,
  Group,
  Modal,
  MultiSelect,
  NativeSelect,
  Radio,
  Select,
  Space,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Stack,
} from "@mantine/core";
import Cite from "citation-js";
import { forwardRef, ReactNode, useMemo, useState } from "react";
import {
  Controller,
  FieldError,
  FieldErrors,
  FieldPath,
  FormProvider,
  get,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { ErrorMessage as PlainErrorMessage } from "@hookform/error-message";
import { ajvResolver } from "@hookform/resolvers/ajv";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

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
import { parseState } from "@lxcat/schema/dist/core/parse";

import { Reference } from "../shared/Reference";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { ReactionSummary } from "../ScatteringCrossSection/ReactionSummary";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { StatePickerModal } from "./StatePickeModal";
import { StateDict } from "@lxcat/database/dist/shared/queries/state";
import { PickerModal as CrossSectionPickerModal } from "../ScatteringCrossSection/PickerModal";
import { Picked as PickedCrossSections } from "../ScatteringCrossSection/Picker";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { getReferenceLabel, reference2bibliography } from "../shared/cite";

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

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
  latex: string;
}

const StateItemComponent = forwardRef<HTMLDivElement, ItemProps>(
  function inline({ latex, ...others }: ItemProps, ref) {
    return (
      <div ref={ref} {...others}>
        <InlineMath>{latex}</InlineMath>
      </div>
    );
  }
);

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
    control,
    formState: { errors },
  } = useFormContext();
  const states: Record<string, State> = useWatch({ name: `set.states` });
  return (
    <div style={{ display: "flex" }}>
      <div>
        <TextInput
          label="Count"
          style={{ width: "4rem" }}
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
      <Controller
        control={control}
        name={`set.processes.${processIndex}.reaction.${side}.${entryIndex}.state`}
        render={({ field: { onBlur, onChange, value } }) => (
          <Stack>
            <Select
              label="State"
              itemComponent={StateItemComponent}
              data={Object.entries(states).map(([value, s]) => {
                return { value, latex: s.latex };
              })}
              value={value}
              error={errorMsg(
                errors,
                `set.processes.${processIndex}.reaction.${side}.${entryIndex}.state`
              )}
              onBlur={onBlur}
              onChange={onChange}
            />
            {/* 
            TODO render latex inside select box instead of under it 
            Tried icon and righSection props, but width is too small
          */}
            {value && <InlineMath>{states[value].latex}</InlineMath>}
          </Stack>
        )}
      />
      <Button type="button" title="Remove process" onClick={onRemove}>
        &minus;
      </Button>
    </div>
  );
};

const ReactionForm = ({ index: processIndex }: { index: number }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
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
                {isNotLast && <Text sx={{ fontSize: "2em" }}>+</Text>}
              </div>
            );
          })}
          <Button
            type="button"
            title="Add consumed reaction entry"
            aria-label="Add consumed reaction entry"
            onClick={() => lhsField.append({ count: 1, state: "" })}
          >
            +
          </Button>
        </div>
        <ErrorMessage
          errors={errors}
          name={`set.processes.${processIndex}.reaction.rhs`}
        />
        <Controller
          control={control}
          name={`set.processes.${processIndex}.reaction.reversible`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Radio.Group
              orientation="vertical"
              onChange={(v) => onChange(v !== "")}
              value={value ? "reversible" : ""}
              onBlur={onBlur}
              error={errorMsg(
                errors,
                `set.processes.${processIndex}.reaction.reversible`
              )}
            >
              <Radio
                value=""
                label={<Text style={{ fontSize: "2em" }}>➞</Text>}
              />
              <Radio
                value="reversible"
                title="Reversible"
                label={<Text style={{ fontSize: "2em" }}>⇄</Text>}
              />
            </Radio.Group>
          )}
        />
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
                {isNotLast && <Text sx={{ fontSize: "2em" }}>+</Text>}
              </div>
            );
          })}
          <Button
            type="button"
            title="Add produced reaction entry"
            aria-label="Add produced reaction entry"
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
        <Controller
          control={control}
          name={`set.processes.${processIndex}.reaction.type_tags`}
          render={({ field: { onBlur, onChange, value } }) => (
            <MultiSelect
              label="Type tags"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              data={Object.keys(ReactionTypeTag).map((t) => ({
                label: t,
                value: t,
              }))}
              error={errorMsg(
                errors,
                `set.processes.${processIndex}.reaction.type_tags`
              )}
            />
          )}
        />
      </div>
    </div>
  );
};

const CSDataJSONUploadButton = ({
  onSubmit,
}: {
  onSubmit: (newData: Pair<number>[]) => void;
}) => {
  async function mungeBlob(file: File | null): Promise<void> {
    if (file === null) {
      return;
    }
    const body = await file.text();
    const newData = JSON.parse(body);
    onSubmit(newData);
  }

  return (
    <FileButton accept="application/json,.json" onChange={mungeBlob}>
      {(props) => (
        <Button title="For example `[[1,2]]`" variant="light" {...props}>
          Upload JSON
        </Button>
      )}
    </FileButton>
  );
};

const CSDataCsvUploadButton = ({
  onSubmit,
}: {
  onSubmit: (newData: Pair<number>[]) => void;
}) => {
  async function mungeBlob(file: File | null): Promise<void> {
    if (file === null) {
      return;
    }
    const body = await file.text();
    const newData = body.split(/\r?\n/).map((r): Pair<number> => {
      const cols = r.split(",").map(Number);
      return [cols[0], cols[1]];
    });
    onSubmit(newData);
  }

  return (
    <FileButton accept="text/csv,.csv,text/plain,.txt" onChange={mungeBlob}>
      {(props) => (
        <Button
          title="For example `1,2\n3,4.5e-6\n`"
          variant="light"
          {...props}
        >
          Upload CSV
        </Button>
      )}
    </FileButton>
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
                aria-label="Add data row to process"
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
                  {...register(`set.processes.${index}.data.${i}.0`, {
                    valueAsNumber: true,
                  })}
                />
              </td>
              <td>
                <TextInput
                  style={{ width: "11rem" }}
                  error={errorMsg(errors, `set.processes.${index}.data.${i}.1`)}
                  {...register(`set.processes.${index}.data.${i}.1`, {
                    valueAsNumber: true,
                  })}
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
      <Button.Group>
        <CSDataJSONUploadButton
          onSubmit={(newData) => dataRows.replace(newData)}
        />
        <CSDataCsvUploadButton
          onSubmit={(newData) => dataRows.replace(newData)}
        />
      </Button.Group>
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
    control,
    formState: { errors },
  } = useFormContext();
  const [references, type] = watch([
    "set.references",
    `set.processes.${index}.type`,
  ]);
  const bibliopgraphies = useMemo(() => {
    return Object.keys(references).map((r) => ({
      label: reference2bibliography(references[r]),
      value: r,
    }));
  }, [references]);
  return (
    <div>
      <div>
        <Controller
          control={control}
          name={`set.processes.${index}.reference`}
          rules={{
            deps: ["set.references"],
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <MultiSelect
              label="References"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              data={bibliopgraphies}
              error={errorMsg(errors, `set.processes.${index}.reference`)}
            />
          )}
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
        <Group>
          <TextInput
            label="Mass ratio"
            error={errorMsg(
              errors,
              `set.processes.${index}.parameters.mass_ratio`
            )}
            {...register(`set.processes.${index}.parameters.mass_ratio`, {
              setValueAs: (v) => (v ? Number(v) : undefined),
            })}
          />
          <TextInput
            label="Statistical weight ratio"
            error={errorMsg(
              errors,
              `set.processes.${index}.parameters.statistical_weight_ratio`
            )}
            {...register(
              `set.processes.${index}.parameters.statistical_weight_ratio`,
              {
                setValueAs: (v) => (v ? Number(v) : undefined),
              }
            )}
          />
        </Group>
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
        withAsterisk
        error={errorMsg(errors, `set.states.${label}.charge`)}
        {...register(`set.states.${label}.charge`, { valueAsNumber: true })}
      />
    </Group>
  );
};

const initialSimpleElectronic = () => ({ e: "" });
const initialAtomLSElectronic = () => ({
  scheme: "LS",
  config: [],
  term: { L: 0, S: 0, P: 1, J: 0 },
});

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
    setValue,
  } = useFormContext();
  const scheme = watch(`set.states.${label}.electronic.${eindex}.scheme`);
  return (
    <>
      <div>
        <Controller
          control={control}
          name={`set.states.${label}.electronic.${eindex}.scheme`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Radio.Group
              label="Scheme"
              onChange={(v) => {
                onChange(v);
                if (v === "LS") {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialAtomLSElectronic()
                  );
                } else {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialSimpleElectronic()
                  );
                }
              }}
              onBlur={onBlur}
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
          <TextInput
            label="e"
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.e`
            )}
            {...register(`set.states.${label}.electronic.${eindex}.e`)}
          />
        </div>
      ) : (
        <AtomLSElectronicDetailedForm label={label} eindex={eindex} />
      )}
    </>
  );
};

const AtomLSElectronicDetailedForm = ({
  label,
  eindex,
}: {
  label: string;
  eindex: number;
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  return (
    <div>
      <h5>Config</h5>
      <AtomLSConfigArray label={label} eindex={eindex} side="" />
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
            render={({ field: { onBlur, onChange, value } }) => (
              <Radio.Group
                label="P"
                onChange={(v) => onChange(parseInt(v))}
                onBlur={onBlur}
                value={value === undefined ? 1 : value.toString()}
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
  );
};

const AtomLSForm = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={initialSimpleElectronic()}
      item={(label, eindex) => (
        <AtomLSElectronicForm label={label} eindex={eindex} />
      )}
    />
  );
};

const initialValue4AtomLSConfig = () => ({ n: 0, l: 0, occupance: 0 });
const AtomLSConfigArray = ({
  label,
  eindex,
  side,
}: {
  label: string;
  eindex: number;
  side: "" | "core" | "excited";
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const prefix: FieldPath<FieldValues> =
    side === ""
      ? `set.states.${label}.electronic.${eindex}.config`
      : `set.states.${label}.electronic.${eindex}.config.${side}.config`;
  const array = useFieldArray({
    control,
    name: prefix,
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
                  error={errorMsg(errors, `${prefix}.${index}.n`)}
                  {...register(`${prefix}.${index}.n`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div>
                <TextInput
                  label="l"
                  error={errorMsg(errors, `${prefix}.${index}.l`)}
                  {...register(`${prefix}.${index}.l`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div>
                <TextInput
                  label="Occupance"
                  error={errorMsg(errors, `${prefix}.${index}.occupance`)}
                  {...register(`${prefix}.${index}.occupance`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </Group>
          </ArrayItem>
        ))}
      </ol>
      <Button
        type="button"
        title="Add config part"
        onClick={() => array.append(initialValue4AtomLSConfig())}
      >
        +
      </Button>
      <ErrorMessage errors={errors} name={`${prefix}`} />
    </div>
  );
};

const LSTermConfigForm = ({
  label,
  eindex,
  side,
  isLS1,
}: {
  label: string;
  eindex: number;
  side: "core" | "excited";
  isLS1: boolean;
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  return (
    <>
      <h6>Config</h6>
      <AtomLSConfigArray label={label} eindex={eindex} side={side} />
      <h6>Term</h6>
      <Group>
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
            render={({ field: { onBlur, onChange, value } }) => (
              <Radio.Group
                label="P"
                onChange={(v) => onChange(parseInt(v))}
                onBlur={onBlur}
                value={value === undefined ? undefined : value.toString()}
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
        {/* LS1 does not have J in core, but J1L2 does */}
        {side === "core" && !isLS1 && (
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
      </Group>
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
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext();
  const scheme = watch(`set.states.${label}.electronic.${eindex}.scheme`);
  return (
    <>
      <div>
        <Controller
          control={control}
          name={`set.states.${label}.electronic.${eindex}.scheme`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Radio.Group
              label="Scheme"
              onChange={(v) => {
                onChange(v);
                if (v === "J1L2") {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialValue4AtomJIL2()
                  );
                } else {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialSimpleElectronic()
                  );
                }
              }}
              onBlur={onBlur}
              value={value}
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.scheme`
              )}
            >
              <Radio value="" label="Simple" />
              <Radio value="J1L2" label="J1L2" />
            </Radio.Group>
          )}
        />
      </div>
      {scheme !== "J1L2" ? (
        <div>
          <TextInput
            label="e"
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.e`
            )}
            {...register(`set.states.${label}.electronic.${eindex}.e`)}
          />
        </div>
      ) : (
        <AtomJ1L2FormElectronicDetailedForm label={label} eindex={eindex} />
      )}
    </>
  );
};

const AtomJ1L2FormElectronicDetailedForm = ({
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
      <fieldset>
        <legend>Core</legend>
        <LSTermConfigForm
          label={label}
          eindex={eindex}
          side="core"
          isLS1={false}
        />
      </fieldset>
      <fieldset>
        <legend>Excited</legend>
        <LSTermConfigForm
          label={label}
          eindex={eindex}
          side="excited"
          isLS1={false}
        />
      </fieldset>
      <h5>Term</h5>
      <Group>
        <div>
          <TextInput
            label="K"
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.term.K`
            )}
            {...register(`set.states.${label}.electronic.${eindex}.term.K`, {
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
          {/* TODO if P also parity here? if so render as select 1 | -1 */}
          <TextInput
            label="P"
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.term.P`
            )}
            {...register(`set.states.${label}.electronic.${eindex}.term.P`, {
              valueAsNumber: true,
            })}
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
      term: { L: 0, S: 0, P: 1 },
    },
  },
  term: {
    K: 0,
    S: 0,
    P: 1,
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

const AtomLS1FormElectronicForm = ({
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
    setValue,
    formState: { errors },
  } = useFormContext();
  const scheme = watch(`set.states.${label}.electronic.${eindex}.scheme`);
  return (
    <>
      <div>
        <Controller
          control={control}
          name={`set.states.${label}.electronic.${eindex}.scheme`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Radio.Group
              label="Scheme"
              onBlur={onBlur}
              onChange={(v) => {
                onChange(v);
                if (v === "LS1") {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialValue4AtomLS1()
                  );
                } else {
                  setValue(
                    `set.states.${label}.electronic.${eindex}`,
                    initialSimpleElectronic()
                  );
                }
              }}
              value={value}
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.scheme`
              )}
            >
              <Radio value="" label="Simple" />
              <Radio value="LS1" label="LS1" />
            </Radio.Group>
          )}
        />
      </div>
      {scheme === "LS1" ? (
        <>
          <div>
            <fieldset>
              <legend>Core</legend>
              <input
                {...register(
                  `set.states.${label}.electronic.${eindex}.config.core.scheme`,
                  {
                    value: "LS",
                  }
                )}
                type="hidden"
              />
              <LSTermConfigForm
                label={label}
                eindex={eindex}
                side="core"
                isLS1={true}
              />
            </fieldset>
            <fieldset>
              <legend>Excited</legend>
              <input
                {...register(
                  `set.states.${label}.electronic.${eindex}.config.excited.scheme`,
                  {
                    value: "LS",
                  }
                )}
                type="hidden"
              />
              <LSTermConfigForm
                label={label}
                eindex={eindex}
                side="excited"
                isLS1={true}
              />
            </fieldset>
          </div>
          <div>
            <h4>Term</h4>
            <Group>
              <div>
                <TextInput
                  label="L"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.term.L`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.term.L`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
              <div>
                <TextInput
                  label="K"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.term.K`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.term.K`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
              <div>
                <TextInput
                  label="S"
                  error={errorMsg(
                    errors,
                    `set.states.${label}.electronic.${eindex}.term.S`
                  )}
                  {...register(
                    `set.states.${label}.electronic.${eindex}.term.S`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
              <div>
                <Controller
                  control={control}
                  name={`set.states.${label}.electronic.${eindex}.term.P`}
                  render={({ field: { onBlur, onChange, value } }) => (
                    <Radio.Group
                      label="P"
                      onBlur={onBlur}
                      onChange={(v) => onChange(parseInt(v))}
                      value={value === undefined ? 1 : value.toString()}
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
                  {...register(
                    `set.states.${label}.electronic.${eindex}.term.J`,
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>
            </Group>
          </div>
        </>
      ) : (
        <TextInput
          label="e"
          error={errorMsg(errors, `set.states.${label}.electronic.${eindex}.e`)}
          {...register(`set.states.${label}.electronic.${eindex}.e`)}
        />
      )}
    </>
  );
};

const initialValue4AtomLS1 = () => ({
  scheme: "LS1",
  config: {
    core: {
      scheme: "LS",
      config: [{ n: 0, l: 0, occupance: 0 }],
      term: { L: 0, S: 0, P: 1 },
    },
    excited: {
      scheme: "LS",
      config: [{ n: 0, l: 0, occupance: 0 }],
      term: { L: 0, S: 0, P: 1 },
    },
  },
  term: {
    L: 0,
    K: 0,
    S: 0,
    P: 1,
    J: 0,
  },
});
const AtomLS1Form = ({ label }: { label: string }) => {
  return (
    <ElectronicArray
      label={label}
      initialValue={initialValue4AtomLS1()}
      item={(label, eindex) => (
        <AtomLS1FormElectronicForm label={label} eindex={eindex} />
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
    control,
    formState: { errors },
  } = useFormContext<FieldValues>();
  return (
    <div>
      <Controller
        control={control}
        name={`set.states.${label}.electronic.${eindex}.parity`}
        render={({ field: { onBlur, onChange, value } }) => (
          <Radio.Group
            label="Reflection"
            onBlur={onBlur}
            onChange={onChange}
            value={value as string}
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.parity`
            )}
          >
            <Radio value="g" label="Gerade" />
            <Radio value="u" label="Ungerade" />
          </Radio.Group>
        )}
      />
    </div>
  );
};

// TODO Use SimpleVibrational here, as it is almost same as this component
const LinearTriatomVibrationalFieldItem = ({
  label,
  eindex,
  vindex,
}: {
  label: string;
  eindex: number;
  vindex: number;
}) => {
  const { watch, setValue } = useFormContext();
  const v = watch(
    `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`
  );
  const initialScheme = typeof v === "string" ? "simple" : "detailed";
  const [scheme, setScheme] = useState<IScheme>(initialScheme);
  return (
    <div>
      <Radio.Group
        label="Scheme"
        value={scheme}
        onChange={(v: IScheme) => {
          setScheme(v);
          if (v === "simple") {
            setValue(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}`,
              { v: "" }
            );
          } else {
            setValue(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}`,
              { v: [0, 0, 0], rotational: [] }
            );
          }
        }}
      >
        <Radio value="simple" label="Simple" />
        <Radio value="detailed" label="Detailed" />
      </Radio.Group>
      {scheme === "simple" ? (
        <VibrationalSimpleFieldItem
          label={label}
          eindex={eindex}
          vindex={vindex}
        />
      ) : (
        <LinearTriatomVibrationalDetailedFieldItem
          label={label}
          eindex={eindex}
          vindex={vindex}
        />
      )}
    </div>
  );
};

const VibrationalSimpleFieldItem = ({
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
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={`set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`}
      render={({ field: { onBlur, onChange, value } }) => (
        <TextInput
          label="v"
          style={{ width: "4rem" }}
          onChange={onChange}
          value={value}
          onBlur={onBlur}
          error={errorMsg(
            errors,
            `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`
          )}
        />
      )}
    />
  );
};

const LinearTriatomRotationalArray = ({
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
    <fieldset>
      <legend>Rotational</legend>
      <ol>
        {array.fields.map((field, index) => (
          <ArrayItem
            removeTitle="Remove rotational part"
            key={index}
            onRemove={() => array.remove(index)}
          >
            <TextInput
              label="J"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`
              )}
              {...register(
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`
                // TODO J is always string, while it should also be able to be a number
                // should add 'simple' | 'detailed' aka 'string' | 'number' radio group
              )}
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
    </fieldset>
  );
};

const LinearTriatomVibrationalDetailedFieldItem = ({
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
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <label>v</label>
      <Group>
        <div>
          <TextInput
            title="v0"
            style={{ width: "4rem" }}
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.0`
            )}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.0`,
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
        <div>
          <TextInput
            title="v1"
            style={{ width: "4rem" }}
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.1`
            )}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.1`,
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
        <div>
          <TextInput
            title="v2"
            style={{ width: "4rem" }}
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.2`
            )}
            {...register(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v.2`,
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
      </Group>
      <LinearTriatomRotationalArray
        label={label}
        eindex={eindex}
        vindex={vindex}
      />
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
          eindex={eindex}
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
    control,
    formState: { errors },
  } = useFormContext<FieldValues>();
  return (
    <>
      <div>
        <TextInput
          label="e"
          error={errorMsg(errors, `set.states.${label}.electronic.${eindex}.e`)}
          {...register(`set.states.${label}.electronic.${eindex}.e`)}
        />
      </div>
      <div>
        <TextInput
          label="Lambda"
          error={errorMsg(
            errors,
            `set.states.${label}.electronic.${eindex}.Lambda`
          )}
          {...register(`set.states.${label}.electronic.${eindex}.Lambda`, {
            valueAsNumber: true,
          })}
        />
      </div>
      <div>
        <TextInput
          label="S"
          error={errorMsg(errors, `set.states.${label}.electronic.${eindex}.S`)}
          {...register(`set.states.${label}.electronic.${eindex}.S`, {
            valueAsNumber: true,
          })}
        />
      </div>
      <div>
        <Controller
          control={control}
          name={`set.states.${label}.electronic.${eindex}.reflection`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Radio.Group
              label="Reflection"
              onBlur={onBlur}
              onChange={onChange}
              value={value as string}
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.reflection`
              )}
            >
              <Radio value="-" label="&minus;" />
              <Radio value="+" label="+" />
            </Radio.Group>
          )}
        />
      </div>
    </>
  );
};

const ElectronicArray = ({
  label,
  item,
  initialValue,
}: {
  label: string;
  item: (label: string, eindex: number) => ReactNode;
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
  children: ReactNode;
}) => {
  return (
    <li>
      <fieldset>
        {children}
        <Button type="button" title={removeTitle} onClick={onRemove}>
          &minus;
        </Button>
      </fieldset>
    </li>
  );
};

const LinearTriatomInversionCenterForm = ({ label }: { label: string }) => {
  const initialValue = { e: "X", Lambda: 0, S: 0, parity: "g" };
  return (
    <ElectronicArray
      label={label}
      initialValue={initialValue}
      item={(label, eindex) => (
        <SimpleElectronic
          label={label}
          eindex={eindex}
          initialDetailedValue={initialValue}
        >
          <Group>
            <LinearElectronicForm label={label} eindex={eindex} />
            <MolecularParityField label={label} eindex={eindex} />
          </Group>
          <LinearTriatomVibrationalField label={label} eindex={eindex} />
        </SimpleElectronic>
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
  item: (label: string, eindex: number, vindex: number) => ReactNode;
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
    <fieldset>
      <legend>Vibrational</legend>
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
    </fieldset>
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
    <fieldset>
      <legend>Rotational</legend>
      <ol>
        {array.fields.map((field, index) => (
          <ArrayItem
            removeTitle="Remove rotational part"
            key={index}
            onRemove={() => array.remove(index)}
          >
            <TextInput
              label="J"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`
              )}
              {...register(
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.rotational.${index}.J`
                // TODO J is always string, while it should also be able to be a number
                // should add 'simple' | 'detailed' aka 'string' | 'number' radio group
              )}
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
    </fieldset>
  );
};

type IScheme = "simple" | "detailed";

const SimpleVibrational = ({
  label,
  eindex,
  vindex,
  children,
}: {
  label: string;
  eindex: number;
  vindex: number;
  children: ReactNode;
}) => {
  const { getValues, setValue } = useFormContext();
  const av = getValues(
    `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`
  );
  const initialScheme =
    typeof av === "string" || Number.isNaN(av) ? "simple" : "detailed";
  const [scheme, setScheme] = useState<IScheme>(initialScheme);
  return (
    <div>
      <Radio.Group
        label="Scheme"
        value={scheme}
        onChange={(v: IScheme) => {
          setScheme(v);
          if (v === "simple") {
            setValue(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}`,
              { v: "" }
            );
          } else {
            setValue(
              `set.states.${label}.electronic.${eindex}.vibrational.${vindex}`,
              { v: 0, rotational: [] }
            );
          }
        }}
      >
        <Radio value="simple" label="Simple" />
        <Radio value="detailed" label="Detailed" />
      </Radio.Group>
      {scheme === "simple" ? (
        <VibrationalSimpleFieldItem
          label={label}
          eindex={eindex}
          vindex={vindex}
        />
      ) : (
        children
      )}
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
        <SimpleVibrational
          key={`${label}-${eindex}-${vindex}`}
          label={label}
          eindex={eindex}
          vindex={vindex}
        >
          <>
            <TextInput
              label="v"
              error={errorMsg(
                errors,
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`
              )}
              {...register(
                `set.states.${label}.electronic.${eindex}.vibrational.${vindex}.v`,
                {
                  valueAsNumber: true,
                }
              )}
            />
            <RotationalArray label={label} eindex={eindex} vindex={vindex} />
          </>
        </SimpleVibrational>
      )}
    />
  );
};

const SimpleElectronic = ({
  label,
  eindex,
  initialDetailedValue,
  children,
}: {
  label: string;
  eindex: number;
  initialDetailedValue: any; // TODO add generic type
  children: ReactNode;
}) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const electronicValue = useWatch({
    control,
    name: `set.states.${label}.electronic.${eindex}`,
  });
  const initialScheme =
    "e" in electronicValue && Object.keys(electronicValue).length <= 1
      ? "simple"
      : "detailed";
  const [scheme, setScheme] = useState<IScheme>(initialScheme);
  return (
    <>
      <Radio.Group
        label="Scheme"
        value={scheme}
        onChange={(v: IScheme) => {
          setScheme(v);
          if (v === "simple") {
            setValue(
              `set.states.${label}.electronic.${eindex}`,
              initialSimpleElectronic()
            );
          } else {
            setValue(
              `set.states.${label}.electronic.${eindex}`,
              initialDetailedValue
            );
          }
        }}
      >
        <Radio value="simple" label="Simple" />
        <Radio value="detailed" label="Detailed" />
      </Radio.Group>
      {scheme === "simple" ? (
        <div>
          <TextInput
            label="e"
            error={errorMsg(
              errors,
              `set.states.${label}.electronic.${eindex}.e`
            )}
            {...register(`set.states.${label}.electronic.${eindex}.e`)}
          />
        </div>
      ) : (
        children
      )}
    </>
  );
};

const HeteronuclearDiatomForm = ({ label }: { label: string }) => {
  const initialValue = { e: "", Lambda: 0, S: 0 };
  return (
    <ElectronicArray
      label={label}
      initialValue={initialValue}
      item={(label, eindex) => (
        <SimpleElectronic
          label={label}
          eindex={eindex}
          initialDetailedValue={initialValue}
        >
          <Group>
            <LinearElectronicForm label={label} eindex={eindex} />
          </Group>
          <DiatomicVibrationalForm label={label} eindex={eindex} />
        </SimpleElectronic>
      )}
    />
  );
};

const HomonuclearDiatomForm = ({ label }: { label: string }) => {
  const initialValue = { e: "", Lambda: 0, S: 0, parity: "g" };
  return (
    <ElectronicArray
      label={label}
      initialValue={initialValue}
      item={(label, eindex) => (
        <SimpleElectronic
          label={label}
          eindex={eindex}
          initialDetailedValue={initialValue}
        >
          <Group>
            <LinearElectronicForm label={label} eindex={eindex} />
            <MolecularParityField label={label} eindex={eindex} />
          </Group>
          <DiatomicVibrationalForm label={label} eindex={eindex} />
        </SimpleElectronic>
      )}
    />
  );
};

const StateForm = ({
  label,
  onRemove,
  expanded,
}: {
  label: string;
  onRemove: () => void;
  expanded: boolean;
}) => {
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();
  const state = useWatch({ name: `set.states.${label}` });
  // TODO label update based on whole state tricky as existing label (a key in states object) needs to be removed
  const latex = useMemo(() => {
    try {
      return getStateLatex(state);
    } catch (error) {
      // incomplete state, ignore error and dont update id
      return "";
    }
  }, [state]);

  return (
    <Accordion.Item key={label} value={label}>
      <Accordion.Control>
        {label}: <InlineMath>{latex}</InlineMath>
      </Accordion.Control>
      <Accordion.Panel>
        {expanded && (
          <>
            <div>
              <Controller
                control={control}
                name={`set.states.${label}.type`}
                render={({ field: { onBlur, onChange, value } }) => (
                  <Radio.Group
                    label="Type"
                    onBlur={onBlur}
                    onChange={(v) => {
                      onChange(v);
                      if (v === "") {
                        // unset .type and .electronic
                        const { particle, charge } = getValues(
                          `set.states.${label}`
                        );
                        setValue(`set.states.${label}`, {
                          particle,
                          charge,
                        });
                      } else {
                        setValue(`set.states.${label}.electronic`, []);
                      }
                    }}
                    value={value === undefined ? "" : value}
                    error={errorMsg(errors, `set.states.${label}.type`)}
                  >
                    <Radio value="" label="Simple particle" />
                    <Radio value="AtomLS" label="Atom LS" />
                    <Radio value="AtomLS1" label="Atom LS1" />
                    <Radio value="AtomJ1L2" label="Atom J1L2" />
                    <Radio
                      value="HeteronuclearDiatom"
                      label="Heteronuclear Diatom"
                    />
                    <Radio
                      value="HomonuclearDiatom"
                      label="Homonuclear Diatom"
                    />
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
            {state.type === "AtomLS1" && <AtomLS1Form label={label} />}
            <Button type="button" title="Remove state" onClick={onRemove}>
              &minus;
            </Button>
            <hr />
          </>
        )}
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
  async function onSubmit() {
    // TODO resolving doi can take long time and timeout, should notify user when fetch fails
    // TODO use mailto param to improve speed, see https://github.com/CrossRef/rest-api-doc#good-manners--more-reliable-service
    const refs = await Cite.inputAsync(doi, {
      forceType: "@doi/id",
    });
    const ref = refs[0];
    // TODO handle fetch/parse errors
    const label = getReferenceLabel(ref);
    onAdd(label, ref);
    setOpen(false);
  }
  return (
    <div>
      <Button type="button" variant="light" onClick={() => setOpen(true)}>
        Import from DOI
      </Button>
      <Modal
        size="auto"
        centered
        opened={open}
        onClose={() => setOpen(false)}
        title="Import reference based on DOI"
      >
        <TextInput
          value={doi}
          style={{ width: "16rem" }}
          onChange={(e) => setDoi(e.target.value)}
          placeholder="Enter DOI like 10.5284/1015681"
          // DOI pattern from https://www.crossref.org/blog/dois-and-matching-regular-expressions/
          // Does not work for `10.3390/atoms9010016`
          // pattern="^10.\d{4,9}/[-._;()/:A-Z0-9]+$"
        />
        <Group mt="xl">
          <Button onClick={onSubmit}>Import</Button>
        </Group>
      </Modal>
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
  async function onSubmit() {
    // TODO resolving doi can take long time and timeout, should notify user when fetch fails
    const refs = await Cite.inputAsync(bibtex, {
      forceType: "@bibtex/text",
    });
    const labelRefs = Object.fromEntries(
      refs.map((r) => {
        const label = getReferenceLabel(r);
        return [label, r];
      })
    );

    onAdd(labelRefs);
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
      <Modal
        size="auto"
        centered
        opened={open}
        onClose={() => setOpen(false)}
        title="Import references based on BibTeX"
      >
        <textarea
          value={bibtex}
          style={{ width: "60rem", height: "20rem" }}
          placeholder={placeholder}
          onChange={(e) => setBibtex(e.target.value)}
        />
        <Button.Group mt="xl">
          <Button onClick={onSubmit}>Import</Button>
        </Button.Group>
      </Modal>
    </div>
  );
};

const JSONTabPanel = ({ set }: { set: CrossSectionSetRaw }) => {
  const jsonString = useMemo(() => {
    return JSON.stringify(pruneSet(set), undefined, 2);
  }, [set]);
  // TODO add upload JSON button?
  // TODO make JSON editable? Would replace raw edit/add pages
  return (
    <pre>
      {/* TODO use code highlight with https://mantine.dev/others/prism/ */}
      {jsonString}
    </pre>
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

const myResolver = () => {
  const fn = ajvResolver(schema4form as any, { allowUnionTypes: true });
  return async (values: FieldValues, context: any, options: any) => {
    const newValues = pruneFieldValues(values);
    return fn(newValues, context, options);
  };
};

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
    resolver: myResolver(),
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
    const pruned = pruneFieldValues(data);
    onSubmit(pruned.set, pruned.commitMessage);
  };

  // States
  const [expandedStates, setExpandedStates] = useState<string[]>([]);
  const states = useWatch({ name: "set.states", control });
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
    setExpandedStates((expanded) => [...expanded, newLabel]);
  };
  const addStates = (newStates: StateDict) => {
    const newNewStates = {
      ...states,
      ...newStates,
    };
    setStates(newNewStates as any);
    setExpandedStates((expanded) => [...expanded, ...Object.keys(newStates)]);
  };
  const removeState = (label: string) => {
    const { [label]: _todrop, ...newStates } = states;
    setExpandedStates((expanded) => expanded.filter((l) => l !== label));
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
  const [expandedProcesses, setExpandedProcesses] = useState<string[]>([]);
  const processesField = useFieldArray({
    control,
    name: "set.processes",
  });
  const addProcesses = (processes2add: PickedCrossSections) => {
    // copy references belonging to picked cross sections to current set.
    // TODO added reference should not exist before and be unique
    const newReferences = Object.fromEntries(
      processes2add
        .flatMap((p) => p.reference)
        .map((r) => {
          return [getReferenceLabel(r), r];
        })
    );
    addReferences(newReferences);

    // copy states belonging to picked cross sections to current set
    // TODO added states should not exist before and be unique
    const newStates = Object.fromEntries(
      processes2add
        .flatMap((p) => {
          return [
            ...p.reaction.lhs.map((e) => e.state),
            ...p.reaction.rhs.map((e) => e.state),
          ];
        })
        .map((s) => {
          return [getStateId(s), s];
        })
    );
    addStates(newStates);

    // copy cross sections to current set
    // processesField.append(processes2add);
    // TODO added processes should not exist before and be unique
    const newProcesses = processes2add.map(flattenCrossSection);
    const currentMaxIndex = processesField.fields.length;
    processesField.append(newProcesses);
    setExpandedProcesses((expanded) => [
      ...expanded,
      ...newProcesses.map((d, i) => (i + currentMaxIndex).toString()),
    ]);
  };

  const [activeTab, setActiveTab] = useState<string | null>("general");
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onLocalSubmit, (err) => {
          // TODO report error back to user
          console.error(err);
          console.info(getValues("set"));
        })}
      >
        <Tabs
          defaultValue="general"
          value={activeTab}
          onTabChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="states">States</Tabs.Tab>
            <Tabs.Tab value="references">References</Tabs.Tab>
            <Tabs.Tab value="processes">Processes</Tabs.Tab>
            <Tabs.Tab value="json">JSON</Tabs.Tab>
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
            <Space h="sm" />
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
            <Accordion
              multiple
              value={expandedStates}
              onChange={setExpandedStates}
            >
              {Object.keys(states).map((label) => (
                <StateForm
                  key={label}
                  label={label}
                  expanded={expandedStates.includes(label)}
                  onRemove={() => removeState(label)}
                />
              ))}
            </Accordion>
            <Button.Group>
              <Button
                type="button"
                title="Add a state"
                aria-label="Add a state"
                onClick={addState}
              >
                +
              </Button>
              {/* TODO exclude states from picker already present on this form */}
              <StatePickerModal onSubmit={addStates} />
              {/* TODO add button to clone a state? */}
              {/* TODO add buttons to collapse or expand all accordion items? */}
            </Button.Group>
            <ErrorMessage errors={errors} name="set.states" />
          </Tabs.Panel>
          <Tabs.Panel value="references">
            {activeTab === "references" && (
              <>
                <ul>
                  {Object.keys(references).map((label) => (
                    <ReferenceForm
                      key={label}
                      label={label}
                      onRemove={() => removeReference(label)}
                    />
                  ))}
                </ul>
                <Button.Group>
                  <ImportDOIButton onAdd={addReference} />
                  <ImportBibTeXDOIButton onAdd={addReferences} />
                </Button.Group>
                <ErrorMessage errors={errors} name="set.references" />
              </>
            )}
          </Tabs.Panel>
          <Tabs.Panel value="processes">
            <Accordion
              multiple
              value={expandedProcesses}
              onChange={setExpandedProcesses}
            >
              {processesField.fields.map((field, index) => (
                <Accordion.Item key={field.id} value={index.toString()}>
                  <Accordion.Control>
                    <ReactionSummary
                      {...mapStateToReaction(states, field.reaction)}
                    />
                  </Accordion.Control>
                  <Accordion.Panel>
                    {expandedProcesses.includes(index.toString()) && (
                      <ProcessForm
                        index={index}
                        onRemove={() => {
                          setExpandedProcesses((expanded) =>
                            expanded.filter((e) => e !== index.toString())
                          );
                          processesField.remove(index);
                        }}
                      />
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
            <Button.Group>
              <Button
                type="button"
                title="Add process"
                aria-label="Add process"
                onClick={() => {
                  processesField.append(initialProcess());
                  setExpandedProcesses((expanded) => [
                    ...expanded,
                    processesField.fields.length.toString(),
                  ]);
                }}
              >
                +
              </Button>
              {/* TODO exclude processes from picker already present on this form */}
              <CrossSectionPickerModal onSubmit={addProcesses} />
              {/* TODO add button to clone a process? */}
              {/* TODO add buttons to collapse or expand all accordion items? */}
            </Button.Group>
            <ErrorMessage errors={errors} name="set.processes" />
          </Tabs.Panel>
          <Tabs.Panel value="json">
            {activeTab === "json" && <JSONTabPanel set={getValues("set")} />}
          </Tabs.Panel>
        </Tabs>
        <div>
          <Space h="sm" />
          <TextInput
            placeholder="Optionally describe which changes have been made."
            error={errorMsg(errors, "commitMessage")}
            {...register("commitMessage")}
          />
          <Space h="sm" />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  );
};

function pruneFieldValues(values: FieldValues) {
  return { commitMessage: values.commitMessage, set: pruneSet(values.set) };
}

function pruneSet(set: CrossSectionSetRaw): CrossSectionSetRaw {
  // TODO get rid of keys which have undefined value in recursive way
  // for now just set.states
  const newSet = { ...set };
  newSet.states = Object.fromEntries(
    Object.entries(newSet.states).map(([k, v]) => {
      const newState = pruneState(v);
      return [k, newState];
    })
  );
  return newSet;
}

function pruneState(state: InState<AnyAtomJSON | AnyMoleculeJSON>) {
  const newState = { ...state }; // TODO make better clone
  if (newState.electronic) {
    newState.electronic.forEach((e: any) => {
      if (e.scheme === "") {
        delete e.scheme;
      }
      delete e.latex;
      if (Array.isArray(e.vibrational)) {
        if (e.vibrational.length > 0) {
          e.vibrational.forEach((v: any) => {
            delete v.summary;
            delete v.latex;
            if (Array.isArray(v.rotational)) {
              if (v.rotational.length > 0) {
                v.rotational.forEach((r: Record<string, any>) => {
                  delete r.summary;
                  delete r.latex;
                });
              } else {
                delete v.rotational;
              }
            }
          });
        } else {
          delete e.vibrational;
        }
      }
    });
  }
  // TODO use type|schema where id is allowed
  delete (newState as any).id;
  delete (newState as any).latex;
  if (newState.type === undefined) {
    // Simple particle does not have type
    delete newState.type;
  }
  return newState;
}

function initialProcess(): CrossSectionSetRaw["processes"][0] {
  return {
    reaction: { lhs: [], rhs: [], reversible: false, type_tags: [] },
    threshold: 0,
    type: Storage.LUT,
    labels: ["Energy", "CrossSection"],
    units: ["eV", "m^2"],
    data: [],
  };
}

// TODO move utility functions to own file and reuse else where

function mapStateToReaction(
  states: Dict<InState<AnyAtomJSON | AnyMoleculeJSON>>,
  reaction: Reaction<string>
): Reaction<State> {
  const newReaction = {
    ...reaction,
    lhs: reaction.lhs
      .filter((e) => e.state !== "")
      .map((e) => {
        // TODO parse_state adds id and summary props, should not be needed here
        const state = parseState(states[e.state] as any);
        return { count: e.count, state };
      }),
    rhs: reaction.rhs
      .filter((e) => e.state !== "")
      .map((e) => {
        // TODO parse_state adds id and summary props, should not be needed here
        const state = parseState(states[e.state] as any);
        return { count: e.count, state };
      }),
  };
  return newReaction as Reaction<State>;
}

function flattenCrossSection(
  cs: CrossSectionItem
): CrossSectionSetRaw["processes"][0] {
  // drop some keys from cs as they are not required for the set
  // in which this cs will be placed in
  const { isPartOf, organization, versionInfo, ...rest } = cs;
  return {
    ...rest,
    reference: cs.reference.map((r) => getReferenceLabel(r)),
    reaction: {
      ...cs.reaction,
      lhs: cs.reaction.lhs.map((e) => ({
        count: e.count,
        state: getStateId(e.state),
      })),
      rhs: cs.reaction.rhs.map((e) => ({
        count: e.count,
        state: getStateId(e.state),
      })),
    },
  };
}

function hashState(state: InState<any>): [string, string] {
  const parsed = parseState(state as InState<any>);
  // TODO also calculate latex string
  return [parsed.id, parsed.latex];
}

function getStateId(state: InState<any>): string {
  return hashState(state)[0];
}

function getStateLatex(state: InState<any>): string {
  return hashState(state)[1];
}
