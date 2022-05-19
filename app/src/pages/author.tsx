import type { GetServerSideProps, NextPage } from 'next'
import { getServerSession } from 'next-auth';
import { options } from '../auth/options';
import { Role } from '../auth/schema';
import { Layout } from '../shared/Layout';
import type { ErrorObject } from 'ajv'
import { useState, MouseEvent } from 'react';

interface Props {
}

const Admin: NextPage<Props> = () => {
  const [doc, setDoc] = useState('')
  const [errors, setErrors] = useState<ErrorObject[]>([])
  const [id, setId] = useState('')
  const uploadCS = async (event: MouseEvent<HTMLButtonElement>)  => {
    event.preventDefault();
    setErrors([])
    setId('')
    const url = `/api/scat-css`
    const body = JSON.stringify(doc)
    const headers = new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
    })
    const init = { method: 'POST', body, headers }
    const res = await fetch(url, init)
    const data = await res.json()
    if (res.ok) {
        setId(data.id)
    } else {
        setErrors(data.errors)
    }
  }

  return (
    <Layout>
      <h1>
        Author corner
      </h1>

      <h2>Scattering cross section set</h2>
      The JSON schema can be found <a href="/api/scat-css/schema.json" target="_blank">here</a>
      <form>
          <textarea
            value={doc}
            onChange={(event) => setDoc(event.target.value)}
            placeholder='Paste JSON document formatted with CrossSectionSet JSON schema'
            rows={20}
            cols={80}
          />
          <button
            type="submit"
            onClick={uploadCS}
          >Upload cross section</button>
          {errors.length > 0 &&
            <div>
              <span>Error(s) during upload</span>
              <ul>
                {errors.map((e, i) => <li key={i}>{e.message}, {JSON.stringify(e.params, undefined, 2)} { e.dataPath && `@ ${e.dataPath}`}</li>)}
              </ul>
            </div>
          }
          {id && <span>Upload successful, id is {id}</span>}
      </form>
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
  if (session!.user!.roles!.includes(Role.enum.author)) {
    return {
      props: {
      },
    }
  }

  context.res.statusCode = 403
  throw Error('Forbidden')
}

function setState<T>(arg0: never[]): [any, any] {
    throw new Error('Function not implemented.');
}
