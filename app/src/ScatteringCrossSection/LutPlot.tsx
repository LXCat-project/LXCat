import { LUT } from "@lxcat/schema/dist/core/data_types"
import { Vega, VisualizationSpec } from "react-vega"

type Props = Pick<LUT, "data" | "labels" | "units">

export const LutPlot = (props: Props) => {
    const spec = toVegaSpec(props)
    console.log(spec)
    return (
        <Vega spec={spec as any}/>
    )
}

function toVegaData(data: LUT["data"]) {
    const rows = data.map(d => ({x: d[0], y: d[1]}))
    return rows
}

function toVegaSpec({labels, units, data}: Props) {
  const values = toVegaData(data)
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        width: 800,
        height: 600,
        "mark": {
          "type": "point",
        },
        encoding: {
          x: { field: "x", scale: {type: "log"}, title: `${labels[0]} (${units[0]})` },
          y: { field: "y",  scale: {type: "log"}, title: `${labels[1]} (${units[1]})` },
        },
        data: {
          values
        },
    }
}