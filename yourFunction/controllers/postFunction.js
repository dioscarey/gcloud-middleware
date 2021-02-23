const postFunction = async (ctx) => {
    try {
      const {id} = ctx.req.body;
       
      console.log(ctx.test());
      
      // This respond function is customizable in your middleware
      return ctx.respond(200, {id});
  
    } catch(err) {
        console.log(err);
        ctx.respond(500);
    }
}

module.exports = postFunction;