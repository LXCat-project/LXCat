// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";
import { RedocStandalone } from "redoc";

export default function IndexPage() {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/doc/`;
  return (
    <section className="container">
      <RedocStandalone specUrl={url} />
    </section>
  );
}
