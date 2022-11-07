// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import { Role, User } from "@lxcat/database/dist/auth/schema";
import { useState } from "react";
import {
  listOrganizations,
  listUsers,
  OrganizationFromDB,
  UserFromDB,
} from "@lxcat/database/dist/auth/queries";
import { mustBeAdmin } from "../../auth/middleware";
import { Button, MultiSelect } from "@mantine/core";

interface Props {
  users: UserFromDB[];
  organizations: OrganizationFromDB[];
  me: User;
}

const AdminUsers: NextPage<Props> = ({
  me,
  users: initalUsers,
  organizations,
}) => {
  const [users, setUsers] = useState(initalUsers);
  // TODO move functions that to API endpoints to client.ts
  const updateRole = async (user: UserFromDB, role: Role) => {
    const url = `/api/users/${user._key}/roles/${role}`;
    const res = await fetch(url, {
      method: "POST",
    });
    const newRoles = await res.json();
    const newUser = { ...user, roles: newRoles };
    const newUsers = users.map((u) => (u.email === user.email ? newUser : u));
    setUsers(newUsers);
  };
  const deleteUser = async (user: UserFromDB) => {
    const url = `/api/users/${user._key}`;
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (res.ok) {
      const newUsers = users.filter((u) => u.email === user.email);
      setUsers(newUsers);
    }
  };
  const updateOrganization = async (
    user: UserFromDB,
    organizationKeys: string[]
  ) => {
    const url = `/api/users/${user._key}/organizations`;
    const body = JSON.stringify(organizationKeys);
    const headers = {
      "Content-Type": "application/json",
    };
    const res = await fetch(url, {
      method: "POST",
      body,
      headers,
    });
    if (res.ok) {
      const organizationNames = organizationKeys.map((m) => {
        const o = organizations.find((o) => o._key === m);
        return o?.name ?? "";
      });
      const newUser = { ...user, organizations: organizationNames };
      const newUsers = users.map((u) => (u.email === user.email ? newUser : u));
      setUsers(newUsers);
    }
  };
  return (
    <Layout>
      <h1>Administrate users</h1>

      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Organization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const memberOf = u.organizations.map((m) => {
              const o = organizations.find((o) => o.name === m);
              return o?._key ?? "";
            });
            return (
              <tr key={u.email}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {Role.options
                    .filter((r) => r !== "download")
                    .map((r) => (
                      <label key={r}>
                        {r}
                        <input
                          type="checkbox"
                          checked={u.roles?.includes(r)}
                          onChange={() => updateRole(u, r)}
                        />
                      </label>
                    ))}
                </td>
                <td>
                  <MultiSelect
                    aria-label={`Memberships of ${u.email}`}
                    onChange={(selection) => updateOrganization(u, selection)}
                    value={memberOf}
                    data={organizations.map((o) => ({
                      value: o._key,
                      label: o.name,
                    }))}
                  />
                </td>
                <td>
                  <Button
                    title="Delete"
                    onClick={() => deleteUser(u)}
                    disabled={me.email === u.email}
                  >
                    X
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Layout>
  );
};

export default AdminUsers;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const me = await mustBeAdmin(context);
  const users = await listUsers();
  const organizations = await listOrganizations();
  return {
    props: {
      users,
      me,
      organizations,
    },
  };
};
