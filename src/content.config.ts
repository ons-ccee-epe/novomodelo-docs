import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { localeId } from "../scripts/locale-id.mjs";

// pt-BR sources (pt-br/) are served at the docs root and English sources
// under en/; scripts/locale-id.mjs maps each source path to its id.
export const collections = {
  docs: defineCollection({
    loader: docsLoader({ generateId: ({ entry }) => localeId(entry) }),
    schema: docsSchema(),
  }),
};
