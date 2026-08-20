import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import type { RequestHandler } from 'express';
import type { ApolloServerPlugin } from '@apollo/server';
import { Context, createContext } from './context';
import { schema } from '../graphql';

const offlineLandingPagePlugin = (): ApolloServerPlugin<Context> => ({
  async serverWillStart() {
    return {
      async renderLandingPage() {
        return {
          html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Work Whiz GraphQL</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: #f7f7f4;
        color: #1d1d1b;
      }

      main {
        width: min(960px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 48px 0;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0;
      }

      p {
        margin: 0 0 24px;
        color: #55554f;
      }

      label {
        display: block;
        margin: 18px 0 8px;
        font-weight: 650;
      }

      textarea,
      pre {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid #d5d5cb;
        border-radius: 6px;
        background: #ffffff;
        color: #1d1d1b;
        font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }

      textarea {
        min-height: 220px;
        padding: 14px;
        resize: vertical;
      }

      pre {
        min-height: 120px;
        overflow: auto;
        padding: 14px;
        white-space: pre-wrap;
      }

      button {
        margin-top: 14px;
        border: 0;
        border-radius: 6px;
        background: #1d1d1b;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 650;
        padding: 10px 14px;
      }

      button:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #171717;
          color: #f3f3ef;
        }

        p {
          color: #b8b8b0;
        }

        textarea,
        pre {
          border-color: #3b3b37;
          background: #222220;
          color: #f3f3ef;
        }

        button {
          background: #f3f3ef;
          color: #171717;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Work Whiz GraphQL</h1>
      <p>This local GraphQL helper is self-contained. It sends requests to <code>/graphql</code> with the current browser cookies.</p>

      <label for="query">Operation</label>
      <textarea id="query">query Me {
  me {
    id
    email
    role
  }
}</textarea>

      <button id="run" type="button">Run Operation</button>

      <label for="result">Result</label>
      <pre id="result">No request sent yet.</pre>
    </main>

    <script>
      const button = document.getElementById('run');
      const query = document.getElementById('query');
      const result = document.getElementById('result');

      button.addEventListener('click', async () => {
        button.disabled = true;
        result.textContent = 'Running...';

        try {
          const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ query: query.value })
          });

          const json = await response.json();
          result.textContent = JSON.stringify(json, null, 2);
        } catch (error) {
          result.textContent = error instanceof Error ? error.message : String(error);
        } finally {
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`,
        };
      },
    };
  },
});

export const createGraphQLMiddleware = (): RequestHandler => {
  const apolloServer = new ApolloServer<Context>({
    schema,
    plugins: [offlineLandingPagePlugin()],
  });

  apolloServer.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  return expressMiddleware<Context>(apolloServer, { context: createContext });
};
