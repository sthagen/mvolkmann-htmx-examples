import {Context, Hono} from 'hono';
import {serveStatic} from 'hono/bun';
import './reload-server';

const POKEMON_URL_PREFIX = 'https://pokeapi.co/api/v2/pokemon-species';
const ROWS_PER_PAGE = 10;

type Pokemon = {
  name: string;
  url: string;
};

function TableRow(page: number, pokemon: Pokemon, isLast: boolean) {
  const attrs = isLast
    ? {
        'hx-trigger': 'revealed',
        'hx-get': '/pokemon-rows?page=' + (page + 1),
        'hx-indicator': '.htmx-indicator',
        'hx-swap': 'afterend'
      }
    : {};
  const {name, url} = pokemon;
  const id = url.split('/')[6]; // 7th part of the URL
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  return (
    <tr {...attrs}>
      <td>{id}</td>
      <td>{name}</td>
      <td>
        <img alt={name} src={imageUrl} />
      </td>
    </tr>
  );
}

const app = new Hono();

// Serve static files from the public directory.
app.use('/*', serveStatic({root: './public'}));

app.get('/pokemon-rows', async (c: Context) => {
  const page = Number(c.req.query('page'));
  if (!page) throw new Error('page query parameter is required');

  // Bun.sleepSync(500); // simulates long-running query

  const offset = (page - 1) * ROWS_PER_PAGE;
  const url = POKEMON_URL_PREFIX + `?offset=${offset}&limit=${ROWS_PER_PAGE}`;
  const response = await fetch(url);
  const json = await response.json();
  const pokemonList = json.results as Pokemon[];

  return c.html(
    <>
      {pokemonList.map((pokemon, index) => {
        const isLast = index === ROWS_PER_PAGE - 1;
        return TableRow(page, pokemon, isLast);
      })}
    </>
  );
});

export default app;
