import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";

export interface Vibrational {
  v: number[];
}

export interface HomonuclearDiatom {
  type: "HomonuclearDiatom";
  Lambda: number[];
  S: number[];
  e: string[];
  parity: Array<"g" | "u">;
  reflection: Array<"-" | "+">;
  vibrational: Array<Vibrational> | undefined;
}

export interface AtomLsTerm {
  L: number[];
  S: number[];
  P: Array<1 | -1>;
  J: number[];
}

export interface AtomLS {
  type: "AtomLS";
  term: AtomLsTerm;
}

export type Electronic = HomonuclearDiatom | AtomLS;

export interface ParticleLessStateChoice {
  charge: number[];
  electronic?: Array<Electronic> | undefined;
}

export interface StateChoice extends ParticleLessStateChoice {
  particle: string;
}

export type StateSelected = {
  [key: string]: ParticleLessStateChoice;
};

export async function stateChoices(): Promise<StateChoice[]> {
  const cursor: ArrayCursor<StateChoice> = await db().query(aql`
    FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == 'published'
        FOR p IN IsPartOf
            FILTER p._to == css._id
            FOR cs IN CrossSection
                FILTER cs._id == p._from
                FOR r in Reaction
                    FILTER r._id == cs.reaction
                    FOR c IN Consumes
                        FILTER c._from == r._id
                        FOR s IN State
                            FILTER s._id == c._to
                            FILTER s.particle != 'e'
                            COLLECT particle = s.particle INTO groups
                            RETURN {
                                particle: particle, 
                                charge: SORTED_UNIQUE(groups[*].s.charge)
                            }
    `);
  return await cursor.all();
}

export async function setIdsWithState(
  selection: StateSelected
): Promise<string[]> {
  const isEmptySelection = Object.keys(selection).length === 0;
  const isParticleOnlySelection = Object.values(selection).every(
    (s) => s.charge === [] && s.electronic === undefined
  );
  const query = aql`
    FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == 'published'
        RETURN css._id
`;
  if (isEmptySelection) {
    // Nothing to do
  } else if (isParticleOnlySelection) {
    // TODO
  }
  const cursor: ArrayCursor<string> = await db().query(query);
  return await cursor.all();
}
