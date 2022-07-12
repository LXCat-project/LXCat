import {
  listOrganizations,
  OrganizationFromDB,
} from "@lxcat/database/dist/auth/queries";
import { GetServerSideProps, NextPage } from "next";
import { useState } from "react";
import { mustBeAdmin } from "../../auth/middleware";
import { Layout } from "../../shared/Layout";

interface Props {
  organizations: OrganizationFromDB[];
}

const AdminOrganizations: NextPage<Props> = ({ organizations }) => {
  const [orgs, setOrgs] = useState(organizations);
  const [newOrgName, setNewOrgName] = useState("");

  const addOrganization = async (e: any) => {
    e.preventDefault();
    const url = "/api/organizations";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newOrgName }),
    });
    if (res.ok) {
      const newOrg = (await res.json()) as OrganizationFromDB;
      setOrgs((orgs) => {
        return [...orgs, newOrg];
      });
      setNewOrgName("");
    }
    // TODO handle error like duplicate
  };

  return (
    <Layout>
      <h2>Administrate organizations</h2>
      <ul>
        {orgs.map((o) => (
          <li key={o._key}>{o.name}</li>
        ))}
      </ul>
      <form onSubmit={addOrganization}>
        <input
          type="text"
          value={newOrgName}
          required
          minLength={1}
          onChange={(e) => setNewOrgName(e.currentTarget.value)}
          placeholder="Type new organization name"
        />
        <button type="submit">Add</button>
      </form>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  await mustBeAdmin(context);
  const organizations = await listOrganizations();
  return {
    props: {
      organizations,
    },
  };
};

export default AdminOrganizations;
