import Link from "next/link";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "./ReactionSummary";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";

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
      <table>
        <thead>
          <tr>
            {props.labels.map((l, i) => (
              <td key={l}>
                {l} ({props.units[i]})
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
