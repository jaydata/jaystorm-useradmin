﻿var config = {
    admin: {
        url:'localhost',
        port: 3000,
        ssl: false,
        launch: '/launch'
    },
    dashboard: {
        url: 'dev-dashboard.jaystack.com',
        port :443,
        ssl: true,
        auth: '/auth.axd'
    }
}

exports.config = config;