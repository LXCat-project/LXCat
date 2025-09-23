import { Tabs } from "@mantine/core";
import { DenormalizedProcess } from "../denormalized-process";
import { PlotPanel } from "./plot-panel";

const tabData = {
  CrossSection: { name: "Cross Sections" },
  RateCoefficient: { name: "Rate Coefficients" },
};

export const ProcessTabs = (
  { processes, referenceMarkers }: {
    processes: Array<DenormalizedProcess>;
    referenceMarkers: Map<string, number>;
  },
) => {
  const infoTypes = [
    ...new Set(processes.map((process) => process.info.type)),
  ];

  const processMap = Object.fromEntries(
    infoTypes.map((kind) => [
      kind,
      processes.filter((process) => process.info.type == kind),
    ]),
  );

  return (
    <Tabs defaultValue={infoTypes[0]}>
      <Tabs.List>
        {Object.keys(processMap).map(kind => (
          <Tabs.Tab key={kind} value={kind}>
            {tabData[kind as "CrossSection" | "RateCoefficient"].name}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {Object.entries(processMap).map(([kind, processes]) => (
        <Tabs.Panel key={kind} value={kind}>
          <PlotPanel
            processes={processes}
            referenceMarkers={referenceMarkers}
          />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};
