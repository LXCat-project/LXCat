import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>LXCat ng</title>
        <meta name="description" content="An open-access website for collecting, displaying, and downloading electron and ion scattering cross sections, swarm parameters (mobility, diffusion coefficient, etc.), reaction rates, energy distribution functions, etc. and other data required for modeling low temperature plasmas." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to LXCat
        </h1>

        <p className={styles.description}>
          <Link href="/scat-cs">Scattering cross sections</Link>
        </p>
      </main>

      <footer className={styles.footer}>
        <div>
        Copyright © 2009-2022, <Link href="/team">the LXCat team</Link>.
        All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}

export default Home
