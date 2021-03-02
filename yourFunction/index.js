const postFunction = require('./controllers/postFunction');
const YOURMiddleware = require('./YOURMiddleware'); // You can create a private package to make it sharable or you can find a way to share your middleware with other functions.

const testContext = () => {
    console.log("testContext")
}

const gcf = new YOURMiddleware()

gcf.context({
    test: testContext
})

gcf.use((asdf, next) => {
    console.log("async...");
    next();
});

const someMiddlewareHere = (ctx, next) => {
    console.log('Middleware post');
    next();
};

gcf.post('/', someMiddlewareHere, postFunction);
gcf.get('/', someMiddlewareHere, (ctx) => ctx.respond(200));
gcf.get('/test/:id', (ctx) => {
    const {id} = ctx.urlMatches;
    return ctx.respond(200, {id: id})
});

exports.yourFunction = gcf.run;