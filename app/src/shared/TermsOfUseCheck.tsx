// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from "react";
import Link from "next/link";
import { Reference } from "@lxcat/schema/dist/core/reference";

import { Dialog } from "./Dialog";
import { HowToCite } from "./HowToCite";
import { DOWNLOAD_COOKIE_NAME } from "./download";
import { TermsOfUse } from "./TermsOfUse";

interface Props {
  references: Reference[];
  permaLink: string;
}

export const TermsOfUseCheck = ({ references, permaLink }: Props) => {
  const hasDownloadToken =
    typeof document !== "undefined"
      ? document.cookie.includes(DOWNLOAD_COOKIE_NAME)
      : false;
  const [agreement, setAgreement] = useState(hasDownloadToken);

  async function acceptTermsOfUse() {
    const url = "/api/auth/tou";
    const res = await fetch(url, {
      method: "POST",
    });
    if (res.ok) {
      setAgreement(true);
    } else {
      // Give error feedback to user
    }
  }

  return (
    <Dialog isOpened={!agreement} onSubmit={acceptTermsOfUse} className="tos">
      <h2>Terms of use</h2>
      <TermsOfUse />
      {/* TODO make permaLink an absolute URL */}
      <p>
        The permalink for this data is{" "}
        <Link href={permaLink}>
          <a>{permaLink}</a>
        </Link>
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
