import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { byId } from "@lxcat/database/dist/css/queries/public";
import {
  CrossSectionSetItem,
} from "@lxcat/database/dist/css/public";
import { Layout } from "../../shared/Layout";
import { ProcessList } from "../../ScatteringCrossSectionSet/ProcessList";

interface Props {
  set: CrossSectionSetItem;
}

const ScatteringCrossSectionPage: NextPage<Props> = ({ set }) => {
  return (
    <Layout title={`Scattering Cross Section set - ${set.name}`}>
      <h1>{set.name}</h1>
      {set.versionInfo.status === "retracted" && (
        <div style={{ backgroundColor: "red", color: "white", padding: 16 }}>
          <h2>This set has been retracted. Please do not use.</h2>
          <p>{set.versionInfo.retractMessage}</p>
          <p>
            Visit{" "}
            <Link href={`/scat-css/${set.id}/history`}>
              <a>history page</a>
            </Link>{" "}
            to see newer versions.
          </p>
        </div>
      )}
      {set.versionInfo.status === "archived" && (
        <div style={{ backgroundColor: "orange", color: "white", padding: 8 }}>
          <h2>This set is not the latest version.</h2>
          <p>
            Visit{" "}
            <Link href={`/scat-css/${set.id}/history`}>
              <a>history page</a>
            </Link>{" "}
            to see newer versions.
          </p>
        </div>
      )}
      <div>{set.description}</div>
      <div>Contributed by {set.contributor}</div>
      <div>Complete: {set.complete ? "Yes" : "No"}</div>
      <ul>
        <li>
          <a href={`/api/scat-css/${set.id}`} target="_blank" rel="noreferrer">
            Download JSON format
          </a>
        </li>
        {/* TODO implement API endpoint for Bolsig+ format download */}
        <li>
          <a
            href="/api/scat-css/${set.id}.txt"
            target="_blank"
            rel="noreferrer"
          >
            Download Bolsig+ format
          </a>
        </li>
      </ul>
      <h2>Processes</h2>
      <ProcessList processes={set.processes}/>

      {set.versionInfo.status === "published" &&
        set.versionInfo.version !== "1" && (
          <div>
            <p>
              Visit{" "}
              <Link href={`/scat-css/${set.id}/history`}>
                <a>history page</a>
              </Link>{" "}
              to see older versions.
            </p>
          </div>
        )}
    </Layout>
  );
};

export default ScatteringCrossSectionPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const id = context.params?.id!;
  const set = await byId(id);
  if (set === undefined) {
    return {
      notFound: true,
    };
  }
  return {
    props: { set },
  };
};
