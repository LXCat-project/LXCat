import { signIn, signOut, useSession } from "next-auth/react";
import Image from 'next/image'
import Link from "next/link";
import { Role } from "../auth/schema";
import { Layout } from "../shared/Layout";

const ProfilePage = () => {
  const { data: session } = useSession()
  if (!session) {
    return <Layout>Not logged in <br /><button onClick={() => signIn()}>Sign in</button></Layout>
  }
  const isDeveloper = session.user.roles.includes(Role.enum.developer)
  const isAdmin = session.user.roles.includes(Role.enum.admin)
  return (
    <Layout>
      <h1>Profile</h1>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <Image src={session.user!.image!} title={`Logged in ${session.user?.name}`} alt="Picture of logged in user" width={80} height={80} />
        <div>
          <div>Name</div>
          <div>{session.user!.name}</div>
        </div>
        <div>
          <div>Email</div>
          <div>{session.user!.email}</div>
        </div>
      </div>

      {isDeveloper && (
        <div>
          <h2>API tokens</h2>
          <p>Some API endpoints require authentication.</p>
          <p> Use `Authentication: Bearer &lt;token&gt;` as header in request.</p>
          <p><Link href="/api/auth/apitoken"><a target={"_blank"}>Click to generate API token</a></Link></p>
        </div>
      )}

      {isAdmin && <Link href="/admin">Perform admin tasks</Link>}

      <button onClick={() => signOut()}>Sign out</button>
    </Layout>
  )
}

export default ProfilePage
