import { defineCollection, reference, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    image: reference("assets"),
  }),
});