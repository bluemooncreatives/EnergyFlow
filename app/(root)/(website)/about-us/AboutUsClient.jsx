"use client";

import dynamic from "next/dynamic";

const AboutUsContent = dynamic(() => import("./AboutUsContent"), {
  ssr: false,
});

export default function AboutUsClient({ products = [] }) {
  return <AboutUsContent products={products} />;
}
