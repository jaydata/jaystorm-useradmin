var config = {
    admin: {
        url:'admin.jaystack.net',
        port: 3000,
        ssl: false,
        launch: '/launch'
    },
    dashboard: {
        url: 'dashboard.jaystack.com',
        port :443,
        ssl: true,
        auth: '/auth.axd'
    }
}

exports.config = config;
