import type { GetServerSideProps, NextPage } from 'next'
import { Layout } from '../../shared/Layout'
import { Role, User } from '../../auth/schema';
import { useState } from 'react'
import { getServerSession } from 'next-auth';
import { options } from '../../auth/options';
import { listUsers } from '../../auth/db';

interface Props {
  users: User[]
  me: User
}

const Admin: NextPage<Props> = ({ me, users: initalUsers }) => {
  const [users, setUsers] = useState(initalUsers)
  const updateRole = async (user: User, role: Role) => {
    const url = `/api/users/${(user as any)._key}/${role}/toggle`
    const res = await fetch(url, {
      method: 'POST'
    })
    const newRoles = await res.json()
    const newUser = { ...user, roles: newRoles }
    const newUsers = users.map(u => u.email === user.email ? newUser : u)
    setUsers(newUsers)
  }
  const deleteUser = async (user: User) => {
    const url = `/api/users/${(user as any)._key}`
    const res = await fetch(url, {
      method: 'DELETE'
    })
    if (res.ok) {
      const newUsers = users.filter(u => u.email === user.email)
      setUsers(newUsers)
    }
  }
  return (
    <Layout>
      <h1>
        Admin corner
      </h1>

      <h2>Publish drafts</h2>

      <h2>Users</h2>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            users.map(u => (
              <tr key={u.email}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {Role.options.map(r => (
                    <label key={r}>
                      {r}
                      <input type="checkbox" checked={u.roles?.includes(r)} onChange={() => updateRole(u, r)} />
                    </label>
                  ))}
                </td>
                <td>
                  <button title="Delete" onClick={() => deleteUser(u)} disabled={me.email === u.email}>X</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Layout>
  )
}

export default Admin

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context, options)
  if (!session?.user) {
    context.res.statusCode = 401
    context.res.setHeader('WWW-Authenticate', 'OAuth')
    throw Error('Unauthorized')
  }

  if (session!.user!.roles!.includes(Role.enum.admin)) {
    const users = await listUsers()
    return {
      props: {
        users,
        me: session!.user
      },
    }
  }

  context.res.statusCode = 403
  throw Error('Forbidden')
}