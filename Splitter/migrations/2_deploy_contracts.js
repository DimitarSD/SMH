var Splitter = artifacts.require("./Splitter.sol");

module.exports = function(deployer) {
  deployer.deploy(Splitter, '0xdF652e48a39da7303f3F8aa6b2A69cBBBc707f20');
};
