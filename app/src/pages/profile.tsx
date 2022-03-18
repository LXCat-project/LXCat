import { signIn, signOut, useSession } from "next-auth/react";
import { Layout } from "../shared/Layout";

const ProfilePage = () => {
  const { data: session } = useSession()
  if (!session) {
    return <Layout>Not logged in <br /><button onClick={() => signIn()}>Sign in</button></Layout>
  }
  return (
    <Layout>
      <h1>Profile</h1>

      <pre>
        {JSON.stringify(session, undefined, 4)}
      </pre>
      <button onClick={() => signOut()}>Sign out</button>
    </Layout>
  )
}

export default ProfilePage
