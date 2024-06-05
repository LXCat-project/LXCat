// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import { ScientificInput } from "@/shared/scientific-input";
import { type CrossSectionParameters } from "@lxcat/schema/process";
import { Fieldset, Stack } from "@mantine/core";

export type ParameterProps = {
  parameters: CrossSectionParameters | undefined;
  setParameters: (
    parameters: CrossSectionParameters | undefined,
  ) => MaybePromise<void>;
};

export const ParameterSection = (
  { parameters, setParameters }: ParameterProps,
) => {
  return (
    <Fieldset legend="Parameters">
      <Stack>
        <ScientificInput
          label="Mass ratio"
          value={parameters && parameters.massRatio}
          onChange={(massRatio) => {
            if (massRatio === undefined) {
              if (parameters?.statisticalWeightRatio) {
                const { massRatio, ...params } = parameters;
                return setParameters(params);
              } else {
                return setParameters(undefined);
              }
            } else if (parameters) {
              return setParameters({ ...parameters, massRatio });
            } else {
              return setParameters({ massRatio });
            }
          }}
        />
        <ScientificInput
          label="Statistical weight ratio"
          value={parameters && parameters.statisticalWeightRatio}
          onChange={(statisticalWeightRatio) => {
            if (statisticalWeightRatio === undefined) {
              if (parameters?.massRatio) {
                const { statisticalWeightRatio, ...params } = parameters;
                return setParameters(params);
              } else {
                return setParameters(undefined);
              }
            } else if (parameters) {
              return setParameters({ ...parameters, statisticalWeightRatio });
            } else {
              return setParameters({ statisticalWeightRatio });
            }
          }}
        />
      </Stack>
    </Fieldset>
  );
};
