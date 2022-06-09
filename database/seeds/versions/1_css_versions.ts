import "dotenv/config";
import {
  byOwnerAndId,
  historyOfSet,
  insert_input_set,
  publish,
  updateSet,
} from "../../src/css/queries";

export default async function () {
  // TODO add set which has sections that have published and draft statuses
  const keycss1 = await insert_input_set(
    {
      complete: true,
      contributor: "Some organization",
      name: "Some versioned name",
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

  const css2 = await byOwnerAndId("somename@example.com", keycss1);

  css2!.description = "Some description 1st edit";

  const keycss2 = await updateSet(keycss1, css2!, "First edit");

  await publish(keycss2);

  const css3 = await byOwnerAndId("somename@example.com", keycss2);

  css3!.description = "Some description 2nd edit";

  const keycss3 = await updateSet(keycss2, css3!, "Second edit");

  await publish(keycss3);

  const css4 = await byOwnerAndId("somename@example.com", keycss3);

  css4!.description = "Some description 3rd edit";

  const keycss4 = await updateSet(keycss3, css4!, "Third edit");

  const history = await historyOfSet(keycss4);

  console.log("Created versioned CrossSectionSet: ", history);
}
