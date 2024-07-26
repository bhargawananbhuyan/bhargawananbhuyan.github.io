---
title: Setup and deployment of a Svelte-kit app to DigitalOcean.
date: 2024-07-07
description: Workflow on how to deploy a SvelteKit application with SQLite database and Drizzle ORM support to a DigitalOcean droplet.
draft: false
---

I was working on a SvelteKit application with a _SQLite database_ and _Drizzle ORM_ setup. The runtime used was Bun. In development, there wasn't much hiccups, but while moving to production, I faced a few problems.

- using `bun:sqlite`, TypeErrors and other stuff!
- building the production build
- `git clone` private repository

While trying to setup `bun:sqlite` database, the IDE shows TypeError. For that we need to install `bun-types` package and also append `"types": ["bun-types"]` to the `tsconfig.json`. While initializing the database with the SQLite database file name, make sure the file exists in the root of the project folder. Setting up drizzle was easy-peasy, though for separate file based schemas in a dedicated `/schema` folder, we need to have an `index.ts` inside that folder and for every new schema, we need to register it inside `index.ts`. For example, if we have a new schema named `users.ts`, we need to register it as `export * from './users'` so that we can import in the `client.ts` where we initialize the SQLite database for use in the application.

The files, for drizzle setup looks like --

```ts
// ./src/database/schema/users.ts
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	phone: text('phone').unique(),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
})
```

```ts
// ./src/database/schema/index.ts
export * from './users'
```

```ts
// ./src/database/client.ts
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'
import { DATABASE_URL } from '$env/static/private'

const sqlite = new Database(DATABASE_URL, { strict: true, readwrite: true })

export const db = drizzle(sqlite, { schema })
```

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/database/schema/*',
	out: './src/database/migrations',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
})
```

The run scripts for drizzle are --

```json
{
	"db:generate": "drizzle-kit generate",
	"db:migrate": "drizzle-kit migrate",
	"db:studio": "drizzle-kit studio"
}
```

To test the setup, I added a few entries to the `users` table using _drizzle studio_. To test the database setup I loaded the `users` in `+layout.server.ts` as --

```ts
// src/routes/+layout.server.ts
import { db } from '$database/client'
import { users } from '$database/schema'
import { desc } from 'drizzle-orm'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
	const _users = await db.query.users.findMany({
		orderBy: desc(users.createdAt)
	})

	return { users: _users }
}
```

So far, all okay. Now, moving to deploying this to DigitalOcean Droplet, we need to spin up a new droplet using the DigitalOcean dashboard. We also need to add a SSH key so that we can connect it from our PC Terminal. To generate an SSH key, go to the terminal and run `ssh-keygen` and answer to the prompts given. The public key will be stored in `~/.ssh/id_rsa_something.pub`, `cat` the file and put the contents in the form provided by DigitalOcean to add a new SSH key. After that the droplet will spin up. Copy the droplet IP address and ssh into the instance from the terminal by running `ssh root@ip_address`. It should login to the droplet instance.

For production build, we need to change the `adapter` in `svelte.config.js` file and replace `@sveltejs/adapter-auto` with `svelte-adapter-bun`. After that if we run `bun run build`, we'll get an error <strong class="text-red-500">[vite]: Rollup failed to resolve import "bun:sqlite".</strong> This is because when we run `bun run build` it runs as a `node` runtime. But we're using `bun:sqlite`. So, we need to explicitly declare it and run the build as `bun --bun run vite build`. This will generate a `build` folder inside the project folder. To test if the build and database integration ran well, we can test the build by running `bun ./build/index.js`.

Moving to deployment, I'd put the code in a private GitHub repository. So, when I `git clone`d into the repository using https, I got https clone deprecation error. Because, GitHub now supports only secured SSH connections for private repositories, so I created an SSH key in my droplet, copied the public key and added it to public SSH keys in GitHub as signature verification. To test if our connection is established, we can run `ssh -T git@github.com`, which on being successful will show that we're logged in successfully as _so-and-so-username_. After that we can `git clone ssh_repo_link` and get the project inside the droplet.

`cd`ing to the project and making the necessary installs and setups (.env addition), running the build and starting the server will run the production build at port 3000 which we can see by going to the link `http://droplet_ip:3000`. However, we need the server to run even if the the terminal is closed. So, we need to install `pm2` for this. But, `pm2` supports node by default. So, `bun:sqlite` won't run and it'll throw error. For this, we need to run `pm2 start --interpreter ~/.bun/bin/bun ./build/index.js` which will start the server and keep it running on port 3000 even if we close our terminal.

However, we should be able to go to `http://droplet_ip` and see our application, without mentioning the port 3000. For this, _Nginx_ reverse proxying comes to the rescue. Basically, when we go to a website link, the default port is 80. So, proxying our server port 3000 to 80 will let us view the application in the default link. So, we need to install and setup Nginx as --

```bash
apt install nginx # installs nginx in the droplet
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/app_name.config # copy contents of the default nginx configuration into a new config file
```

Next we need to edit the `app_name.config` file as --

```
server {
	listen 80; # remove the default_server thing or else it'll throw error
	listen [::]:80;

	server_name domain_or_ip_address;

	location / {
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   		proxy_set_header Host $host;
    	proxy_pass http://127.0.0.1:3000;
   		proxy_http_version 1.1;
    	proxy_set_header Upgrade $http_upgrade;
    	proxy_set_header Connection "upgrade";
	}
}
```

Next run --

```bash
ln -s /etc/nginx/sites-available/app_name.config /etc/nginx/sites-enabled # copies the config to enabled sites folder
nginx -t # test the nginx configuration, ok means we're good to go
```

Next we need to enable firewall so that not all ports are available for outside traffic. For this we need to run `ufw enable` and to support traffic for port 80, we need to add it to `ufw app list` as `ufw allow 'Nginx Full'`. Also, we need to run `ufw allow ssh` or else we won't be able to ssh again into the instance once we logout. Finally, we need to run `service nginx restart` and then if we check `http://droplet_ip`, we can see our application.

_That's it._
