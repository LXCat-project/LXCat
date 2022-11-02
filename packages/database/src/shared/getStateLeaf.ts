export interface StatePath {
  particle?: string;
  electronic?: string;
  vibrational?: string;
  rotational?: string;
}

export interface StateLeaf {
  id: string;
  includeChildren: boolean;
}

export const OMIT_CHILDREN_KEY = "omit_children";

export const getStateLeaf = ({
  particle,
  electronic,
  vibrational,
  rotational,
}: StatePath): StateLeaf | undefined => {
  if (particle) {
    if (electronic) {
      if (electronic === OMIT_CHILDREN_KEY) {
        return { id: particle, includeChildren: false };
      } else if (vibrational) {
        if (vibrational === OMIT_CHILDREN_KEY) {
          return { id: electronic, includeChildren: false };
        } else if (rotational) {
          if (rotational === OMIT_CHILDREN_KEY) {
            return { id: vibrational, includeChildren: false };
          }
          return { id: rotational, includeChildren: false };
        }
        return { id: vibrational, includeChildren: true };
      }
      return { id: electronic, includeChildren: true };
    }
    return { id: particle, includeChildren: true };
  }

  return undefined;
};
