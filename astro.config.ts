import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import remarkWikiLink from 'remark-wiki-link';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';

import cloudflare from "@astrojs/cloudflare";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

// Reusable Obsidian wiki-link parsing configuration for both MD and MDX files
const obsidianWikiLinkConfig = [
  remarkWikiLink,
  {
    pathFormat: 'obsidian-short',
    newClassName: 'internal-link',
    wikiLinkClassName: 'internal-link',
    
    // Tell the plugin how to resolve file names to URLs
    pageResolver: (name: string) => {
      return [name.trim().replace(/ /g, '%20')];
    },

    // Generate the exact URL string that Astro's router demands
    hrefTemplate: (permalink: string) => {
      // If it's an image, point it relatively into your local attachments folder
      if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(permalink)) {
        return `./attachments/${permalink}`;
      }
      // If it's a regular text note wiki link, give it the absolute /project/ path prefix
      return `/project/${permalink}`;
    },
  },
];

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    mdx({
      remarkPlugins: [obsidianWikiLinkConfig],
    }),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin, obsidianWikiLinkConfig],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },

  adapter: cloudflare()
});