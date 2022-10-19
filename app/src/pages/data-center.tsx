import Link from "next/link";
import { Layout } from "../shared/Layout";

function DataCenterPage() {
  return (
    <Layout>
      <h1>Data center</h1>
      <ul>
        <li>
          <Link href="/scat-cs">Scattering cross sections</Link>
        </li>
        <li>
          <Link href="/scat-css">Scattering cross section sets</Link>
        </li>
      </ul>
    </Layout>
  );
}

export default DataCenterPage;
