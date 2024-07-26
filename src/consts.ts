import type { Metadata, Site, Socials } from '@types'

export const SITE: Site = {
	TITLE: 'Bhargawanan Bhuyan',
	DESCRIPTION: 'Bhargawanan Bhuyan is a freelance full-stack developer based in Assam.',
	EMAIL: 'bhargawanan@gmail.com',
	NUM_POSTS_ON_HOMEPAGE: 3,
	NUM_PROJECTS_ON_HOMEPAGE: 3
}

export const HOME: Metadata = {
	TITLE: 'Home',
	DESCRIPTION: 'Bhargawanan Bhuyan is a freelance full-stack developer based in Assam.'
}

export const BLOG: Metadata = {
	TITLE: 'Blog',
	DESCRIPTION: 'A collection of blogs written by Bhargawanan Bhuyan.'
}

export const PROJECTS: Metadata = {
	TITLE: 'Projects',
	DESCRIPTION: 'A collection of projects developed by Bhargawanan Bhuyan.'
}

export const SOCIALS: Socials = [
	{
		NAME: 'Twitter',
		HREF: 'https://x.com/bhargawanan_b'
	},
	{
		NAME: 'GitHub',
		HREF: 'https://github.com/bhargawananbhuyan'
	}
]
