/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    initialize: function () {
        document.addEventListener('deviceready', this.main, false);
    },
    main: function () {

        var apiKey = {
            ownerId: '993418dd-bb69-4063-b81b-57c1edb12af8',
            appId: 'e7acc87d-703c-443e-86d3-a34d18855edc',
            serviceName: 'mydatabase'
        };

        var credentials = {
            user: 'bob',
            password: '12345'
        };

        $data.initService(apiKey, credentials).then(function (mydatabase, factory, type) {
        
            mydatabase
                .Cars
                .filter('it.Manufacturer ne null')
                .forEach(function (car) {
                    $('#items')
                        .append('<li>' + car.Manufacturer + '</li>');
                });
                
        }).fail(function (err) {
            console.error('Connection failed.');
            console.error(err);
        });
    }
};

