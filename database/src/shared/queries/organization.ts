import { upsert_document } from "../queries";

// TODO in rest of code replace `upsert_document("Organization",...` with this function
export async function upsertOrganization(name: string) {
  const organization = await upsert_document("Organization", {
    name,
  });
  return organization.id;
}
