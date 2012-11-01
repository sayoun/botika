function checkResourceForBuilding() {

    // return [];

    var checks = {};
    checks.level = 0;
    checks.needed = [];

    checks.level = parseInt($('#buildingUpgrade div[class="buildingLevel"]').text().replace(/[^\d]/g, ''));

    $('#buildingUpgrade ul[class=resources] > li[class!="time"]').each(function()
        {
            var resource_needed = parseInt($(this).text().match(/((\d|,|\.)+k?).*$/i)[1].replace(/[^\d]/g, ''));

            var entry = {};
            entry.name = $(this).attr('class').replace(/ alt/g, '');
            entry.value = resource_needed;

            checks.needed.push(entry);
        });

    return checks;
}

var processBuild = function(name, cargo) {

    this.echo('Process build for: '+name);
    // this.capture('test-'+name+'.png');
    dump(cargo);

    if (this.exists('#mainview > #locations > li[class="'+cargo.building+'"] > a'))
    {
        this.echo('building found ! '+cargo.building);

        this.thenClick('#mainview > #locations > li[class="'+cargo.building+'"] > a');

        this.then(function() {
            this.echo('sur la vue du batiment normalement :) '+cargo.building);
            // this.capture('building_'+cargo.building+'.png');

            if (this.exists('#buildingUpgrade'))
            {

                if (this.exists('#upgradeInProgress'))
                {
                    this.echo('BUILDING ALREADY USED !');
                }
                else
                {
                    this.echo('on peut upgrader ici !');

                    // on recup le prix du batiment
                    var checks = this.evaluate(checkResourceForBuilding);
                    // dump(checks);
                    // dump(mega_data['data']['resources'][name]);

                    if (checks.level < cargo.level)
                    {
                        // le level du batiment est plus petit que ce qu'on veut build donc OK
                        this.echo('building level OK');

                        var ok = true;
                        // on va checker qu'on a assez de chaque resource
                        this.each(checks.needed, function(self, resource)
                        {
                            if ( resource.value <= mega_data['data']['resources'][name][resource.name]['value'] )
                            {
                                this.echo('OK for '+resource.name);
                            }
                            else
                            {
                                this.echo('NOK for: '+resource.name);
                                ok = false;
                            }
                        });

                        if (ok)
                        {
                            // on lance la construction
                            this.thenClick('#buildingUpgrade li[class="upgrade"] > a');
                            this.echo('BUILD LAUNCHED ! '+cargo.building);
                        }
                        else
                        {
                            // on skip la construction
                            this.echo('BUILD CANCELED ! '+cargo.building);
                        }
                    }
                    else
                    {
                        this.echo('building level NOK');
                    }
                }
            }
            else
            {
                this.echo('level max !');
            }
        });
    }
    else
    {
        this.echo('building NOT found '+cargo.building);
    }

    // on revient sur la vue de la ville
    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    // this.then(function() {
    //     this.wait(3000);
    //     this.echo('** post viewcity click **');
    //     this.capture('where_are_we.png');
    // });
}

casper.todo_build = function(item, names) {

    // this.echo(item.source);
    // this.echo(item.cargo);
    // dump(item);

    var timeur = Math.floor((Math.random()*3000)+1);
    this.echo('timeur = '+ timeur);
    this.wait(timeur);

    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+item.source+"']"));

    this.evaluate(function(term) {
            document.querySelector('#citySelect').selectedIndex = term;
            document.querySelector('#citySelect').onchange();
        }, { term: names.indexOf(item.source) });

    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    this.then(function() {

        this.each(item['cargo'], function(self, cargo) {

            this.then(function() {
                processBuild.call(this, item.source, cargo);
                // dump(mega_data);
            });

            this.then(function() {
                // this.exit();
            });
        });
    });

    return [];
}

casper.todo_tranport = function(item, names) {

    var timeur = Math.floor((Math.random()*3000)+1);
    this.echo('timeur = '+ timeur);
    this.wait(timeur);

    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+item.source+"']"));

    // this.echo(names.indexOf(item.source));

    this.evaluate(function(term) {
            document.querySelector('#citySelect').selectedIndex = term;
            document.querySelector('#citySelect').onchange();
        }, { term: names.indexOf(item.source) });

    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    this.then(function() {

        if (this.exists('#mainview > #locations > li[class="port"] > a'))
        {
            this.thenClick('#mainview > #locations > li[class="port"] > a');
            this.then(function() {
                // this.capture('port1.png');

                // AUTO ACCEPT SHIP BUYOUT
                if (this.exists('div[class="forminput"] > a'))
                {
                    this.thenClick('div[class="forminput"] > a');
                };

                this.thenClick('#mainview > div[class="contentBox01h"] li[title="'+item.destination+'"] > a');
                this.then(function() {
                    // this.capture('port2.png');

                    var entry = {};
                    this.each(item['cargo'], function(self, cargo) {
                        // cargo_resource   = wood
                        // cargo_tradegood1 = wine
                        // cargo_tradegood2 = marble
                        // cargo_tradegood3 = glass
                        // cargo_tradegood4 = sulfur

                        var field_name = '';
                        if (cargo.resource == 'wood')
                        {
                            field_name = 'cargo_resource';
                        }
                        if (cargo.resource == 'wine')
                        {
                            field_name = 'cargo_tradegood1';
                        }
                        if (cargo.resource == 'marble')
                        {
                            field_name = 'cargo_tradegood2';
                        }
                        if (cargo.resource == 'glass')
                        {
                            field_name = 'cargo_tradegood3';
                        }
                        if (cargo.resource == 'sulfur')
                        {
                            field_name = 'cargo_tradegood4';
                        }

                        if (!this.exists('#mainview > form input[name="'+field_name+'"]'))
                        {
                            this.echo(item.source+' has no resource '+cargo.resource);
                            return;
                        }

                        entry[field_name] = cargo.number;
                    });

                    this.fill('#mainview > form', entry, false);

                    this.then(function() {
                        // this.capture('port3.png');
                        this.echo(this.fetchText('#arrival'));

                        // on submit !
                        this.thenClick('#submit');
                    });
                });
            });
        }
    });

    return [];
};
