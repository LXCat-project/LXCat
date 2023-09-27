// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "@lxcat/schema";
import Link from "next/link";
import { useState } from "react";

import { Button, Center, Modal } from "@mantine/core";
import { useRouter } from "next/router";
import { DOWNLOAD_COOKIE_NAME } from "./download";
import { HowToCite } from "./HowToCite";
import { TermsOfUse } from "./TermsOfUse";

interface Props {
  references: Reference[];
  permaLink: string;
}

export const TermsOfUseCheck = ({ references, permaLink }: Props) => {
  const { asPath } = useRouter();
  const hash = asPath.split("#")[1] || "";
  const hasForce = hash.includes("termsOfUse");
  const hasDownloadToken = typeof document !== "undefined"
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
      <button type="button" onClick={() => setAgreement(false)}>
        Terms of use
      </button>
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
          <Button onClick={acceptTermsOfUse}>
            I agree with the terms of use
          </Button>
        </Center>
      </Modal>
    </>
  );
};
