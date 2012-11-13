#!/bin/env python
# -*- coding: utf-8 -*-

import codecs
import sys
import subprocess
import json
import re
from time import time

streamWriter = codecs.lookup('utf-8')[-1]
sys.stdout = streamWriter(sys.stdout)


def convert_hours_to_human(dt):

    if dt:
        return "%dd %dh" % ((dt / 24), (dt % 24))
    return ""


def convert_seconds_to_human(dt):

    if dt:
        h = 0
        if dt > 3600:
            h = dt / 3600

        m = (dt - (h * 3600)) / 60
        return '%dh%dm' % (h, m)

    return ""


class Parser():
    output = []
    to_mail = False
    # data = []

    def dict_print(self, data):

        self.output.append(data)

    def get_news(self, data):

        dict_print = self.dict_print

        dict_print('-' * 100)
        dict_print('News')
        dict_print('-' * 100)

        for item in data:
            extra = '   '
            if 'new' in item:
                self.to_mail = True
                extra = '(*)'

            dict_print("%-20s %-10s %s %s" % (item['date'], item['city'], extra, item['subject'].replace('\n', ' ')))

        return 0

    def get_diplo_msg(self, data):

        dict_print = self.dict_print

        dict_print('-' * 100)
        dict_print('Diplomacy')
        dict_print('-' * 100)

        for item in data:
            extra = '   '
            if 'new' in item:
                self.to_mail = True
                extra = '(*)'

            dict_print("%-20s %-15s %s %s" % (item['date'], item['sender'], extra, item['subject']))

        return 0

    def parse_military_cargo_item(self, cargo):

        tab = []

        for cargo_item in cargo:
            if 'ship_transport' in cargo_item['type']:
                prefix = "%d ships: " % (int(cargo_item['number']))

            if 'resources' in cargo_item['type']:
                cargo_type = re.sub('skin/resources/icon_', '', cargo_item['type'])
                cargo_type = re.sub('.png', '', cargo_type)
                tab.append("%d %s" % (int(cargo_item['number']), cargo_type))

        return (prefix, ", ".join(tab))

    def get_military(self, data):

        dict_print = self.dict_print

        header = "%-20s \t%-10s \t%-20s \t%-45s \t%-8s" % ('source', '->', 'destination', 'cargo', 'temps restant')
        dict_print('-' * 150)
        dict_print(header)
        dict_print('-' * 150)

        for item in data:
            (prefix, cargo) = self.parse_military_cargo_item(item['cargo'])
            dict_print("%-20s \t%-10s \t%-20s \t%-45s \t%-8s" % (item['origin'],
                                re.match(r'Transport \((.*)\)', item['type']).group(1),
                                item['destination'],
                                '%s%s' % (prefix, cargo),
                                item['time_left']
                                ))

        dict_print('-' * 150)

    def get_resource_output(self, resource, data, output):

        full_in = ''
        if 'full_time' in data[resource]:
            full_in = '(' + convert_hours_to_human(data[resource]['full_time']) + ')'

        output.append("\t%-16s" % ("%7d (%2d%%) %s" % (
                                    data[resource]['value'],
                                    data[resource]['full'],
                                    full_in)))

        return 0

    def get_resources(self, data):

        dict_print = self.dict_print

        ENUM_RESOURCES = ('wood', 'marble', 'wine', 'glass', 'sulfur')

        header = "%10s \t%16s \t%16s \t%16s \t%16s \t%16s" % ('City', 'wood', 'marble', 'wine', 'glass', 'sulfur')
        dict_print('-' * 150)
        dict_print(header)
        dict_print('-' * 150)

        total_wood, total_marble, total_wine, total_glass, total_sulfur = 0, 0, 0, 0, 0

        for city in data:

            extra = ''
            output_resource_line = []

            for res in ENUM_RESOURCES:

                if data[city][res]['full'] > 95:
                    extra = '<- ** WARNING **'
                    self.to_mail = True

                self.get_resource_output(res, data[city], output_resource_line)

            dict_print("%-10s %s %s" % (city, ''.join(output_resource_line), extra))

            total_wood += data[city]['wood']['value']
            total_marble += data[city]['marble']['value']
            total_wine += data[city]['wine']['value']
            total_glass += data[city]['glass']['value']
            total_sulfur += data[city]['sulfur']['value']

        dict_print('-' * 150)
        dict_print("%-10s \t%16s \t%16s \t%16s \t%16s \t%16s" % ('Total',
                                                    total_wood,
                                                    total_marble,
                                                    total_wine,
                                                    total_glass,
                                                    total_sulfur
                                                    ))

        dict_print('-' * 150)

        return 0

    def get_wine_status(self, data):

        dict_print = self.dict_print

        header = "%-10s \t%12s \t%12s \t%12s" % ('City', 'wine current', 'wine used/h', 'empty in days')
        dict_print('-' * 100)
        dict_print(header)
        dict_print('-' * 100)

        total_wine_used, total_wine_current = 0, 0

        for item in data:
                extra = ''
                if 'empty' in data[item]:
                    if data[item].get('empty', 0) < 5:
                        extra = '<- ** WARNING **'
                        self.to_mail = True

                total_wine_current += data[item].get('wine_current', 0)
                total_wine_used += data[item].get('wine_used', 0)

                dict_print("%-10s \t%12s \t%12s \t%12s %s" % (item,
                                                    data[item].get('wine_current', 0),
                                                    data[item].get('wine_used', '--'),
                                                    data[item].get('empty', '--'),
                                                    extra
                                                    ))
        dict_print('-' * 100)
        dict_print("%-10s \t%12s \t%12s \t%12s" % ('Total',
                                    total_wine_current,
                                    total_wine_used,
                                    '-'))

        dict_print('-' * 100)
        return 0

    def get_buildings(self, data):

        dict_print = self.dict_print

        building_list = {}

        # common
        building_list['townHall'] = {}
        building_list['palaceColony'] = {}
        building_list['palace'] = {}
        building_list['museum'] = {}
        building_list['tavern'] = {}
        building_list['wall'] = {}
        building_list['safehouse'] = {}

        # common 2
        building_list['academy'] = {}
        building_list['dump'] = {}
        building_list['warehouse'] = {}
        building_list['port'] = {}
        building_list['shipyard'] = {}
        building_list['barracks'] = {}

        # boosters
        building_list['winegrower'] = {}
        building_list['glassblowing'] = {}
        building_list['forester'] = {}
        building_list['alchemist'] = {}
        building_list['stonemason'] = {}

        # reducteurs
        building_list['carpentering'] = {}
        building_list['architect'] = {}
        building_list['fireworker'] = {}
        building_list['vineyard'] = {}
        building_list['optician'] = {}

        for city in data:
            # print data[city]
            # print "*** city *** ", city
            for item in data[city]:
                # print "item", item
                for building in item:
                    level = item[building]
                    # print "%s %s %s" % (city, building, level)
                    # building already listed, likely a port
                    if city in building_list[building]:
                        building_list[building][city] += ',' + level
                    else:
                        building_list[building][city] = level

        header = "%-10s \t%-10s \t%8s \t%10s \t%10s \t%10s \t%10s" % ('City', 'townhall', 'rdg', 'museum', 'tavern', 'safehouse', 'wall')
        dict_print('-' * 110)
        dict_print(header)
        dict_print('-' * 110)

        for city in data:
            dict_print("%-10s \t%10s \t%8s \t%10s \t%10s \t%10s \t%10s" % (city,
                                                building_list['townHall'].get(city, '-'),
                                                building_list['palaceColony'].get(city, building_list['palace'].get(city, '-')),
                                                building_list['museum'].get(city, '-'),
                                                building_list['tavern'].get(city, '-'),
                                                building_list['safehouse'].get(city, '-'),
                                                building_list['wall'].get(city, '-'))
            )

        header = "%-10s \t%-10s \t%8s \t%10s \t%8s \t%10s \t%10s" % ('City', 'academy', 'dump', 'warehouse', 'port', 'shipyard', 'barracks')
        dict_print('-' * 110)
        dict_print(header)
        dict_print('-' * 110)

        for city in data:
            dict_print("%-10s \t%10s \t%8s \t%10s \t%8s \t%10s \t%10s" % (city,
                                                building_list['academy'].get(city, '-'),
                                                building_list['dump'].get(city, '-'),
                                                building_list['warehouse'].get(city, '-'),
                                                building_list['port'].get(city, '-'),
                                                building_list['shipyard'].get(city, '-'),
                                                building_list['barracks'].get(city, '-'))
            )

        header = "%-10s \t%-10s \t%10s \t%10s \t%10s \t%10s" % ('City', 'forester', 'glassblowing', 'winegrower', 'alchemist', 'stonemason')
        dict_print('-' * 110)
        dict_print(header)
        dict_print('-' * 110)

        for city in data:
            dict_print("%-10s \t%10s \t%10s \t%10s \t%10s \t%10s" % (city,
                                                building_list['forester'].get(city, '-'),
                                                building_list['glassblowing'].get(city, '-'),
                                                building_list['winegrower'].get(city, '-'),
                                                building_list['alchemist'].get(city, '-'),
                                                building_list['stonemason'].get(city, '-')
                                                )
            )

        header = "%-10s \t%-10s \t%10s \t%10s \t%10s \t%10s" % ('City', 'carpentering', 'architect', 'fireworker', 'vineyard', 'optician')
        dict_print('-' * 110)
        dict_print(header)
        dict_print('-' * 110)

        for city in data:
            dict_print("%-10s \t%10s \t%10s \t%10s \t%10s \t%10s" % (city,
                                                building_list['carpentering'].get(city, '-'),
                                                building_list['architect'].get(city, '-'),
                                                building_list['fireworker'].get(city, '-'),
                                                building_list['vineyard'].get(city, '-'),
                                                building_list['optician'].get(city, '-'))
            )

        return 0

    def get_constructions(self, data):

        dict_print = self.dict_print

        header = "%-10s \t%-12s \t%12s \t%20s \t%12s" % ('City', 'batiment', 'niveau', 'date fin', 'temps restant')
        dict_print('-' * 100)
        dict_print(header)
        dict_print('-' * 100)

        from datetime import datetime

        for item in data:
            if data[item]:
                # print item, data['data']['construction'][item]
                dict_print("%-10s \t%-12s \t%12s \t%20s \t%12s" % (item,
                                    data[item][0]['type'],
                                    data[item][0]['level'],
                                    datetime.fromtimestamp(int(data[item][0]['end_date'])),
                                    convert_seconds_to_human(int(data[item][0]['end_date']) - int(round(time())))
                                    ))

        dict_print('-' * 100)

        return 0

    def get_content(self):

        return "\n".join(self.output)

    def get_to_mail(self):

        return self.to_mail


fp = open('report.json')
data = json.load(fp)
fp.close()

p = Parser()

if 'construction' in data['data']:
    p.get_constructions(data['data']['construction'])

if 'military' in data:
    p.get_military(data['military'])

if 'news' in data:
    p.get_news(data['news'])

if 'diplomacy' in data:
    p.get_diplo_msg(data['diplomacy'])

if 'buildings' in data['data']:
    p.get_buildings(data['data']['buildings'])

if 'wine' in data['data']:
    p.get_wine_status(data['data']['wine'])

if 'resources' in data['data']:
    p.get_resources(data['data']['resources'])


print p.get_content()

try:
    p
except NameError:
    p = None

if p:
    if p.get_to_mail():
        print "to mail !"
        # print p.get_content()
        f = open('body_to_mail', 'w')
        f.write(p.get_content().encode('utf-8'))
        f.close()
        # print subprocess.call('mail -s "botika report" [user@server] < body_to_mail', shell=True)
