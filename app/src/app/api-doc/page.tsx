"use client";
import { RedocStandalone } from "redoc";

export default async function IndexPage() {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/doc/`;
  return (
    <section className="container">
      <RedocStandalone specUrl={url} />
    </section>
  );
}
