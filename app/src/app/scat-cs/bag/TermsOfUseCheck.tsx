// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Center, Modal } from "@mantine/core";
import { IconLicense } from "@tabler/icons";
import { usePathname } from "next/navigation";
import { DOWNLOAD_COOKIE_NAME } from "../../../shared/download";
import { TermsOfUse } from "../../../shared/TermsOfUse";
import { ButtonClipboard } from "./ButtonClipboard";
import { HowToCite } from "./HowToCite";
import { FormattedReference } from "./types";

interface Props {
  references: FormattedReference[];
  permaLink: string;
}

export const TermsOfUseCheck = ({ references, permaLink }: Props) => {
  const path = usePathname() ?? "";
  const hash = path.split("#")[1] || "";
  const hasForce = hash.includes("terms_of_use");
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
      <Button
        type="button"
        size="md"
        rightIcon={<IconLicense size={"1.05rem"} stroke={1.5} />}
        onClick={() => setAgreement(false)}
      >
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
        <HowToCite references={references} />
        <Center>
          <Button.Group sx={{ marginTop: 10 }}>
            <ButtonClipboard link={permaLink}>Copy permalink</ButtonClipboard>
            <Button size="md" onClick={acceptTermsOfUse}>
              I agree with the terms of use
            </Button>
          </Button.Group>
        </Center>
      </Modal>
    </>
  );
};
