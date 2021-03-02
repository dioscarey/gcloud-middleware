// you can create your own path matcher or you can use any url matcher from npm.
const route = require('path-match')({
  sensitive: true,
  strict: true,
  end: true,
});

class YOURMiddleware {
constructor(opts = {}) {
  this.stack = []; // Middleware stack
  this.allowedMethodsCors = [];
  this.opts = {    
    allowedOriginCors: ['*'],
    allowedHeadersCors: ['Content-Type'],
    ...opts
  };
  this.ctx = { 
    // Default contexts don't use the response Object.
    // If you want to add a custom function with response dependency, add it in getCtx().
    throw: this.throw,
  }
}

context = (ctx = {}) => {
  this.ctx = {
    ...this.ctx,
    ...ctx
  }
}

use = (func) => {      
  this.stack.push({func});
}

manageMethods = (method, url, middlewares) => {
  const alteredMiddleware = [];
  for(const fpos in middlewares){
    if(typeof middlewares[fpos] === 'function'){
      alteredMiddleware.push({
        middlewareMethod: true,
        lastMiddleware: middlewares.length -1,
        pos: fpos,
        func: middlewares[fpos]
      })
    } else {
      throw new Error('Middleware must be a function.');
    }
  }

  if(this.allowedMethodsCors.findIndex(a => a === method) === -1)
      this.allowedMethodsCors.push(method);

  this.stack.push({
    url,
    method,
    middlewares: alteredMiddleware, 
    match: route(url)
  });
}

get = (url, ...middlewares) => {
  this.manageMethods('GET', url, middlewares);
}

post = (url, ...middlewares)  => {    
  this.manageMethods('POST', url, middlewares);
}

put = (url, ...middlewares)  => {
  this.manageMethods('PUT', url, middlewares);
}

patch = (url, ...middlewares)  => {
  this.manageMethods('PATCH', url, middlewares);
}

delete = (url, ...middlewares)  => {
  this.manageMethods('DELETE', url, middlewares);
}

// Your custom function that will be included in the context
respond = (res, status, body = {}) => {
  res.status(status);
  res.json(body);
  res.end();
  return res;
}

// Your custom function that will be included in the context
throw = (status = 500, message = {message: 'ERROR'}, error = {}) => {
  const err = {}
  err.status = status;
  err.message = message; 
  err.err = error;
  throw err;
}

getCtx = (req, res) => {
  // Expose your customer Respond function
  return  {
    ...this.ctx,
    respond: this.respond.bind(this, res),
  }
}

iniStackProcess = async (ctx) => {
  let prevIndex = -1;

  const itemStack = async (index, stack) => {
    if (index === prevIndex) {
      this.throwError('Next() function called multiple times');
    }
    
    prevIndex = index;
    const middleware = stack[index];       

    if(middleware) {
      if (middleware.method) { // your item stack is a method                    
        // If the method match with the request method then it injects all the middlewares in the middle of the stack.
        if(ctx.req.method === middleware.method && middleware.match(ctx.req.path)) {
          ctx.urlMatches = middleware.match(ctx.req.path);
          prevIndex = -1;
          return await itemStack(0, middleware.middlewares);
        }

        return await itemStack(index + 1, stack);

      } else { 
        // Your item stack can be part of the method middlware                    
        if(middleware.middlewareMethod && middleware.middlewareMethod.lastMiddleware == middleware.pos) {
          // Let's end up the last item of the stack.
          await middleware.func(ctx);
        } else {
          await middleware.func(ctx, () => {
            return itemStack(index + 1, stack);
          });
        }
                
      }

    } else {
      // If the stack doesn't match any url then it can returns 404.
      ctx.respond(404);
    }    
  }

  // start the stack from 0
  await itemStack(0, this.stack);
}

run = async (req, res) => {
  // From here is where the Cloud function is invoked.
  const ctx = {
    ...this.getCtx(req, res),
    req, 
    res
  };
  
  // Cloud function CORS
  // https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/master/functions/http/index.js#L223
  ctx.res.set('Access-Control-Allow-Origin', this.opts.allowedOriginCors.join(', '));

  if (ctx.req.method === 'OPTIONS') {
    ctx.res.set('Access-Control-Allow-Methods', this.allowedMethodsCors.join(', '));
    ctx.res.set('Access-Control-Allow-Headers', this.opts.allowedHeadersCors.join(', '));      
    return ctx.respond(200);
  }

  // it helps to prevent the middleware execution.
  if (this.allowedMethodsCors.indexOf(ctx.req.method) === -1){
    return ctx.respond(501);
  }

  // Going forward, your middleware will be executed
  await this.iniStackProcess(ctx);
}
}

module.exports = YOURMiddleware;