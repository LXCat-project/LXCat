import { input, z, ZodTypeAny } from "zod";
import { typeTag } from "../generators";
import { SimpleParticle } from "../particle";
import { StateSummary } from "../summary";
import { LSDescriptorImpl, serializeLatexLS, serializeLS } from "./ls";

type Component<SchemaType extends ZodTypeAny> = {
  schema: SchemaType;
  serializers: {
    summary: (type: input<SchemaType>) => string;
    latex: (type: input<SchemaType>) => string;
  };
};

export const atomWithComponent = <
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

const Test = z.object({
  a: z.string(),
});
type Test = z.infer<typeof Test>;

export const TestComponent: Component<typeof Test> = {
  schema: Test,
  serializers: {
    summary: (test: Test) => test.a,
    latex: (test: Test) => test.a,
  },
};

const { schema: TestWithComponent, serializer: testSerializer } =
  atomWithComponent("Test", TestComponent);

const { schema: AtomLSWithComponent, serializer: atomLSSerializer } =
  atomWithComponent("AtomLS", LSDescriptorComponent);

const parser = {
  [atomLSSerializer.type]: atomLSSerializer,
  [testSerializer.type]: testSerializer,
};

const AnyAtom = z.discriminatedUnion("type", [
  AtomLSWithComponent,
  TestWithComponent,
]);

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
      summary: parser[atom.type].electronic.summary(ele),
      latex: parser[atom.type].electronic.latex(ele),
    }));

    serialized.summary += serialized.electronic
      .map(({ summary }) => summary).join("|");
    serialized.latex += serialized.electronic
      .map(({ latex }) => latex).join("|");
  } else {
    serialized.electronic = {
      summary: parser[atom.type].electronic.summary(electronic),
      latex: parser[atom.type].electronic.latex(electronic),
    };
    serialized.summary += serialized.electronic.summary;
    serialized.latex += serialized.electronic.latex;
  }

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
