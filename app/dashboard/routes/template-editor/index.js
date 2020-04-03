const Express = require("express");
const TemplateEditor = new Express.Router();
const config = require("config");
const bodyParser = require("body-parser").urlencoded({ extended: false });
const helper = require("helper");
const formJSON = helper.formJSON;
const Template = require("template");

TemplateEditor.use(function(req, res, next) {
	res.locals.partials.color = "template-editor/inputs/color";
	res.locals.partials.font = "template-editor/inputs/font";
	res.locals.partials.range = "template-editor/inputs/range";
	next();
});

TemplateEditor.param("viewSlug", require("./load/template-views"));
TemplateEditor.param("viewSlug", require("./load/template-view"));
TemplateEditor.param("templateSlug", require("./load/template"));

TemplateEditor.param("templateSlug", function(req, res, next) {
	res.locals.base = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.templateSlug}`;
	res.locals.preview = `https://preview-of-my-${req.template.slug}-on-${req.blog.handle}.${config.host}`;
	next();
});

TemplateEditor.use("/:templateSlug/:section", function(req, res, next) {
	res.locals.selected = {};
	res.locals.selected[req.params.section] = "selected";
	next();
});

TemplateEditor.route("/:templateSlug/settings")
	.all(require("./load/font-inputs"))
	.all(require("./load/color-inputs"))
	.all(require("./load/range-inputs"))
	.post(bodyParser, function(req, res, next) {
		let updatedLocals = formJSON(req.body, Template.metadataModel).locals;

		let locals = req.template.locals;

		for (let key in updatedLocals) locals[key] = updatedLocals[key];

		Template.update(req.blog.id, req.params.templateSlug, { locals }, function(
			err
		) {
			if (err) return next(err);
			res.message(req.baseUrl + "/" + req.url, "Success!");
		});
	})
	.get(function(req, res) {
		res.locals.partials.yield = "template-editor/template-settings";
		res.locals.partials.sidebar = "template-editor/template-settings-sidebar";
		res.render("template-editor/layout");
	});

TemplateEditor.use("/:templateSlug/delete", require("./deleteTemplate"));

TemplateEditor.use(function(err, req, res, next) {
	console.log(err);
	return next(err);
});

TemplateEditor.use("/:templateSlug/source-code", require("./source-code"));

module.exports = TemplateEditor;
