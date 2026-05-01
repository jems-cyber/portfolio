import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const project = defineCollection({
  type: 'content', // Use 'content' for Markdown/MDX
  schema: z.object({
    title: z.string(),
    description: z.string(), // The short summary for the card
    image: z.string(), // Path to the project picture
    skills: z.array(z.string()), // Skills like 'C', 'Docker'
    publishDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  project: project,
};
