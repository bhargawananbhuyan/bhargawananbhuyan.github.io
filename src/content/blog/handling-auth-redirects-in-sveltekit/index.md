---
title: Handling authentication redirects in SvelteKit.
date: 2024-06-30
description: Note on how to handle redirects in the authentication workflow in SvelteKit.
draft: false
---

If we want to access a secure route and we're redirected to the login route, then the login route should have the path to which we are redirected from so that we're redirected to that particular path after logging in and not to the homepage. For this, in the `+layout.server.ts` file of the `(protected)` folder, we need to modify the `load` function as follows --

```ts
// ./src/(protected)/+layout.server.ts

import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import getUser from '$lib/utils/get-user'

export const load: LayoutServerLoad = async ({ parent, url }) => {
	const parentData = await parent()

	const redirectTo = url.pathname + url.search // to get that route from which we are redirected from
	if (!parentData.session)
		throw redirect(301, `/login?redirectTo=${redirectTo}`)

	const user = await getUser(parentData.session)

	return { user }
}
```

To handle the redirect after logging in, we need to modify the `action`function in `login/+page.server.ts` as follows --

```ts
// ./src/(auth)/login/+page.server.ts

import { signIn } from '$auth'
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
	default: async (event) => {
		await signIn(event)
		// handle redirect after logging in
		const redirectTo = event.url.searchParams.get('redirectTo')
		if (redirectTo) throw redirect(301, `/${redirectTo.slice(1)}`)
		throw redirect(301, '/')
	}
}
```

However, securing routes using `+layouts.server.ts` will be tedious if we have large number of layouts. In every case we need to call `await parent()`. To mitigate this, the above written code can be modified to --

```ts
// ./src/(protected)/+layout.server.ts

import getUser from '$lib/utils/get-user'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent }) => {
	const parentData = await parent()

	const user = await getUser(parentData.session!)

	return { user }
}
```

The file for `./src/(auth)/login/+page.server.ts` can be removed.

We can then handle the redirects in the `./src/hooks.server.ts` file as --

```ts
import { handle as authJs } from '$auth'
import { redirect, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const authGuards: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth()
	const pathname = event.url.pathname

	// if there's a session
	if (session?.user) {
		if (pathname === '/login') {
			const redirectTo = event.url.searchParams.get('redirectTo')
			if (redirectTo) throw redirect(301, `/${redirectTo.slice(1)}`)
			throw redirect(301, '/')
		}
	}

	// if no session exists
	if (!session?.user && pathname.startsWith('/profile')) {
		throw redirect(301, `/login?redirectTo=${pathname + '&error=AccessDenied'}`)
	}

	return resolve(event)
}

export const handle: Handle = sequence(authJs, authGuards)
```

Reference taken from tutorials by [Huntabyte](https://www.youtube.com/@Huntabyte) and some Google searches 😉
