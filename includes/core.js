casper.action_report = function action_report() {
    // #advCities
    this.thenClick('#advCities a:first-child');
    this.then(function() {
        // this.capture('new_location1.png');
        var news = this.evaluate(getCitiesInfo);
        // dump(news);
        mega_data.news = news;
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
        if (this.exists('div[class="reaction"]')) {
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
}

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
                        this.todo_tranport(item, names, i);
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
}