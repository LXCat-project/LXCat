import { ReactNode, useState } from "react";
import { Dialog } from "./Dialog";
import { HowToCite } from "./HowToCite";
import { Reference } from "./types/reference";

interface Props {
  references: Reference[];
}

export const TermsOfUseCheck = ({ references }: Props) => {
  // TODO remember that visitor agreed during current session or last hours/days

  const [agreement, setAgreement] = useState(false);
  return (
    <Dialog
      isOpened={!agreement}
      onSubmit={() => setAgreement(true)}
      className="tos"
    >
      <h2>Terms of use</h2>
      <p>
        Users acknowledge understanding that LXCat is a community-based project
        with open-access databases being freely provided by individual
        contributors.
      </p>
      <p>
        <b>
          Proper referencing of material retrieved from this site is essential
          for the survival of the project.
        </b>
      </p>
      <HowToCite references={references} />
      <form method="dialog">
        <button value="default" type="submit">
          I agree with the terms of use
        </button>
      </form>
    </Dialog>
  );
};
