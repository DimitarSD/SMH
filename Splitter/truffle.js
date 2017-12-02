module.exports = {
    networks: {
        development: {
          host: "localhost",
          port: 8545,
          network_id: "1000"
        },
        ropsten: {
          network_id: 3,
          host: "localhost",
          port: 8545,
          gas: 2900000,
          from: '0x99301e6925e51c8c315948dcd477be233a5a1b44'
        },
        rpc: {
          host: 'localhost',
          post:8080
        }
       }
};

