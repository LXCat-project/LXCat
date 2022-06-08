import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import { Role, User } from "../../auth/schema";
import { useState } from "react";
import {
  listOrganizations,
  listUsers,
  OrganizationFromDB,
  UserFromDB,
} from "../../auth/queries";
import { mustBeAdmin } from "../../auth/middleware";

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
    organizationKey?: string
  ) => {
    if (organizationKey) {
      const url = `/api/users/${user._key}/organizations/${organizationKey}`;
      const res = await fetch(url, {
        method: "POST",
      });
      const newOrganization = await res.json();
      const newUser = { ...user, organization: newOrganization };
      const newUsers = users.map((u) => (u.email === user.email ? newUser : u));
      setUsers(newUsers);
    } else {
      const url = `/api/users/${user._key}/organizations`;
      await fetch(url, {
        method: "DELETE",
      });
      const { organization, ...newUser } = user;
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
            const memberOf = organizations.find(
              (o) => u.organization === o.name
            );
            return (
              <tr key={u.email}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {Role.options.map((r) => (
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
                  <select
                    onChange={(event) =>
                      updateOrganization(u, event.target.value)
                    }
                    value={memberOf?._key}
                  >
                    <option></option>
                    {organizations.map((o) => (
                      <option key={o._key} value={o._key}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    title="Delete"
                    onClick={() => deleteUser(u)}
                    disabled={me.email === u.email}
                  >
                    X
                  </button>
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
