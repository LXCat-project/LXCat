
// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";
import Link from "next/link";

import { HowToCite } from "./HowToCite";
import { DOWNLOAD_COOKIE_NAME } from "../../../shared/download";
import { TermsOfUse } from "../../../shared/TermsOfUse";
import { Button, Center, Modal } from "@mantine/core";
import { usePathname } from "next/navigation";
import { FormattedReference } from "./types";

interface Props {
  references: FormattedReference[];
  permaLink: string;
}

export const TermsOfUseCheck = ({ references, permaLink }: Props) => {
  const path = usePathname() ?? "";
  const hash = path.split("#")[1] || "";
  const hasForce = hash.includes("terms_of_use");
  const hasDownloadToken =
    typeof document !== "undefined"
      ? document.cookie.includes(DOWNLOAD_COOKIE_NAME)
      : false;
  const [agreement, setAgreement] = useState(!hasForce && hasDownloadToken);

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
    if (hasForce) {
      document.location.hash = "";
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setAgreement(false)}>
        Terms of use
      </Button>
      <Modal
        opened={!agreement}
        withCloseButton={false}
        onSubmit={acceptTermsOfUse}
        onClose={() => {}}
        size="70%"
      >
        <h2>Terms of use</h2>
        <TermsOfUse />
        <p>
          The permalink for this data is{" "}
          <Link href={permaLink}>{permaLink}</Link>
        </p>
        <HowToCite references={references} />
        <Center>
          <Button sx={{marginTop: 10}} onClick={acceptTermsOfUse}>
            I agree with the terms of use
          </Button>
        </Center>
      </Modal>
    </>
  );
};
