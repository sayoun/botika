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

var processBuild = function(name, cargo, index) {

    this.output('Process build for: '+name);
    // this.capture('test-'+name+'.png');
    dump(cargo);

    selector = '#mainview > #locations > li[class="'+cargo.building+'"] > a';

    if (cargo.building == 'port1')
    {
        this.output("need to upgrade port "+cargo.building+" but there are 2 ports :(");
        selector = '#mainview > #locations li#position1[class="port"] > a';
    }
    else if (cargo.building == 'port2')
    {
        this.output("need to upgrade port "+cargo.building+" but there are 2 ports :(");
        selector = '#mainview > #locations li#position2[class="port"] > a';
    }

    if (this.exists(selector))
    {
        this.output('building found ! '+cargo.building);

        this.thenClick(selector);

        this.then(function() {
            this.output('sur la vue du batiment normalement :) '+cargo.building);
            // this.capture('building_'+cargo.building+'.png');

            if (this.exists('#buildingUpgrade'))
            {

                if (this.exists('#upgradeInProgress'))
                {
                    this.output('BUILDING ALREADY USED !');
                }
                else
                {
                    this.output('on peut upgrader ici !');

                    // on recup le prix du batiment
                    var checks = this.evaluate(checkResourceForBuilding);
                    // dump(checks);
                    // dump(mega_data['data']['resources'][name]);

                    if (checks.level < cargo.level)
                    {
                        // le level du batiment est plus petit que ce qu'on veut build donc OK
                        this.output('building level OK');

                        var ok = true;
                        // on va checker qu'on a assez de chaque resource
                        this.each(checks.needed, function(self, resource)
                        {
                            resource_actual = mega_data['data']['resources'][name][resource.name]['value'];
                            if ( resource.value <= mega_data['data']['resources'][name][resource.name]['value'] )
                            {
                                this.output('OK for: '+resource.name+' actual:'+resource_actual+' needed:'+resource.value);
                            }
                            else
                            {
                                this.output('NOK for: '+resource.name+ ' actual:'+resource_actual+' needed:'+resource.value+' diff:'+(resource.value-resource_actual));
                                ok = false;
                            }
                        });

                        if (ok)
                        {
                            // on lance la construction
                            this.thenClick('#buildingUpgrade li[class="upgrade"] > a');
                            this.output('BUILD LAUNCHED ! '+cargo.building);

                            // TODO : check qu'on a bien upgrade jusqu'au level demande
                            // si oui on update le todojson en mémoire

                            // dump(todo_json['transport'][index]);
                            if ((checks.level+1) == cargo.level)
                            {
                                todo_json['build'][index]['done'] = true;
                                this.output('TODO BUILD index to update for item '+name +': '+ index);
                            }
                            else
                            {
                                this.output('THERE IS STILL BUILDING TO MAKE for '+name)
                            }
                        }
                        else
                        {
                            // on skip la construction
                            this.output('BUILD CANCELED ! '+cargo.building);
                        }
                    }
                    else
                    {
                        this.output('building level NOK, actual:'+checks.level+' needed:'+cargo.level);
                        if (checks.level >= cargo.level)
                        {
                            todo_json['build'][index]['done'] = true;
                        }
                    }
                }
            }
            else
            {
                this.output('level max !');
            }
        });
    }
    else
    {
        this.output('building NOT found '+cargo.building);
        // not found, maybe we can create it ?
        if (this.exists('#mainview > #locations > li[class="buildingGround land"] > a'))
        {
            this.output('free space for building found !');

            this.thenClick('#mainview > #locations > li[class="buildingGround land"] > a');

            this.then(function() {
                if (this.exists('#buildings > li[class="building '+cargo.building+'"] a[class="button build"]'))
                {
                    this.output('building '+cargo.building+' available in choices');
                    this.thenClick('#buildings > li[class="building '+cargo.building+'"] a[class="button build"]');
                }
                else
                {
                    this.output('building '+cargo.building+' not available in choices');
                }
            });
        }
    }

    // on revient sur la vue de la ville
    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    // this.then(function() {
    //     this.wait(3000);
    //     this.output('** post viewcity click **');
    //     this.capture('where_are_we.png');
    // });
}

casper.todo_action = function(item, names, index) {

    var timeur = Math.floor((Math.random()*3000)+1);
    this.output('timeur = '+ timeur);
    this.wait(timeur);

    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+item.source+"']"));

    this.evaluate(function(term) {
            document.querySelector('#citySelect').selectedIndex = term;
            document.querySelector('#citySelect').onchange();
        }, { term: names.indexOf(item.source) });

    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    if (item.action == 'max_tavern')
    {
        // SET MAX WINE CONSUME
        if (this.exists('#mainview > #locations > li[class="tavern"] > a'))
        {
            this.thenClick('#mainview > #locations > li[class="tavern"] > a');
            this.then(function() {
                // assign max wine
                this.output('assigning max wine');
                this.thenClick('#units a[class="setMax"]');

                // submit
                this.then(function() {
                    this.fill('form#wineAssignForm', {}, true);
                    this.output('ACTION: assigned max wine to '+item.source);
                });
                // back to town view
                this.thenClick('#changeCityForm li[class="viewCity"] > a');
            });

            this.then(function() {
                todo_json['action'][index]['done'] = true;
            });
        }
    }

    if (item.action == 'max_academy')
    {
        // SET MAX WINE CONSUME
        if (this.exists('#mainview > #locations > li[class="academy"] > a'))
        {
            this.thenClick('#mainview > #locations > li[class="academy"] > a');
            this.then(function() {
                // assign max wine
                this.output('assigning max scientists');
                this.thenClick('#setScientists a[class="setMax"]');

                // submit
                this.then(function() {
                    this.fill('form#setScientists', {}, true);
                    this.output('ACTION: assigned max scientists to '+item.source);
                });
                // back to town view
                this.thenClick('#changeCityForm li[class="viewCity"] > a');
            });

            this.then(function() {
                todo_json['action'][index]['done'] = true;
            });
        }
    }

};

casper.todo_build = function(item, names, index) {

    // this.output(item.source);
    // this.output(item.cargo);
    // dump(item);

    this.then(function() {
        if (mega_data['data']['construction'][item.source])
        {
            if (mega_data['data']['construction'][item.source].length > 0)
            {
                this.output('SKIPPING BUILDING ALREADY RUNNING FOR :'+item.source);
                return false;
            }
            else
            {
                var timeur = Math.floor((Math.random()*3000)+1);
                this.output('timeur = '+ timeur);
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
                            processBuild.call(this, item.source, cargo, index);
                            // dump(mega_data);
                        });

                        this.then(function() {
                            // this.exit();
                        });
                    });
                });
            }
        }
    });


    return [];
}

casper.send_transport = function(source, destination, resource, number, index, bookmark) {

    var timeur = Math.floor((Math.random()*3000)+1);
    this.output('timeur = '+ timeur);
    this.wait(timeur);

    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+source+"']"));

    this.evaluate(function(term) {
            document.querySelector('#citySelect').selectedIndex = term;
            document.querySelector('#citySelect').onchange();
        }, { term: names.indexOf(source) });

    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    this.then(function() {

        if (bookmark)
        {
            this.output('BOOKMARK needed for: '+destination);

            info = destination.split('/');
            bk_index = info[0];
            bk_city_name = info[1];
            bk_city_info = bookmark_info[bk_index][bk_city_name];
            this.output('BOOKMARK island_id: '+bk_city_info.island_id+' town_id: '+bk_city_info.town_id);

            this.thenOpen('http://m16.fr.ikariam.com/index.php?view=island&id='+bk_city_info.island_id).then(function() {
                this.thenClick('#'+bk_city_info.town_id);
                this.thenClick('#actions li[class="transport "] a');
            });
        }
        else
        {
            if (this.exists('#mainview > #locations > li[class="port"] > a'))
            {
                this.thenClick('#mainview > #locations > li[class="port"] > a');
                // CLICK ON THE TOWN ICON
                this.thenClick('#mainview > div[class="contentBox01h"] li[title="'+destination+'"] > a');
            }
        }

        this.then(function() {
            // this.capture('port1.png');

            // AUTO ACCEPT SHIP BUYOUT
            if (this.exists('div[class="forminput"] > a'))
            {
                this.thenClick('div[class="forminput"] > a');
            };

            // this.capture('port2.png');
            var entry = {};

            // cargo_resource   = wood
            // cargo_tradegood1 = wine
            // cargo_tradegood2 = marble
            // cargo_tradegood3 = glass
            // cargo_tradegood4 = sulfur

            var field_name = '';
            if (resource == 'wood')
            {
                field_name = 'cargo_resource';
            }
            if (resource == 'wine')
            {
                field_name = 'cargo_tradegood1';
            }
            if (resource == 'marble')
            {
                field_name = 'cargo_tradegood2';
            }
            if (resource == 'glass')
            {
                field_name = 'cargo_tradegood3';
            }
            if (resource == 'sulfur')
            {
                field_name = 'cargo_tradegood4';
            }

            entry[field_name] = number;

            // fill the form
            this.fill('#mainview > form', entry, false);

            this.then(function() {
                // this.capture('port3.png');
                this.output('estimated arrival: '+this.fetchText('#arrival'));

                // on submit !
                this.thenClick('#submit');
            });

            this.then(function() {
                // post submit
                // this.capture('port4.png');

                if (this.exists('#mainview ul[class="error"]'))
                {
                    // transport failed
                    this.output('Transport FAILED :'+this.fetchText('#mainview ul[class="error"]'));
                }
                else
                {
                    this.output('Transport STARTED for:'+source+'->'+destination+' '+number+' '+resource);

                    if (todo_json['transport'][index]['cargo'][0]['number'] > number)
                    {
                        todo_json['transport'][index]['cargo'][0]['number'] -= number;
                    }
                    else
                    {
                        todo_json['transport'][index]['cargo'][0]['number'] = 0;
                        todo_json['transport'][index]['done'] = true;
                    }
                }
            });
        });
    });
};

casper.todo_tranport_split = function(item, names, index) {

    if (item.split) {
        this.then(function() {
            split_resource = item['cargo'][0].resource;
            split_number = item['cargo'][0].number;
            this.output('WE MUST SPLIT THIS CARGO:'+split_number+' '+split_resource);

            var tab_eligible_towns = [];
            // FOR EACH CITY
            this.each(names, function(casper, name, i) {
                this.then(function() {
                    // this.output('checking resources for: '+ name);
                    local_data = mega_data['data']['resources'][name];

                    if (local_data[split_resource]['value'] > 0)
                    {
                        this.output(name+': '+local_data[split_resource]['value']+' '+split_resource);

                        // do not try to send from self
                        if (name != item.destination)
                        {
                            if (item.exclude_sources)
                            {
                                if (item.exclude_sources.indexOf(name) != -1)
                                {
                                    this.output('TOWN '+name+' MUST BE EXCLUDED!');
                                }
                                else
                                {
                                    this.output('TOWN '+name+' MUST BE USED!');
                                    tab_eligible_towns.push(name);
                                }
                            }
                            else
                            {
                                tab_eligible_towns.push(name);
                            }
                        }
                    }
                });
            });
            this.then(function() {
                cargo_max_capacity = mega_data['global']['ships_available'] * 500;
                this.output('WE HAVE '+mega_data['global']['ships_available']+' ('+cargo_max_capacity+') SHIPS AVAILABLE!');

                needed_ships = split_number / 500;

                if (needed_ships <= mega_data['global']['ships_available'])
                {
                    // need to send less than we can
                    need_to_send_ships = needed_ships;
                }
                else
                {
                    // need to send more than we can
                    need_to_send_ships = mega_data['global']['ships_available'];
                }

                this.output('WE NEED TO USE '+need_to_send_ships+' SHIPS');
                // if (split_number <= cargo_max_capacity)
                // {
                //     // need to send less than we can
                //     need_to_send = split_number;
                // }
                // else
                // {
                //     // need to send more than we can
                //     need_to_send = cargo_max_capacity;
                // }

                // cargo_part_average = Math.floor(need_to_send / tab_eligible_towns.length);
                // this.output('average cargo part per town:'+cargo_part_average);

                ships_per_town = Math.round(need_to_send_ships / tab_eligible_towns.length);
                this.output('average ships per town:'+ships_per_town+'('+(ships_per_town*500)+')');
                cargo_part_average = ships_per_town*500;

                cargo_iteration_to_send = cargo_part_average * tab_eligible_towns.length;

                this.then(function() {
                    this.each(tab_eligible_towns, function(casper, town, i) {

                        if (i == (tab_eligible_towns.length-1))
                        {
                            cargo_part_average += ((need_to_send_ships*500) - cargo_iteration_to_send);
                        }

                        if (mega_data['data']['resources'][town][split_resource]['value'] >= cargo_part_average)
                        {
                            this.output('sending:'+cargo_part_average+' '+split_resource+' from:'+town+' to:'+item.destination);
                            this.send_transport(town, item.destination, split_resource, cargo_part_average, index, item.bookmark);
                        }
                        else
                        {
                            this.output('not enough '+split_resource+' in '+town+':'+mega_data['data']['resources'][town][split_resource]['value']);
                        }
                    });
                });
            });
        });
    };
};

casper.todo_tranport = function(item, names, index) {

    var timeur = Math.floor((Math.random()*3000)+1);
    this.output('timeur = '+ timeur);
    this.wait(timeur);

    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+item.source+"']"));

    // this.output(names.indexOf(item.source));

    this.evaluate(function(term) {
            document.querySelector('#citySelect').selectedIndex = term;
            document.querySelector('#citySelect').onchange();
        }, { term: names.indexOf(item.source) });

    this.thenClick('#changeCityForm li[class="viewCity"] > a');

    if (item.bookmark)
    {
        this.output('BOOKMARK needed for: '+item.destination);

        info = item.destination.split('/');
        bk_index = info[0];
        bk_city_name = info[1];
        bk_city_info = bookmark_info[bk_index][bk_city_name];
        this.output('BOOKMARK island_id: '+bk_city_info.island_id+' town_id: '+bk_city_info.town_id);

        this.thenOpen('http://m16.fr.ikariam.com/index.php?view=island&id='+bk_city_info.island_id).then(function() {

            // this.then(function() {
            //     this.capture('bookmark_island_1.png');
            // });

            this.thenClick('#'+bk_city_info.town_id);

            // this.then(function() {
            //     this.capture('bookmark_island_2.png');
            // });

            this.thenClick('#actions li[class="transport "] a');

            // this.then(function() {
            //     this.capture('bookmark_island_3.png');
            // });

        });

        this.then(function() {
            // this.capture('port2.png');

            var entry = {};
            var total_cargo_to_send = 0;
            var cargo_max_capacity = mega_data['global']['ships_available'] * 500;
            var skipping = false;
            var partial_load = false;

            this.each(item['cargo'], function(self, cargo, cargo_index) {
                // cargo_resource   = wood
                // cargo_tradegood1 = wine
                // cargo_tradegood2 = marble
                // cargo_tradegood3 = glass
                // cargo_tradegood4 = sulfur

                if (!skipping)
                {
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
                        this.output(item.source+' has no resource '+cargo.resource);
                        return;
                    }

                    // total_cargo_to_send += cargo.number;
                    var cargo_space_left = cargo_max_capacity - total_cargo_to_send;

                    // some space left to load cargo in full ?
                    if ((total_cargo_to_send + cargo.number) <= cargo_max_capacity)
                    {
                        this.output('ok to load cargo, enough ships availables: '+mega_data['global']['ships_available']);

                        total_cargo_to_send += cargo.number;
                        entry[field_name] = cargo.number;

                        todo_json['transport'][index]['cargo'][cargo_index]['number'] = 0;
                    }
                    else if ( (cargo_space_left > 0) && (cargo_space_left <= cargo.number) )
                    {
                        // can we load at least some part of the cargo
                        this.output('loading partial cargo: '+cargo_space_left+' < '+cargo.number);

                        total_cargo_to_send += cargo_space_left;
                        entry[field_name] = cargo_space_left;

                        todo_json['transport'][index]['cargo'][cargo_index]['number'] -= cargo_space_left;

                        partial_load = true;
                    }
                    else
                    {
                        // only load this cargo and skip the rest
                        skipping = true;
                    }
                }
            }); // EACH

            // fill the form
            this.fill('#mainview > form', entry, false);

            this.then(function() {
                // this.capture('port3.png');
                this.output(this.fetchText('#arrival'));

                todo_json['transport'][index]['arrival'] = this.fetchText('#arrival');
                // on submit !
                this.thenClick('#submit');
            });

            this.then(function() {
                // post submit
                // this.capture('port4.png');

                if (this.exists('#mainview ul[class="error"]'))
                {
                    // transport failed
                    this.output('Transport FAILED :'+this.fetchText('#mainview ul[class="error"]'));
                }
                else
                {
                    // update the todo.json only if not skipped data
                    if (!skipping && !partial_load)
                    {
                        this.output('TODO TRANSPORT index to update for item '+item.source +': '+ index);
                        todo_json['transport'][index]['done'] = true;
                    }
                }
            });
        });
    }
    else {
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

                    // CLICK ON THE TOWN ICON
                    this.thenClick('#mainview > div[class="contentBox01h"] li[title="'+item.destination+'"] > a');
                    this.then(function() {
                        // this.capture('port2.png');

                        var entry = {};
                        var total_cargo_to_send = 0;
                        var cargo_max_capacity = mega_data['global']['ships_available'] * 500;
                        var skipping = false;
                        var partial_load = false;

                        this.each(item['cargo'], function(self, cargo, cargo_index) {
                            // cargo_resource   = wood
                            // cargo_tradegood1 = wine
                            // cargo_tradegood2 = marble
                            // cargo_tradegood3 = glass
                            // cargo_tradegood4 = sulfur

                            if (!skipping)
                            {
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
                                    this.output(item.source+' has no resource '+cargo.resource);
                                    return;
                                }

                                // total_cargo_to_send += cargo.number;
                                var cargo_space_left = cargo_max_capacity - total_cargo_to_send;

                                // some space left to load cargo in full ?
                                if ((total_cargo_to_send + cargo.number) <= cargo_max_capacity)
                                {
                                    this.output('ok to load cargo, enough ships availables: '+mega_data['global']['ships_available']);

                                    total_cargo_to_send += cargo.number;
                                    entry[field_name] = cargo.number;

                                    todo_json['transport'][index]['cargo'][cargo_index]['number'] = 0;
                                }
                                else if ( (cargo_space_left > 0) && (cargo_space_left <= cargo.number) )
                                {
                                    // can we load at least some part of the cargo
                                    this.output('loading partial cargo: '+cargo_space_left+' < '+cargo.number);

                                    total_cargo_to_send += cargo_space_left;
                                    entry[field_name] = cargo_space_left;

                                    todo_json['transport'][index]['cargo'][cargo_index]['number'] -= cargo_space_left;

                                    partial_load = true;
                                }
                                else
                                {
                                    // only load this cargo and skip the rest
                                    skipping = true;
                                }
                            }
                        }); // EACH

                        // fill the form
                        this.fill('#mainview > form', entry, false);

                        this.then(function() {
                            // this.capture('port3.png');
                            this.output(this.fetchText('#arrival'));
                            todo_json['transport'][index]['arrival'] = this.fetchText('#arrival');

                            // on submit !
                            this.thenClick('#submit');
                        });

                        this.then(function() {
                            // post submit
                            // this.capture('port4.png');

                            if (this.exists('#mainview ul[class="error"]'))
                            {
                                // transport failed
                                this.output('Transport FAILED :'+this.fetchText('#mainview ul[class="error"]'));
                            }
                            else
                            {
                                // update the todo.json only if not skipped data
                                if (!skipping && !partial_load)
                                {
                                    this.output('TODO TRANSPORT index to update for item '+item.source +': '+ index);
                                    todo_json['transport'][index]['done'] = true;
                                }
                            }
                        });
                    });
                });
            }
        });
    }
    return [];
};

casper.add_transport = function(source, target, tradegood, number) {

    if (! todo_json['transport'])
    {
        todo_json['transport'] = [];
    };

    var entry = {};
    var cargo = [];

    var cargo_item = {};
    cargo_item.number = number;
    cargo_item.resource = tradegood;

    cargo.push(cargo_item);

    entry.cargo = cargo;
    entry.cargo['number'] = number;
    entry.cargo['resource'] = tradegood;
    entry.destination = target;
    entry.source = source;
    // dump(entry);

    todo_json['transport'].push(entry);

    mega_data['data']['resources'][target][tradegood]['value'] += number;

    mega_data['data']['resources'][target][tradegood]['full'] = Math.round(
        mega_data['data']['resources'][target][tradegood]['value'] / mega_data['data']['resources'][target]['max_capacity'] * 100);
};

casper.get_city_low_tradegood_stock = function(names, tradegood) {

    var chosen_city = names[0];
    var chosen_value = 100;
    this.output('chosen start: '+chosen_city);

    this.each(names, function(casper, name, i) {
        if (mega_data['data']['resources'][name][tradegood]['full'] < chosen_value)
        {
            chosen_value = mega_data['data']['resources'][name][tradegood]['full'];
            chosen_city = name;
        }
    });

    this.output('lowest city: '+chosen_city+' with:'+chosen_value);
    return chosen_city;
};


casper.get_total_tradegood_stock = function(names, tradegood) {

    total_tradegood = 0;

    this.each(names, function(casper, name, i) {
        total_tradegood += mega_data['data']['resources'][name][tradegood]['value'];
    });

    this.output('total tradegood stock for '+tradegood+': '+total_tradegood);
    return total_tradegood;
};

casper.action_balance = function(item, names, index, todo_json) {

    // dump(mega_data['data']['resources']);

    var tradeGoods  = [
                    'marble',
                    'glass',
                    'sulfur',
                    'wine'
                    ];

    this.each(names, function(casper, name, i) {
        for(var i=0;i<tradeGoods.length;i++)
        {
            tradegood = tradeGoods[i];

            // only if we have workers for this tradegood
            if (mega_data['data']['resources'][name]['worked'][tradegood] > 0)
            {
                full = mega_data['data']['resources'][name][tradegood]['full'];

                if (full > 95)
                {
                    this.output(name+' is FULL:'+full+' for: '+tradegood+' need balance!');
                    target = this.get_city_low_tradegood_stock(names, tradegood);

                    // we move 10%
                    number = Math.floor(mega_data['data']['resources'][name][tradegood]['value'] * 0.10);
                    this.output('sending: '+number+' '+tradegood+' from:'+name+' to: '+target);

                    this.add_transport(name, target, tradegood, number);
                }
            }
        }
    });
};

casper.action_equalize = function(item, names, index, todo_json) {

    var tradeGoods  = [
                    'wood',
                    ];

    for(var i=0;i<tradeGoods.length;i++)
    {
        tradegood = tradeGoods[i];
        // only wood for now
        total_tradegood = this.get_total_tradegood_stock(names, tradegood);
        // average needed per town
        average_tradegood = Math.round(total_tradegood / names.length);
        this.output('average tradegood per town:'+average_tradegood);

        town_plus = [];
        town_minus = [];
        // for each town, compute diff
        this.each(names, function(casper, name, i) {
            diff = average_tradegood - mega_data['data']['resources'][name][tradegood]['value'];
            if (diff > 0) {
                extra_output = '+';
            }
            else
            {
                extra_output = '';
            }
            this.output('change to make for town '+name+ ': '+extra_output+diff);
            var entry = {};
            entry.name = name;
            entry.value = Math.abs(diff);
            if (diff < 0) {
                town_plus.push(entry);
            }
            else {
                town_minus.push(entry);
            }
        });

        function compare(a,b) {
            if (a.value < b.value)
                return 1;
            if (a.value > b.value)
                return -1;
            return 0;
        };

        town_plus.sort(compare);
        town_minus.sort(compare);
        // dump(town_plus);
        // dump(town_minus);

        for (var index_plus=0;index_plus<town_plus.length;index_plus++)
        {
            this.output('distributing from '+town_plus[index_plus]['name']+': '+town_plus[index_plus]['value']);
            trade_available = town_plus[index_plus]['value'];
            for (var index_minus=0;index_minus<town_minus.length;index_minus++)
            {
                this.output("\t "+town_minus[index_minus]['name']+' need '+town_minus[index_minus]['value']);
                // skip if 0 if needed for trade
                if ((town_plus[index_plus]['value'] == 0) || (town_minus[index_minus]['value'] == 0))
                    continue;

                // if plus city has enough trade stock to fill the diff
                if (trade_available >= town_minus[index_minus]['value'])
                {
                    number = town_minus[index_minus]['value'];
                    name = town_plus[index_plus]['name'];
                    target = town_minus[index_minus]['name'];
                    this.output('sending: '+number+' '+tradegood+' from:'+name+' to: '+target);
                    town_plus[index_plus]['value'] -= number;
                    town_minus[index_minus]['value'] = 0;
                    trade_available = town_plus[index_plus]['value'];
                    this.add_transport(name, target, tradegood, number);
                }
                else
                {   // plus city has not enough to fill this minus city
                    // send what we have anyway and update
                    number = trade_available;
                    name = town_plus[index_plus]['name'];
                    target = town_minus[index_minus]['name'];
                    this.output('sending: '+number+' '+tradegood+' from:'+name+' to: '+target);
                    town_plus[index_plus]['value'] = 0;
                    town_minus[index_minus]['value'] -= number;
                    trade_available = 0;
                    this.add_transport(name, target, tradegood, number);
                }
            }
        }
    }
};