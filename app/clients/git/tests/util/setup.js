module.exports = function setup(options) {
  var server = require("./server");
  var cleanup = require("./cleanup");
  var setClientToGit = require("./setClientToGit");

  // Sets up a temporary test blog and cleans it up after
  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  // Set up a clean server for each test
  beforeEach(server.start);
  afterEach(server.close);

  // Clean a bare repo in app/clients/git/data if needed
  afterEach(cleanup);

  if (options.setClientToGit !== false)
    beforeEach(function(done) {
      var context = this;

      setClientToGit(this.blog, this.server.port, function(err, repoUrl) {
        if (err) return done(err);

        context.repoUrl = repoUrl;
        done();
      });
    });
};
