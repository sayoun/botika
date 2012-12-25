casper.action_report = function action_report() {
    // #advCities
    this.thenClick('#advCities a:first-child');
    this.then(function() {
        // this.capture('new_location1.png');
        var news = this.evaluate(getCitiesInfo);
        // dump(news);
        // mega_data.news = news;

        this.thenClick('#inboxCity div[class="next"] a:first-child');
        this.then(function() {
            // this.capture('new_location1.png');
            var news2 = this.evaluate(getCitiesInfo);
            // dump(news2);
            // news.push.apply(news, news2)
            mega_data.news = news.concat(news2);
        });
    });
    // #advResearch
    this.thenClick('#advResearch a:first-child');
    this.then(function() {
        // this.capture('new_location3.png');
        var research = this.evaluate(getResearchInfo);
        // dump(research);
        mega_data.research = research;
    });
    // #advDiplomacy
    this.thenClick('#advDiplomacy a:first-child');
    this.then(function() {
        // this.capture('new_location4.png');
        var diplomacy = this.evaluate(getDiplomacyInfo);
        // dump(diplomacy);
        mega_data.diplomacy = diplomacy;

        // AUTO ACCEPT CULTURAL TREATY
        // TODO : if multiple entries loop on each one
        if (this.exists('div[class="reaction"] a[class="answerYes"]')) {
            this.thenClick('div[class="reaction"] a[class="answerYes"]');

            this.then(function() {
                var entry = {};
                entry['content'] = 'Merci !';
                this.fill('#notice > form', entry, true);
            });
        }
    });
    casper.get_data(true);
    // #advMilitary
    this.thenClick('#advMilitary a:first-child');
    this.then(function() {
        // this.capture('new_location2.png');
        var military = this.evaluate(getMilitaryInfo);
        // dump(military);
        mega_data.military = military;
    });
};

casper.action_todo = function action_todo() {
    todo_json = JSON.parse(fs.read(todo_file));
    // dump(todo_json);

    casper.get_data(false);
    // TODO : ajouter le code du get ressource global (sans le vin et les advisors)
    // factoriser la fonction au dessus qui recup les resources pour moduler suivants les params optionnels

    this.then(function() {
        if (todo_json['transport'])
        {
            this.echo('transport found !');

            this.each(todo_json['transport'], function(self, item, i) {
                this.then(function() {
                    if (item['done'] == true)
                    {
                        this.echo('TODO TRANSPORT ALREADY DONE');
                    }
                    else
                    {
                        // GET GLOBAL RESOURCE INFO
                        var data = this.evaluate(getGlobalInfo);
                        // dump(data);
                        mega_data['global'] = data;

                        if (mega_data['global']['ships_available'] == 0)
                        {
                            // no ship at all
                            this.echo('NOT ENOUGH SHIPS TO SEND, ABORT !');
                        }
                        else
                        {
                            this.todo_tranport(item, names, i);
                        }
                    }
                });
            });
        }
        if (todo_json['build'])
        {
            this.echo('build found !');

            this.each(todo_json['build'], function(self, item, i) {
                this.then(function() {
                    if (item['done'] == true)
                    {
                        this.echo('TODO BUILD ALREADY DONE');
                    }
                    else
                    {
                        this.todo_build(item, names, i);
                    }
                });
            });
        }
    });

    this.then(function() {
        // on sauve le todo.json
        fs.write(todo_file, utils.serialize(todo_json, 4), 'w');
    });
};

casper.get_data = function get_data(wine) {
        //  POST ADVISORS
    this.then(function() {

        // GET GLOBAL RESOURCE INFO
        var data = this.evaluate(getGlobalInfo);
        // dump(data);
        mega_data['global'] = data;
        mega_data['data'] = {
            'resources': {},
            'buildings': {},
            'construction': {},
            'wine': {}
        };

        // FOR EACH CITY
        this.each(names, function(casper, name, i) {
            this.echo('Fecthing data for ' + name + ' - ' + i);

            // this.wait(1000);
            var timeur = Math.floor((Math.random()*3000)+1);
            this.echo('timeur = '+ timeur);
            this.wait(timeur);

            this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+name+"']"));

            this.evaluate(function(term) {
                document.querySelector('#citySelect').selectedIndex = term;
                document.querySelector('#citySelect').onchange();
            }, { term: i });

            this.thenClick('#changeCityForm li[class="viewCity"] > a');

            this.then(function() {
                processPage.call(this, name, wine);
                // dump(mega_data);
            });

            this.then(function() {
                // this.exit();
            });
        });
    });
};

casper.action_decision = function action_decision() {

    // TODO : ajouter le code du get ressource global (sans le vin et les advisors)
    // factoriser la fonction au dessus qui recup les resources pour moduler suivants les params optionnels

    this.then(function() {

        // FOR EACH CITY
        this.each(names, function(casper, name, i) {
            this.then(function() {
                this.echo('analyzing resources for: '+ name);
                local_data = mega_data['data']['resources'][name];
                assign_donation = false;

                if (local_data['wood']['full'] > 90)
                {
                    assign_donation = true;
                }

                if (assign_max_workers || assign_donation)
                {
                    var timeur = Math.floor((Math.random()*3000)+1);
                    this.echo('timeur = '+ timeur);
                    this.wait(timeur);

                    this.thenClick(x("//form[@id='changeCityForm']//ul[@class='optionList']//li[text()='"+name+"']"));

                    this.evaluate(function(term) {
                        document.querySelector('#citySelect').selectedIndex = term;
                        document.querySelector('#citySelect').onchange();
                    }, { term: i });

                    this.thenClick('#changeCityForm li[class="viewCity"] > a');

                    this.then(function() {
                        if (assign_donation)
                        {
                            current_wood = local_data['wood']['value'];
                            this.echo('alert too much wood: '+local_data['wood']['full']+'%, must donate !');
                            // dump(local_data['wood']);

                            should_donate = local_data['worked']['wood']*8;
                            this.echo(name+' produce '+local_data['worked']['wood']+ ' per hour, should donate: '+ should_donate);

                            if (should_donate <= current_wood)
                            {
                                must_donate = should_donate
                            }
                            else {
                                must_donate = current_wood
                            }

                            this.echo("let's donate: "+must_donate+' !');
                        }
                    });

                    this.thenClick('#changeCityForm li[class="viewIsland"] > a');
                    this.then(function() {
                        // this.capture('island1.png');

                        to_complete_tradegood = 0;
                        to_complete_wood = 0;

                        this.thenClick('#mainview > #islandfeatures > #resource > a');
                        this.then(function() {
                            // this.capture('island2.png');
                            this.echo('on the island: wood');

                            max_mine_wood = this.fetchText('#resUpgrade div[class="content"] > ul[class="resources"] li[class="wood"]').replace(/[^\d]/g, '');
                            current_mine_wood = this.fetchText('#resUpgrade div[class="content"] > div > ul[class="resources"] li[class="wood"]').replace(/[^\d]/g, '');
                            to_complete_wood = max_mine_wood-current_mine_wood;
                            this.echo('wood mine: max:'+max_mine_wood+' current:'+current_mine_wood+' needed:'+to_complete_wood);

                            this.then(function() {

                                // ASSIGN MAX WORKERS TO EACH RESOURCE
                                if (assign_max_workers)
                                {
                                    if (this.exists('#workersWrapper a[class="setMax"]'))
                                    {
                                        this.then(function() {
                                            slider_config = this.evaluate(function() {
                                                tab = {};
                                                $('#resource > script').each(function()
                                                {
                                                    matched = $(this).html().match(/overcharge : \d+/g);
                                                    if ( matched != null) {
                                                        tab.overcharge = parseInt(matched[0].replace(/[^\d]/g, ''));
                                                        tab.maxvalue = parseInt($(this).html().match(/maxValue : \d+/g)[0].replace(/[^\d]/g, ''));
                                                        tab.inivalue = parseInt($(this).html().match(/iniValue : \d+/g)[0].replace(/[^\d]/g, ''));
                                                    }
                                                });
                                                return tab;
                                            });
                                            this.echo('workers:'+slider_config['inivalue']+' max:'+slider_config['maxvalue']);
                                        });

                                        this.then(function() {
                                            if (slider_config['inivalue'] != slider_config['maxvalue'])
                                            {
                                                this.fill('form#setWorkers', {
                                                    'rw': slider_config['maxvalue']
                                                }, true);

                                                this.then(function() {
                                                    this.echo(name+" has assigned max workers: "+slider_config['maxvalue']+' !');
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        });
                        this.thenClick('#changeCityForm li[class="viewIsland"] > a');

                        this.thenClick('#mainview > #islandfeatures > #tradegood > a');
                        this.then(function() {
                            // this.capture('island3.png');
                            this.echo('on the island: tradegood');

                            max_mine_tradegood = this.fetchText('#resUpgrade div[class="content"] > ul[class="resources"] li[class="wood"]').replace(/[^\d]/g, '');
                            current_mine_tradegood = this.fetchText('#resUpgrade div[class="content"] > div > ul[class="resources"] li[class="wood"]').replace(/[^\d]/g, '');
                            to_complete_tradegood = max_mine_tradegood-current_mine_tradegood;
                            this.echo('tradegood mine: max:'+max_mine_tradegood+' current:'+current_mine_tradegood+' needed:'+to_complete_tradegood);

                            this.then(function() {

                                // ASSIGN MAX WORKERS TO EACH RESOURCE
                                if (assign_max_workers)
                                {
                                    if (this.exists('#workersWrapper a[class="setMax"]'))
                                    {
                                        this.then(function() {
                                            slider_config = this.evaluate(function() {
                                                tab = {};
                                                $('#tradegood > script').each(function()
                                                {
                                                    matched = $(this).html().match(/overcharge : \d+/g);
                                                    if ( matched != null) {
                                                        tab.overcharge = parseInt(matched[0].replace(/[^\d]/g, ''));
                                                        tab.maxvalue = parseInt($(this).html().match(/maxValue : \d+/g)[0].replace(/[^\d]/g, ''));
                                                        tab.inivalue = parseInt($(this).html().match(/iniValue : \d+/g)[0].replace(/[^\d]/g, ''));
                                                    }
                                                });
                                                return tab;
                                            });
                                            this.echo('workers:'+slider_config['inivalue']+' max:'+slider_config['maxvalue']);
                                        });

                                        this.then(function() {
                                            if (slider_config['inivalue'] != slider_config['maxvalue'])
                                            {
                                                this.fill('form#setWorkers', {
                                                    'tw': slider_config['maxvalue']
                                                }, true);

                                                this.then(function() {
                                                    this.echo(name+" has assigned max workers: "+slider_config['maxvalue']+' !');
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        });

                        // this.then(function() {
                        //     this.exit();
                        // });

                        if (assign_donation)
                        {
                            this.thenClick('#changeCityForm li[class="viewIsland"] > a');

                            this.then(function() {
                                if (to_complete_tradegood <= to_complete_wood)
                                {
                                    this.echo('trade mine chosen for donation');
                                    to_clic = '#mainview > #islandfeatures > #tradegood > a';
                                }
                                else
                                {
                                    this.echo('wood mine chosen for donation');
                                    to_clic = '#mainview > #islandfeatures > #resource > a';
                                }
                                this.thenClick(to_clic);

                                this.then(function() {
                                    // this.capture('island4.png');

                                    if (this.exists('#donateWood'))
                                    {
                                        this.fill('form:not(.ambrosiaDonateForm)', {
                                            'donation': must_donate
                                        }, true);

                                        this.then(function() {
                                            this.echo(name+" has donate: "+must_donate+' !');
                                        });
                                    }
                                    else
                                    {
                                        this.echo('mine already upgrading !');
                                    }
                                });
                            });
                        };
                    });
                }

            });
        });
    });
};

casper.action_tasks = function action_tasks() {
    daily_json = JSON.parse(fs.read(daily_file));
    todo_json = JSON.parse(fs.read(todo_file));
    // dump(todo_json);

    var n = new Date();
    n.setHours(0,0,0,0);
    today_timestamp = Math.floor(n.getTime() / 1000);
    casper.echo("today_timestamp:" + today_timestamp);

    // casper.get_data(true);
    // TODO : ajouter le code du get ressource global (sans le vin et les advisors)
    // factoriser la fonction au dessus qui recup les resources pour moduler suivants les params optionnels

    this.then(function() {
        if (daily_json['tasks'])
        {
            this.echo('tasks found !');

            this.each(daily_json['tasks'], function(self, item, i) {
                this.then(function() {

                    if (parseInt(item['timestamp']) == today_timestamp)
                    {
                        this.echo('TASK ALREADY DONE FOR TODAY');
                    }
                    else
                    {
                        casper.echo("daily_json_timestamp:" + item['timestamp']);
                        // GET GLOBAL RESOURCE INFO
                        var data = this.evaluate(getGlobalInfo);
                        // dump(data);
                        mega_data['global'] = data;

                        if (item['name'] == 'balance')
                        {
                            this.echo('TASK BALANCE FOUND');
                            this.action_balance(item, names, i, todo_json);

                            daily_json['tasks'][i]['timestamp'] = today_timestamp;
                        }

                    }
                });
            });
        }
    });

    this.then(function() {
        // dump(daily_json);
        // on sauve le daily.json
        fs.write(daily_file, utils.serialize(daily_json, 4), 'w');
    });

    this.then(function() {
        // on sauve le todo.json
        fs.write(todo_file, utils.serialize(todo_json, 4), 'w');
    });
};