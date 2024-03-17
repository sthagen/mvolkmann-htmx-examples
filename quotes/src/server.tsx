import {type Context, Hono} from 'hono';
import {serveStatic} from 'hono/bun';
import './reload-server.js';

const app = new Hono();

// Serve static files from the public directory.
app.use('/*', serveStatic({root: './public'}));

app.get('/quote', async (c: Context) => {
  const quote = await (await fetch('https://api.quotable.io/random')).json();
  return c.text(quote);
});

export default app;
