const http = require('http');

const Koa = require('koa');
const Router = require('koa-router');
const request = require('supertest');
const Rollbar = require('rollbar');

Error.stackTraceLimit = 10000;

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
});

const router = new Router();

router.get('/', () => { throw new Error('12345') });

async function createServer() {
  const app = new Koa();
  
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.log('error:');
      console.log(error.valueOf());
      console.log('ctx.request:');
      console.log(JSON.stringify(ctx.request, null, 2));

      rollbar.error(
        error,
        {
          custom: {
            request: ctx.request,
          },
        }
      );
      ctx.body = { error: error.message };
    }
  });
  
  app.use(router.routes()).use(router.allowedMethods());
  
  return http.createServer(app.callback());
}

createServer().then(server => {
  server.listen(56789, async err => {
    console.log(`app is listening on port ${56789}\n`);
    await request(server).get('/');
  });
});
