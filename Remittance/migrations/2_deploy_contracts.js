var Remittance = artifacts.require("./Remittance.sol");

var deadlineBlock = 10;

module.exports = function(deployer) {
  deployer.deploy(Remittance, deadlineBlock);
};
