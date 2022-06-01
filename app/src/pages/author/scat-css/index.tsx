import type { GetServerSideProps, NextPage } from 'next'
import { Layout } from '../../../shared/Layout';
import { mustBeAuthor } from '../../../auth/middleware';
import { CrossSectionSetOwned, listOwned } from '../../../ScatteringCrossSectionSet/queries';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  items: CrossSectionSetOwned[]
}

const Admin: NextPage<Props> = ({ items }) => {
  const [selectedSetId, setselectedSetId] = useState('')
  const [openRestractDialog, setOpenRetractDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openPublishDialog, setOpenPublishDialog] = useState(false)
  const [restractMessage, setRetractMessage] = useState('')
  const deleteSet = async (pressedButton: string) => {
    if (pressedButton === 'default') {
      const url = `/api/scat-css/${selectedSetId}`
      const body = JSON.stringify({ message: restractMessage })
      const headers = new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      })
      const init = { method: 'DELETE', body, headers }
      const res = await fetch(url, init)
      const data = await res.json()
      console.log(data)
      // TODO give user feed back
    }
    setselectedSetId('')
    setOpenRetractDialog(false)
    setOpenDeleteDialog(false)
  }
  const publishSet = async (pressedButton: string) => {
    if (pressedButton === 'default') {
      const url = `/api/scat-css/${selectedSetId}/publish`
      const headers = new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      })
      const init = { method: 'POST', headers }
      const res = await fetch(url, init)
      const data = await res.json()
      console.log(data)
      // TODO give user feed back
      // TODO update list
    }
    setselectedSetId('')
    setOpenPublishDialog(false)
  }
  return (
    <Layout>
      <h1>Author scattering cross section sets</h1>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Created on</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            items.map(item => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.versionInfo.status}</td>
                <td>{item.versionInfo.createdOn}</td>
                <td>{item.versionInfo.version}</td>
                <td>
                  {item.versionInfo.status === 'draft' && (
                    <>
                      <Link href={`/author/scat-css/${item._key}/editraw`}><a><button>Edit</button></a></Link>
                      {/* TODO add preview link */}
                      <button onClick={() => {
                        setselectedSetId(item._key)
                        setOpenDeleteDialog(true)
                      }}>Delete</button>
                      <button onClick={() => {
                        setselectedSetId(item._key)
                        setOpenPublishDialog(true)
                      }}>Publish</button>
                    </>
                  )
                  }
                  {item.versionInfo.status === 'published' && (
                    <>
                      <Link href={`/author/scat-css/${item._key}/editraw`}><a><button>Edit</button></a></Link>
                      <button onClick={() => {
                        setselectedSetId(item._key)
                        setOpenRetractDialog(true)
                      }}>Retract</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      <Link href="/author/scat-css/addraw"><a><button>Add</button></a></Link>
      {/* TODO move dialogs to own components */}
      <dialog open={openRestractDialog} onClose={(event) => {
        deleteSet((event.target as any).returnValue)
      }}
        onCancel={() => deleteSet('cancel')}>
        <form method="dialog">
          <div>Please describe why <Link href={`/scat-css/${selectedSetId}`}><a>this set</a></Link> should be retracted.</div>
          <textarea cols={80} rows={5} value={restractMessage} onChange={(event) => setRetractMessage(event.target.value)}></textarea>
          <div>Users visiting <Link href={`/scat-css/${selectedSetId}`}><a>the page</a></Link> will see this description.</div>
          <button value="cancel">Cancel</button>
          <button value="default" type="submit">Retract</button>
        </form>
      </dialog>
      <dialog open={openDeleteDialog} onClose={(event) => {
        deleteSet((event.target as any).returnValue)
      }}
        onCancel={() => deleteSet('cancel')}>
        <form method="dialog">
          <div>The draft will be deleted. You will be unable to recover.</div>
          <button value="cancel">Cancel</button>
          <button value="default" type="submit">Delete</button>
        </form>
      </dialog>
      <dialog open={openPublishDialog} onClose={(event) => {
        publishSet((event.target as any).returnValue)
      }}
        onCancel={() => publishSet('cancel')}>
        <form method="dialog">
          <div>You are about to publish the set. This will make the set visible to everyone. Please only press publish when you are ready.</div>
          <button value="cancel">Cancel</button>
          <button value="default" type="submit">Publish</button>
        </form>
      </dialog>

    </Layout>
  )
}

export default Admin

export const getServerSideProps: GetServerSideProps = async (context) => {
  const me = await mustBeAuthor(context)
  const items = await listOwned(me.email)
  return {
    props: {
      items
    }
  }
}
