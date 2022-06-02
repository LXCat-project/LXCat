import "dotenv/config";
import {
  deleteSet,
  insert_input_set,
  publish,
} from "../../../app/src/ScatteringCrossSectionSet/queries";


export default async function () {
  const keycss1 = await insert_input_set(
    {
      complete: true,
      contributor: "Some organization",
      name: "Some retracted name",
      description: "Some description",
      references: {},
      states: {},
      processes: [],
    },
    "draft",
    "1",
    "Initial version"
  );

  await publish(keycss1);

  await deleteSet(keycss1, "I forgot to put in cross sections");

  console.log(`Created retracted set with id ${keycss1}`)
}
