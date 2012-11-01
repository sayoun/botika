
casper.cli_check = function cli_check() {
    // removing default options passed by the Python executable
    casper.cli.drop("cli");
    casper.cli.drop("casper-path");

    if (casper.cli.args.length === 0 && Object.keys(casper.cli.options).length === 0) {
        casper
            .echo("You must provide some args.")
            .exit(1)
        ;
    }

    if ( casper.cli.options['login'] )
    {
        var account_json = JSON.parse(fs.read(account_file));
        account_info = account_json[casper.cli.options['login']];
    }
    else
    {
        casper
            .echo("Login is mandatory")
            .exit(1)
        ;
    }

    if ( casper.cli.options['action'] )
    {
        action_key = casper.cli.options['action'];
    }
    else
    {
        casper
            .echo("Action is mandatory")
            .exit(1)
        ;
    }

    if ( casper.cli.options['force-town'] )
    {
        force_town_key = casper.cli.options['force-town'];
    }
};
