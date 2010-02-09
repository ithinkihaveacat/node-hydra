function Hello(name) {
    Router.call(this);
    this.name = name;
}

Hello.prototype = Object.create(Router.prototype);

Hello.prototype["GET /$"] = function(req) {

    return {
        status: 200,
        headers: {
            "content-type": "text/plain"
        },
        body: "Hello, " + this.name + "!\n"
    }

}

Hello.prototype["PUT /$"] = function(req) {

    this.name = req.body;

    return {
        status: 200,
        headers: {
            "Content-Type": "text/plain"
        },
        body: this.name + "\n"
    }

}