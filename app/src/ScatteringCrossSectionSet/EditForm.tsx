import { useForm, useFieldArray, UseFormRegister } from "react-hook-form";
import { CrossSectionSetInputOwned } from "@lxcat/database/dist/css/queries/author_read";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { OrganizationFromDB } from "@lxcat/database/dist/auth/queries";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

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

const ProcessForm = ({index, onRemove, register}: {index: number, onRemove: () => void, register: UseFormRegister<FieldValues>}) => {
    return (
        <div>
            <div>
                <label>
                    Labels
                    <input  {...register(`set.processes.${index}.labels.0`, {required: true})}/>
                    <input  {...register(`set.processes.${index}.labels.1`, {required: true})}/>
                </label>
            </div>
            <div>
                <label>
                    Units
                    <input  {...register(`set.processes.${index}.units.0`, {required: true})}/>
                    <input  {...register(`set.processes.${index}.units.1`, {required: true})}/>
                </label>
            </div>

            <div>
              <label>
                Threshold
                <input
                  type="number"
                  {...register(`set.processes.${index}.threshold`, {required: true})}
                />
              </label>
            </div>
            <div>
              <label>
              Mass ratio
                <input
                  type="number"
                  {...register(`set.processes.${index}.parameters.mass_ratio`)}
                />
              </label>
            </div>
            <div>
              <label>
              Statistical weight ratio
                <input
                  type="number"
                  {...register(`set.processes.${index}.parameters.statistical_weight_ratio`)}
                />
              </label>
            </div>
            <button title="Remove" onClick={onRemove}>
              X
            </button>
          </div>
    )
}

export const EditForm = ({
  set,
  commitMessage,
  onSubmit,
  organizations,
}: Props) => {
  const {
    control,
    register,
    handleSubmit,
  } = useForm<FieldValues>({
    defaultValues: {
      set,
      commitMessage,
    },
  });
  const processesField = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "set.processes", // unique name for your Field Array
  });
  const onLocalSubmit = (data: FieldValues) => {
    onSubmit(data.set, data.commitMessage);
  };
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
      </fieldset>
      <fieldset>
        <legend>References</legend>
      </fieldset>
      <fieldset>
        <legend>Processes</legend>
        {processesField.fields.map((field, index) => (
            <ProcessForm
                index={index}
                register={register}
                key={field.id}
                onRemove={() => processesField.remove(index)}
            />
        ))}
        <button onClick={() => processesField.append(initialProcess())}>
          Append
        </button>
      </fieldset>
      <label>
        Message
        <input {...register("commitMessage")} />
      </label>
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
