import type { GetServerSideProps, NextPage } from 'next'
import { Layout } from '../../shared/Layout'
import { Role, User } from '../../auth/schema';
import { useState } from 'react'
import { listUsers } from '../../auth/db';
import { mustBeAdmin } from '../../auth/middleware';

interface Props {
    users: User[]
    me: User
}

const AdminUsers: NextPage<Props> = ({ me, users: initalUsers }) => {
    const [users, setUsers] = useState(initalUsers)
    // TODO move updateRole + deleteUser to client.ts
    const updateRole = async (user: User, role: Role) => {
        const url = `/api/users/${(user as any)._key}/roles/${role}`
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
            <h1>Administrate users</h1>

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

export default AdminUsers

export const getServerSideProps: GetServerSideProps = async (context) => {
    const me = await mustBeAdmin(context)
    const users = await listUsers()
    return {
        props: {
            users,
            me
        }
    }
}