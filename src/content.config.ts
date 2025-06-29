import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

export const collections = {
	projects: defineCollection({
		type: 'content',
		schema: z.object({
			order: z.number().optional(),
			title: z.string(),
			description: z.string(),
			longDescription: z.string().optional(),
			start: z.coerce.date(),
			end: z.coerce.date().optional(),
			highlight: z.string(),
			images: z.array(z.string()).optional(),
			videos: z.array(z.string()).optional(),
			links: z.array(
				z.object({
					label: z.string(),
					href: z.string().url(),
					icon: z.string(),
				})
			).optional(),
		}),
	}),

	contact: defineCollection({
		loader: glob({ base: './src/content/contact', pattern: '**/*.md' }),
		schema: z.object({
			links: z.array(
				z.object({
					label: z.string(),
					href: z.string().url(),
					icon: z.string(),
				})
			),
		}),
	}),

	education: defineCollection({
		loader: glob({ base: './src/content/education', pattern: '**/*.md' }),
		schema: z.object({
			order: z.number().optional(),
			title: z.string(),
			subtitle: z.string().optional(),
			period: z.string().optional(),
			description: z.string().optional(),
			image: z.string().optional(),
		}),
	}),

	experience: defineCollection({
		loader: glob({ base: './src/content/experience', pattern: '**/*.md' }),
		schema: z.object({
			order: z.number().optional(),
			title: z.string(),
			subtitle: z.string().optional(),
			period: z.string().optional(),
			stack: z.array(z.string()).optional(),
			description: z.string().optional(),
			icon: z.string().optional(),
		}),
	}),

	about: defineCollection({
		loader: glob({ base: './src/content/about', pattern: '*.md' }),
		schema: z.object({
			description: z.string(),
		}),
	}),

	skills: defineCollection({
		loader: glob({ base: './src/content/skills', pattern: '**/*.md' }),
		schema: z.object({
			order: z.number(),
			name: z.string(),
			key: z.string(),
			img: z.string(),
		}),
	}),
};
