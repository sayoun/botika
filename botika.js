var casper = require('casper').create({
    viewportSize: {
        width: 1024,
        height: 768
    },
    // logLevel: 'debug',
    // verbose: true,
    clientScripts: ["includes/jquery-1.8.2.min.js"]
});

var dump = require("utils").dump;
var utils = require("utils");
var fs = require('fs');
var x = require('casper').selectXPath;
var format = require('utils').format;
var account_file = 'account.json';
var account_info = {};
var bookmark_file = 'bookmark.json';
var bookmark_info = {};
var force_town_key = false;
var assign_max_workers = true;

phantom.injectJs('includes/cli.js');
phantom.injectJs('includes/report.js');
phantom.injectJs('includes/todo.js');
phantom.injectJs('includes/core.js');

casper.cli_check();

var filename_to_dump = 'report.json';
var todo_file = 'todo.json';
var daily_file = 'daily.json';
var mega_data = {};

casper.start('http://fr.ikariam.com', function() {

    this.fill('form#loginForm', {
        'uni_url':          account_info.server,
        'name':             account_info.login,
        'password':         account_info.password,
        'mobileCheckBox':   true
    }, true);

});

var names = [];
var next;

//  POST LOGIN
casper.then(function() {
    // this.capture('ikariam_login.png');

    // AUTO ACCEPT DAILY BONUS
    if (this.exists('div[class="dailyActivityButton"] input[class~="okButton"]')) {
        this.thenClick('div[class="dailyActivityButton"] input[class~="okButton"]');
    }

    if (force_town_key)
    {
        this.output('FORCING TOWN REQUESTED:'+force_town_key);
        // ON FORCE LA VILLE A CHECKER
        names.push(force_town_key);
    }
    else
    {
        // GET NB TOWN (NAMES)
        names = this.evaluate(getNames);
        // dump(names);
    }

    if (action_key == 'report')
    {
        casper.action_report();
    }

    if (action_key == 'todo')
    {
        casper.action_todo();
        casper.action_report();
    }

    if ((action_key == 'report') || (action_key == 'todo'))
    {
        casper.action_decision(false);
        casper.action_tasks();
    }

});

casper.run(function() {
    this.output('running done.');

    // TODO : sauver aussi le todo.json qui aura mis a jour avec ce qu'il a fait
    // dump(mega_data);
    fs.write(filename_to_dump, utils.serialize(mega_data, 4), 'w');

    this.exit(0);
});
