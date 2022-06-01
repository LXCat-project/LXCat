import type { GetServerSideProps, NextPage } from 'next'
import { Layout } from '../../shared/Layout'
import Link from 'next/link';
import { mustBeAdmin } from '../../auth/middleware';


const Admin: NextPage = () => {
  return (
    <Layout>
      <h1>
        Admin corner
      </h1>

      <ul>
        <li><Link href='users'><a>Users</a></Link></li>
      </ul>
    </Layout>
  )
}

export default Admin

export const getServerSideProps: GetServerSideProps = async (context) => {
  await mustBeAdmin(context)
  return {
    props: {}
  }
}