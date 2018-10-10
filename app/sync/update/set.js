var helper = require("helper");
var normalize = helper.pathNormalizer;
var rebuildDependents = require("./rebuildDependents");
var Ignore = require("./ignore");
var Metadata = require("metadata");
var Entry = require("entry");
var Preview = require("../../modules/preview");
var isPreview = require("../../drafts").isPreview;
var async = require("async");
var WRONG_TYPE = "WRONG_TYPE";
var PUBLIC_FILE = "PUBLIC_FILE";

function isPublic(path) {
  return (
    normalize(path).indexOf("/public/") === 0 ||
    normalize(path).indexOf("/_") === 0
  );
}

function isTemplate(path) {
  return normalize(path).indexOf("/templates/") === 0;
}

// var child_process = require("child_process");
// var numCPUs = require("os").cpus().length;
// var uuid = require("uuid/v4");
// var exitHook = require("async-exit-hook");

// exitHook(function(callback) {
//   killWorkers(callback);
// });

// exitHook.uncaughtExceptionHandler(function(err, callback) {
//   killWorkers(callback);
// });

// function killWorkers(callback) {
//   console.log("Unlocking all locks...");

//   async.each(
//     workers,
//     function(worker, next) {
//       console.log("Killing worker...");
//       worker.kill();
//       next();
//     },
//     function() {
//       console.log("Killed all workers...");
//       callback();
//     }
//   );
// }

// var workers = [];
// var worker;
// var jobs = {};

// function triggerCallback(message) {
//   jobs[message.id].callback(message.err, message.entry);
// }

// for (var i = 0; i < numCPUs; i++) {
//   worker = child_process.fork(__dirname + "/../../build");
//   worker.on("message", triggerCallback);
//   workers.push(worker);
// }

// function build(blog, path, options, callback) {
//   var worker = workers[Math.floor(Math.random() * workers.length)];
//   var id = uuid();

//   jobs[id] = {
//     blog: blog,
//     id: id,
//     path: path,
//     options: options,
//     callback: callback
//   };

//   worker.send({ blog: blog, path: path, id: id, options: options });
// }

var build = require('../../build');

module.exports = function(blog, path, options, callback) {
  var queue;

  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  // Blot likes leading slashes
  if (path[0] !== "/") path = "/" + path;

  queue = {
    is_preview: isPreview.bind(this, blog.id, path),
    dependents: rebuildDependents.bind(this, blog.id, path)
  };

  // Store the case-preserved name against the
  // path to this file
  if (options.name) {
    queue.metadata = Metadata.add.bind(this, blog.id, path, options.name);
  }

  async.parallel(queue, function(err, result) {
    if (err) return callback(err);

    // This is a preview file, don't create an entry
    if (result.is_preview) return callback();

    // The file belongs to a template and there
    // fore should not become a blog post.
    if (isTemplate(path)) return callback();

    // The file is public. Its name begins
    // with an underscore, or it's inside a folder
    // whose name begins with an underscore. It should
    // therefore not be a blog post.
    if (isPublic(path)) return Ignore(blog.id, path, PUBLIC_FILE, callback);

    build(blog, path, options, function(err, entry) {
      if (err && err.code === "WRONGTYPE")
        return Ignore(blog.id, path, WRONG_TYPE, callback);

      if (err) return callback(err);

      // This file is a draft, write a preview file
      // to the users Dropbox and continue down
      // We look up the remote path later in this module...
      if (entry.draft) Preview.write(blog.id, path);

      Entry.set(blog.id, entry.path, entry, callback);
    });
  });
};
