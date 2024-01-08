// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HowToCite } from "./how-to-cite";
import { TermsOfUse } from "./terms-of-use";

export const TermsOfUseCheckForDeveloper = () => {
  return (
    <fieldset>
      <legend>Terms of use</legend>
      <TermsOfUse />
      <p>
        The data retrieved from API endpoints should be cited by their
        references.
      </p>
      <HowToCite references={[]} />
    </fieldset>
  );
};
