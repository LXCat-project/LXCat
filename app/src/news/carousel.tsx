// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Carousel } from "@mantine/carousel";
import { rem, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { NewsCard, NewsCardProps } from "./card";

export type NewsCarouselProps = {
  newsItems: Array<NewsCardProps>;
};

export function NewsCarousel({ newsItems }: NewsCarouselProps) {
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const slides = newsItems.map((item) => (
    <Carousel.Slide key={item.title}>
      <NewsCard {...item} />
    </Carousel.Slide>
  ));

  return (
    <Carousel
      slideSize={{ base: "100%", sm: "30%" }}
      slideGap={{ base: "xl", sm: rem(5) }}
      emblaOptions={{ slidesToScroll: mobile ? 1 : 3 }}
    >
      {slides}
    </Carousel>
  );
}
