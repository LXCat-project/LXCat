import { input, z, ZodTypeAny } from "zod";
import { typeTag } from "../generators";
import { SimpleParticle } from "../particle";
import { StateSummary } from "../summary";
import { LSDescriptorImpl, serializeLatexLS, serializeLS } from "./ls";
import { LS1DescriptorImpl, serializeLatexLS1, serializeLS1 } from "./ls1";

type Component<SchemaType extends ZodTypeAny> = {
  schema: SchemaType;
  serializers: {
    summary: (type: input<SchemaType>) => string;
    latex: (type: input<SchemaType>) => string;
  };
};

export const createAtomicType = <
  Tag extends string,
  SchemaType extends z.ZodTypeAny,
>(
  tag: Tag,
  component: Component<SchemaType>,
) => ({
  schema: typeTag(tag).merge(SimpleParticle).merge(
    z.object({
      electronic: z.union([
        component.schema.describe("Singular"),
        z.array(component.schema).describe("Compound"),
      ]),
    }),
  ),
  serializer: { type: tag, electronic: component.serializers },
});

export const LSDescriptorComponent: Component<typeof LSDescriptorImpl> = {
  schema: LSDescriptorImpl,
  serializers: {
    summary: serializeLS,
    latex: serializeLatexLS,
  },
};

export const LS1DescriptorComponent: Component<typeof LS1DescriptorImpl> = {
  schema: LS1DescriptorImpl,
  serializers: {
    summary: serializeLS1,
    latex: serializeLatexLS1,
  },
};

const { schema: AtomLSWithComponent, serializer: atomLSSerializer } =
  createAtomicType("AtomLS", LSDescriptorComponent);

const { schema: AtomLS1WithComponent, serializer: atomLS1Serializer } =
  createAtomicType("AtomLS1", LS1DescriptorComponent);

const AnyAtom = z.discriminatedUnion("type", [
  AtomLSWithComponent,
  AtomLS1WithComponent,
]);
type AnyAtom = z.infer<typeof AnyAtom>;

const atomSerializers = {
  [atomLSSerializer.type]: atomLSSerializer,
  [atomLS1Serializer.type]: atomLS1Serializer,
};

const serializeAtom = (atom: z.infer<typeof AnyAtom>): StateSummary => {
  const serialized: StateSummary = {
    particle: atom.particle,
    charge: atom.charge,
    summary: "",
    latex: "",
  };

  // Disable type checking as typescript does not provide the means
  // to correctly typecheck this code.
  const electronic = atom.electronic as any;

  serialized.summary += "{";
  serialized.latex += "\\left(";

  if (Array.isArray(electronic)) {
    serialized.electronic = electronic.map((ele) => ({
      summary: atomSerializers[atom.type].electronic.summary(ele),
      latex: atomSerializers[atom.type].electronic.latex(ele),
    }));

    serialized.summary += serialized.electronic
      .map(({ summary }) => summary).join("|");
    serialized.latex += serialized.electronic
      .map(({ latex }) => latex).join("|");
  } else {
    serialized.electronic = {
      summary: atomSerializers[atom.type].electronic.summary(electronic),
      latex: atomSerializers[atom.type].electronic.latex(electronic),
    };
    serialized.summary += serialized.electronic.summary;
    serialized.latex += serialized.electronic.latex;
  }

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
