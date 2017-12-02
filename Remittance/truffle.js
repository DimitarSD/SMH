var HDWalletProvider = require("truffle-hdwallet-provider");
const config = require('./config.json');

module.exports = {
  networks: {
      development: {
        host: "localhost",
        port: 8545,
        network_id: "*"
      },
      ropstenActive: {
        provider: new HDWalletProvider(config.MNEMONIC, "https://ropsten.infura.io/"+config.INFURA_API_KEY),
        network_id: 3,
        gas: 4700036
      },
      rpc: {
        host: 'localhost',
        post:8080
      }
     }
};