import { signIn, signOut, useSession } from "next-auth/react";
import Image from 'next/image'
import { Layout } from "../shared/Layout";

const ProfilePage = () => {
  const { data: session } = useSession()
  if (!session) {
    return <Layout>Not logged in <br /><button onClick={() => signIn()}>Sign in</button></Layout>
  }
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

      <button onClick={() => signOut()}>Sign out</button>
    </Layout>
  )
}

export default ProfilePage
