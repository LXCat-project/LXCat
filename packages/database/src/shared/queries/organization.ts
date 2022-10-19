import { upsert_document } from "../queries";

export async function upsertOrganization(name: string) {
  const organization = await upsert_document("Organization", {
    name,
  });
  return organization.id;
}
