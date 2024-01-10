# Wallace Museum

The official repository for the Wallace Museum website, powered by Sveltekit.

## Requirements

To run this app, you will need to connect it up with a database. I use a PostgreSQL database, but you can use any database supported by Prisma. The connection string should be stored in a `.env` file in the root of the project. The `.env` file should look like this (replace with your own database connection string):

```env
DATABASE_URL=postgres://user:password@host:port/database
```

## Cloning this project

To set this project up locally, clone the repository and install the dependencies with `npm install` (or `pnpm install` or `yarn`), then start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment. I use Vercel, so I use the Vercel adapter.