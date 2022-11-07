// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import dynamic from "next/dynamic";
import Link from "next/link";
import { Reference } from "../shared/Reference";
import { ReactionSummary } from "./ReactionSummary";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { LutTable } from "./LutTable";

export const LutPlotDynamic = dynamic(
  () => import("./LutPlot").then((m) => m.LutPlot),
  {
    ssr: false,
  }
);

export const Item = (props: CrossSectionItem) => {
  return (
    <div>
      <h1>Scattering Cross Section</h1>
      {props.versionInfo.status === "retracted" && (
        <div style={{ backgroundColor: "red", color: "white", padding: 16 }}>
          <h2>This cross section has been retracted. Please do not use.</h2>
          <p>{props.versionInfo.retractMessage}</p>
        </div>
      )}
      {props.versionInfo.status === "archived" && (
        <div style={{ backgroundColor: "orange", color: "white", padding: 8 }}>
          <h2>This cross section is not the latest version.</h2>
          <p>
            Visit{" "}
            <Link href={`/scat-cs/${props.id}/history`}>
              <a>history page</a>
            </Link>{" "}
            to see newer versions.
          </p>
        </div>
      )}
      <ul>
        <li>
          <a
            href={`/api/scat-cs/${props.id}`}
            target="_blank"
            rel="noreferrer"
            download
          >
            Download JSON format
          </a>
        </li>
        {/* TODO also allow a cross section to be downloaded in txt format
        Converter currently only understands cross section sets.
        <li>
          <a href="TODO" target="_blank" rel="noreferrer" download>
            Download txt format
          </a>
        </li> */}
      </ul>
      <h2>Reaction</h2>
      <ReactionSummary {...props.reaction} />
      {/* TODO show charge, non-simpleparticle data */}
      <h2>Part of set</h2>

      <ul>
        {props.isPartOf.map((s) => (
          <li key={s.id}>
            <div>
              Name: <Link href={`/scat-css/${s.id}`}>{s.name}</Link>
            </div>
            <div>Description: {s.description}</div>
            <div>Complete: {s.complete ? "Yes" : "No"}</div>
            <div>Contributed by {s.organization}</div>
          </li>
        ))}
      </ul>
      <h2>Data</h2>
      <LutPlotDynamic
        data={props.data}
        labels={props.labels}
        units={props.units}
      />
      <details>
        <summary>Data as table</summary>
        <LutTable data={props.data} labels={props.labels} units={props.units} />
      </details>
      <h2>References</h2>
      <ul>
        {props.reference.map((r, i) => (
          <li key={i}>
            <Reference {...r} />
          </li>
        ))}
      </ul>

      {props.versionInfo.status === "published" &&
        props.versionInfo.version !== "1" && (
          <div>
            <p>
              Visit{" "}
              <Link href={`/scat-cs/${props.id}/history`}>
                <a>history page</a>
              </Link>{" "}
              to see older versions.
            </p>
          </div>
        )}
    </div>
  );
};
