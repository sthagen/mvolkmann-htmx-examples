import {Elysia} from 'elysia';
import {html} from '@elysiajs/html'; // enables use of JSX
import {staticPlugin} from '@elysiajs/static'; // enables static file serving
import {Html} from '@kitajs/html';

const badPasswords = ['password', '12345678'];

const existingEmails = [
  'old@aol.com',
  'existing@gmail.com',
  'test@hotmail.com'
];

const app = new Elysia();
app.use(html());
// This causes link and script tags to look for files in the public directory.
app.use(staticPlugin({prefix: ''}));

const BaseHtml = ({children}: {children: Html.Children}) => (
  <html>
    <head>
      <title>htmx email validation</title>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://unpkg.com/htmx.org@1.9.9"></script>
    </head>
    <body>{children}</body>
  </html>
);

app.get('/', () => {
  const reset = {
    'hx-on:htmx:after-request': `console.log(event); if (event.detail.pathInfo.requestPath === '/account' && event.detail.successful) this.reset()`
  };

  return (
    <BaseHtml>
      <h2>Sign Up</h2>
      <form hx-post="/account" hx-target="#result" {...reset}>
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            hx-get="/email-validate"
            hx-target="#email-error"
            hx-trigger="keyup changed delay:200ms"
            name="email"
            placeholder="email"
            required
            size="30"
            type="email"
          />
          <span class="error" id="email-error" />
        </div>
        <div>
          <label for="password">Password</label>
          <input
            id="password"
            hx-get="/password-validate"
            hx-target="#password-error"
            hx-trigger="blur"
            minlength="8"
            name="password"
            placeholder="password"
            required
            size="20"
            type="password"
          />
          <span class="error" id="password-error" />
        </div>
        {/* HTML form validation will not work if the hx-post attribute
            is moved from the form to this button. */}
        <button>Submit</button>
      </form>
      <div id="result" />
    </BaseHtml>
  );
});

type Context = {
  query: {
    email: string;
    password: string;
  };
};

function validEmail(email: string) {
  return !existingEmails.includes(email);
}

function validPassword(password: string) {
  if (!password) return true;
  return password.length >= 8 && !badPasswords.includes(password);
}

app.get('/email-validate', ({query}: Context) => {
  return validEmail(query.email) ? '' : 'email in use';
});

app.get('/password-validate', ({query}: Context) => {
  return validPassword(query.password) ? '' : 'invalid password';
});

app.post('/account', ({body, set}: any) => {
  const {email, password} = body;
  const goodEmail = validEmail(email);
  const goodPassword = validPassword(password);
  const good = goodEmail && goodPassword;
  // TODO: When JSX is returned, the response code is always 200.
  // TODO: I think this is a bug in Elysia.
  // TODO: See https://github.com/elysiajs/elysia/issues/415.
  set.status = good ? 200 : 400;
  console.log('/account: set.status =', set.status);
  return (
    <>
      {!goodEmail && (
        <span class="error" hx-swap-oob="true" id="email-error">
          email in use
        </span>
      )}
      {!goodPassword && (
        <span class="error" hx-swap-oob="true" id="password-error">
          invalid password
        </span>
      )}
      <span>{good ? 'A new account was created.' : ''}</span>
    </>
  );
});

app.listen(1919);
console.log('listening on port', app.server?.port);
