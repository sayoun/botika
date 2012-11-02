
function dump_to_disk() {
    fs.write(filename_to_dump, mega_data, 'a')
};

function getCitiesInfo() {
    // return [];
    var news = [];
    $('#inboxCity tbody tr[class!="pgnt"]').each(function()
            {
                var entry= {};

                if ($('td[class="wichtig"]', this).size() > 0)
                {
                    entry.new = '*';
                }

                entry.city    = $('td:eq(2)',this).text().trim();
                entry.date    = $('td:eq(3)',this).text();
                entry.subject = $('td:eq(4)',this).text();

                news.push(entry);
            });

    return news;
};

function getMilitaryInfo() {
    // return [];
    var military = [];
    $('#fleetMovements table[class="locationEvents"] tr').each(function()
            {
                if ($(this).hasClass('own'))
                {
                    var entry= {};

                    var cargo = [];

                    var obj = this;

                    $('div[class="unitBox"]',obj).each(function()
                    {
                        var cargo_item = {};
                        cargo_item.type   = $('div:eq(0) > img',this).attr('src');
                        cargo_item.number = $('div:eq(1)', this).text();

                        cargo.push(cargo_item);
                    });

                    entry.time_left   = $('td:eq(1)',this).text();
                    entry.cargo       = cargo;
                    entry.origin      = $('td:eq(4)',this).text();
                    entry.type        = $('td:eq(6)',this).attr('title');
                    entry.destination = $('td:eq(8)',this).text();

                    military.push(entry);
                }
            });

    return military;
};

function getResearchInfo() {

    var research = [];

    var entry = {};
    entry.points   = $('ul[class="researchLeftMenu"] li:eq(1)').text();
    entry.per_hour = $('ul[class="researchLeftMenu"] li:eq(2)').text();

    research.push(entry);

    $('#currentResearch ul[class="researchTypes"] li').each(function()
            {
                if ($(this).hasClass('researchType'))
                {
                    var entry = {};

                    entry.name         = $('h4',this).text().trim();
                    // entry.description  = $('p',this).text();

                    entry.cost  = $('ul[class="resources"] li[class="researchPoints"]', this).text();
                    entry.diff  = $('ul[class="resources"] li[class="researchPointsDiff"]', this).text().trim();
                    entry.eta   = $('div[class="researchTime"]',this).text().trim();

                    research.push(entry);
                }
            });

    return research;
};

function getDiplomacyInfo() {

    var diplo = [];

    $('tr[id^="message"]').each(function()
        {
            var entry = {};

            if ($(this).hasClass('new'))
            {
                entry.new = '*';
            }

            entry.sender  = $('td:eq(2)',this).text().trim();
            entry.subject = $('td:eq(3)',this).text();
            entry.source  = $('td:eq(4)',this).text();
            entry.date    = $('td:eq(5)',this).text();

            diplo.push(entry);
        });

    return diplo;
};

function getResourceInfo() {

    // return [];
    var util_resource = {
        get_current_resource:function(res)
        {
            var resources = $('#cityResources > ul[class=resources]');

            return this.get_resource( $('li[class="'+res+'"]', resources) );
        },
        get_resource:function(data)
        {
            return parseInt($('span' ,data).eq(1).text().replace(/[^\d]/g, ''));
        },
        is_resource_worked:function(res)
        {
            var resources = $('#cityResources > ul[class=resources]');

            var resource_tooltip = $('li[class="'+res+'"]', resources) ;

            return ($('div > span' ,resource_tooltip).size() == 2);
        },
        get_resource_rate:function(res)
        {
            var resources = $('#cityResources > ul[class=resources]');

            var resource_tooltip = $('li[class="'+res+'"]', resources) ;

            var per_hour = parseInt($('div' ,resource_tooltip).text().replace(/,/g, '').match(/(\d+)/)[0]);

            return per_hour;
        }
    };

    var resources = {
        'wood' : {},
        'wine' : {},
        'marble' : {},
        'glass' : {},
        'sulfur' : {}
    };
    resources['wood'].value        = parseInt($('#value_wood').text().replace(/[^\d]/g, ''));
    resources['wine'].value        = parseInt($('#value_wine').text().replace(/[^\d]/g, ''));
    resources['marble'].value      = parseInt($('#value_marble').text().replace(/[^\d]/g, ''));
    resources['glass'].value       = parseInt($('#value_crystal').text().replace(/[^\d]/g, ''));
    resources['sulfur'].value      = parseInt($('#value_sulfur').text().replace(/[^\d]/g, ''));

    var selector = $('#cityResources li[class="wood"]');
    var capacity_max = parseInt($('div' ,selector).text().match(/((\d|,|\.)+k?).*$/i)[1].replace(/[^\d]/g, ''));

    resources.max_capacity = capacity_max;

    resources['worked'] = {};

    var ENUM_RESOURCES  = [
                            'wood',
                            'wine',
                            'marble',
                            'glass',
                            'sulfur'
                            ];

    for (i = 0; i < ENUM_RESOURCES.length; i++)
    {
        var res = ENUM_RESOURCES[i];
        if (util_resource.is_resource_worked(res))
        {
            var per_hour = util_resource.get_resource_rate(res);
            resources['worked'][res] = per_hour;

            resources[res].full_time = Math.round( (resources.max_capacity - resources[res].value) / per_hour );
        }

        resources[res].full = Math.round( resources[res].value / resources.max_capacity * 100);
    }

    return resources;
}

function getGlobalInfo() {

    // return [];

    var entry = {};
    entry.ambrosia  = parseInt($('#accountAmbrosia').text());
    entry.ships     = $('#accountTransporter').text();
    entry.gold      = parseInt($('#value_gold').text().replace(/[^\d]/g, ''));

    return entry;
}

function getNames() {

    var names = [];

    $('#changeCityForm ul[class="optionList"] li').each(function()
    {
        names.push($(this).text());
    });

    return names;
}

function getWineUsedInfo() {

    // return [];

    var entry = {};

    entry.wine_used = parseInt($('#wineAmount option:selected').text().replace(/[^\d]/g, ''));
    entry.wine_current = parseInt($('#value_wine').text().replace(/[^\d]/g, ''));
    if (entry.wine_used > 0)
    {
        entry.empty = Math.round(entry.wine_current / (entry.wine_used * 24));
    }

    return entry;
}

function parsePage() {

    // return [];

    var liste_batiments = {};
    liste_batiments['buildings'] = [];
    liste_batiments['construction'] = [];

    $('#mainview > #locations > li[id^=position]').each(function()
        {
            var type = $(this).attr('class');
            if ( (type != 'buildingGround land') && (type != 'buildingGround shore') )
            {
                // type = type.toLowerCase();

                var level = $('a', this).attr('title').match(/\d+$/);

                if ( $('div[class="constructionSite"]', this).size() > 0)
                {
                    level = level+' -> '+(parseInt(level)+1);

                    var entry = {};
                    entry.type = type;
                    entry.level = level;
                    entry.end_date = $('script', this).html().match(/enddate: (.*),/)[1]
                    entry.current_date = $('script', this).html().match(/currentdate: (.*),/)[1];

                    liste_batiments.construction.push(entry);
                }
                else
                {
                    level = level[0];
                }

                var temp_json = {};
                temp_json[type] = level;

                liste_batiments.buildings.push(temp_json);
            }
        });

    return liste_batiments;
}

var processPage = function(name, wine) {

    this.echo('Process page for: '+name);
    // this.capture('test-'+name+'.png');

    if (wine)
    {
        // GET WINE CONSUME INFO
        if (this.exists('#mainview > #locations > li[class="tavern"] > a'))
        {
            this.thenClick('#mainview > #locations > li[class="tavern"] > a');
            this.then(function() {
                var city_data_wine = this.evaluate(getWineUsedInfo);
                mega_data['data']['wine'][name] = city_data_wine;

                // on revient sur l'ecran de la ville
                this.thenClick('#changeCityForm li[class="viewCity"] > a');
            });
        }
    }
    // GET BATIMENT INFO
    var city_building = this.evaluate(parsePage);
    // GET RESOURCE INFO
    var city_data = this.evaluate(getResourceInfo);

    mega_data['data']['resources'][name] = city_data;
    mega_data['data']['buildings'][name] = city_building.buildings;
    mega_data['data']['construction'][name] = city_building.construction;
};
