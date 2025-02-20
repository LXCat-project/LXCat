import { Static, TObject, TSchema, Type } from "@sinclair/typebox";

export const TReactionEntry = <StateType extends TSchema>(
  StateType: StateType,
) => Type.Object({ count: Type.Integer({ minimum: 0 }), state: StateType });

enum TypeTag {
  Elastic,
  Effective,
  MomentumTransfer,
  Excitation,
  Electronic,
  Vibrational,
  Rotational,
  Attachment,
  Ionization,
  Dissociative,
}

export const ReactionTypeTag = Type.Enum(TypeTag);

export const Reaction = <StateType extends TSchema>(
  StateType: StateType,
) =>
  Type.Object({
    lhs: Type.Array(TReactionEntry(StateType)),
    rhs: Type.Array(TReactionEntry(StateType)),
    reversible: Type.Boolean(),
    typeTags: Type.Array(ReactionTypeTag),
  });

export const TProcess = <
  StateType extends TSchema,
  ProcessInfoType extends TSchema,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  Type.Object({ reaction: StateType, info: Type.Array(ProcessInfoType) });

export const ProcessInfo = <
  ReferenceType extends TSchema,
  BaseType extends TObject,
>(ReferenceType: ReferenceType, Base: BaseType) =>
  Type.Union([
    Type.Composite([Base, CrossSectionInfo(ReferenceType)]),
    Type.Composite([Base, RateCoefficientInfo(ReferenceType)]),
    Type.Composite([Base, EnergyRateCoefficientInfo(ReferenceType)]),
  ]);

export const ProcessInfoBase = <
  TypeTag extends string,
  DataType extends TSchema,
  ReferenceType extends TSchema,
>(
  type: TypeTag,
  dataType: DataType,
  referenceType: ReferenceType,
) =>
  Type.Object({
    type: Type.Literal(type),
    comments: Type.Array(Type.String().min(1)).optional(),
    references: Type.Array(referenceType),
    data: dataType,
  });

export const Pair = <InnerType extends TSchema>(InnerType: InnerType) =>
  Type.Tuple([InnerType, InnerType]);

export const LUT = Type.Object({
  type: Type.Literal("LUT"),
  labels: Pair(Type.String({ minLength: 1 })),
  units: Pair(Type.String({ minLength: 1 })),
  values: Type.Array(Pair(Type.Number())),
});

export const CrossSectionData = LUT;

export const CrossSectionParameters = Type.Object({
  massRatio: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
  statisticalWeightRatio: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
});

export const CrossSectionInfo = <ReferenceType extends TSchema>(
  ReferenceType: ReferenceType,
) =>
  Type.Composite([
    ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType),
    Type.Object({
      parameters: CrossSectionParameters.optional(),
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: Type.Number(),
    }),
  ]);

export const UnitValue = <
  UnitType extends TSchema,
  ValueType extends TSchema,
>(unitSchema: UnitType, valueSchema: ValueType) =>
  Type.Object({ unit: unitSchema, value: valueSchema });

export const Constant = Type.Composite([
  Type.Object({ type: Type.Literal("Constant") }),
  UnitValue(Type.String(), Type.Number()),
]);

export const Expression = Type.Object({
  type: Type.Literal("Expression"),
  expression: Type.String({ minLength: 1 }),
  unit: Type.String({ minLength: 1 }),
  parameters: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});
// .superRefine((value, ctx) => {
//   for (const param of value.parameters) {
//     if (!value.expression.includes(param)) {
//       ctx.addIssue({
//         code: ZodIssueCode.custom,
//         message: `Unused parameter ${param}.`,
//       });
//     }
//   }
// });

export const RateCoefficientData = Type.Union([
  Constant,
  LUT,
  Expression,
]);

export const RateCoefficientInfo = <ReferenceType extends TSchema>(
  ReferenceType: ReferenceType,
) =>
  Type.Composite([
    ProcessInfoBase("RateCoefficient", RateCoefficientData, ReferenceType),
    Type.Object({
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: UnitValue(Type.String(), Type.Number()),
    }),
  ]);

export const EnergyRateCoefficientInfo = <ReferenceType extends TSchema>(
  ReferenceType: ReferenceType,
) =>
  Type.Composite([
    ProcessInfoBase(
      "EnergyRateCoefficient",
      RateCoefficientData,
      ReferenceType,
    ),
    Type.Object({
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: UnitValue(Type.String(), Type.Number()),
    }),
  ]);

type Serializable = {
  summary: () => string;
  latex: () => string;
};

export type Component<ComponentSchema extends TSchema> =
  & Static<ComponentSchema>
  & Serializable;

export const LSTermUncoupled = Type.Object({
  L: Type.Integer({ minimum: 0 }),
  S: Type.Number({ minimum: 0, multipleOf: 0.5 }),
  P: Type.Union([Type.Literal(-1), Type.Literal(1)]),
});

export const TotalAngularSpecifier = Type.Object({
  J: Type.Number({ minimum: 0, multipleOf: 0.5 }),
});

export const LSTerm = Type.Composite([LSTermUncoupled, TotalAngularSpecifier]);

export const buildTerm = <
  EConfig extends TSchema,
  TermSymbol extends TSchema,
>(electronConfig: EConfig, term: TermSymbol) =>
  Type.Object({ config: electronConfig, term });

export const ShellEntry = Type.Object({
  n: Type.Integer({ minimum: 1 }),
  l: Type.Integer({ minimum: 0 }),
  occupance: Type.Integer({ minimum: 0 }),
});

export const LSDescriptor = buildTerm(Type.Array(ShellEntry), LSTerm);

export const typeTag = <Tag extends string>(tag: Tag) =>
  Type.Object({ type: Type.Literal(tag) });

// dprint-ignore
export enum Element { 
  H,  He, Li, Be, B,  C,  N,  O,  F,  Ne,
  Na, Mg, Al, Si, P,  S,  Cl, Ar, K,  Ca,
  Sc, Ti, V,  Cr, Mn, Fe, Co, Ni, Cu, Zn,
  Ga, Ge, As, Se, Br, Kr, Rb, Sr, Y,  Zr,
  Nb, Mo, Tc, Ru, Rh, Pd, Ag, Cd, In, Sn,
  Sb, Te, I,  Xe, Cs, Ba, La, Ce, Pr, Nd,
  Pm, Sm, Eu, Gd, Tb, Dy, Ho, Er, Tm, Yb,
  Lu, Hf, Ta, W,  Re, Os, Ir, Pt, Au, Hg,
  Tl, Pb, Bi, Po, At, Rn, Fr, Ra, Ac, Th,
  Pa, U,  Np, Pu, Am, Cm, Bk, Cf, Es, Fm,
  Md, No, Lr, Rf, Db, Sg, Bh, Hs, Mt, Ds,
  Rg, Cn, Nh, Fl, Mc, Lv, Ts, Og
}

export const AtomComposition = Type.Tuple([
  Type.Tuple([Type.Enum(Element), Type.Literal(1)]),
]);

export const SpeciesBase = <CompositionSchema extends TSchema>(
  composition: CompositionSchema,
) =>
  Type.Object({
    composition,
    charge: Type.Integer(),
  });

export const makeAtom = <
  Tag extends string,
  CompositionSchema extends TObject,
  ElectronicSchema extends TSchema,
>(
  tag: Tag,
  composition: CompositionSchema,
  electronic: ElectronicSchema,
) =>
  Type.Composite([
    typeTag(tag),
    composition,
    Type.Object({
      electronic: Type.Union([
        { ...electronic, description: "Singular" },
        Type.Array(electronic, { minimum: 2, description: "Compound" }),
      ]),
    }),
  ]);
