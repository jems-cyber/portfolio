import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z.object({
    title: z.string().optional(),
    ignoreTitleTemplate: z.boolean().optional(),
    canonical: z.string().url().optional(),
    robots: z.object({ index: z.boolean().optional(), follow: z.boolean().optional() }).optional(),
    description: z.string().optional(),
    openGraph: z.object({
      url: z.string().optional(),
      siteName: z.string().optional(),
      images: z.array(z.object({ url: z.string(), width: z.number().optional(), height: z.number().optional() })).optional(),
      locale: z.string().optional(),
      type: z.string().optional(),
    }).optional(),
    twitter: z.object({ handle: z.string().optional(), site: z.string().optional(), cardType: z.string().optional() }).optional(),
  }).optional();

const project = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/project' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    skills: z.array(z.string()),
    publishDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    // ADDED THIS: Now AstroWind's SEO component won't crash when it looks for metadata
    metadata: metadataDefinition(), 
  }),
});

export const collections = {
  project: project,
};
