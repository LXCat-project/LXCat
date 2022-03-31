import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import Image from 'next/image'

export function UserAnchor() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        <Link href='/profile'>
          <a>
            <Image src={session.user!.image!} title={`Logged in ${session.user?.name}`} alt="Picture of logged in user" width={40} height={40}/>
            </a>
        </Link>
      </>
    )
  }
  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}