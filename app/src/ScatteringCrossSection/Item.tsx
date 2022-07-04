import Link from "next/link";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "./ReactionSummary";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { LutPlot } from "./LutPlot";
import { LutTable } from "./LutTable";

export const Item = (props: CrossSectionItem) => {
  return (
    <div>
      <h1>Scattering Cross Section</h1>
      <ul>
        <li>
          <a href={`/api/scat-cs/${props.id}`} target="_blank" rel="noreferrer">
            Download JSON format
          </a>
        </li>
        <li>
          <a href="TODO" target="_blank" rel="noreferrer">
            Download Bolsig+ format
          </a>
        </li>
      </ul>
      <h2>Reaction</h2>
      <ReactionSummary {...props.reaction} />
      {/* TODO show charge, non-simpleparticle data */}
      <h2>Part of set</h2>

      <div>
        {props.isPartOf.map((s) => (
          <div key={s.id}>
            <div>
              Name: <Link href={`/scat-css/${s.id}`}>{s.name}</Link>
            </div>
            <div>Description: {s.description}</div>
            <div>Complete: {s.complete ? "Yes" : "No"}</div>
          </div>
        ))}
      </div>
      <h2>Data</h2>
      <LutPlot data={props.data} labels={props.labels} units={props.units} />
      <details>
        <summary>Data as table</summary>
        <LutTable data={props.data} labels={props.labels} units={props.units} />
      </details>
      <h2>Reference</h2>
      <ul>
        {props.reference.map((r, i) => (
          <li key={i}>
            <Reference {...r} />
          </li>
        ))}
      </ul>
    </div>
  );
};
