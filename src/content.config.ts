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
  // FIX HERE: Turn the schema into a function to use Astro's native image engine
  schema: ({ image }) => 
    z.object({
      title: z.string(),
      description: z.string(),
      // FIX HERE: This allows either local paths (./attachments/pic.png) or external URLs
      image: image().or(z.string()), 
      skills: z.array(z.string()),
      publishDate: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      metadata: metadataDefinition(),
    }),
});

export const collections = {
  project: project,
};
