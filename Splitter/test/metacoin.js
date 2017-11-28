var Splitter = artifacts.require("./Splitter.sol");


function promisify(inner) {
  return new Promise((resolve, reject) =>
    inner((err, res) => {
      err ? reject(err) : resolve(res);
    })
  );
}

var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

contract('Spliiter', function(accounts) {
    let instance;

    beforeEach(() => {
      return Splitter.new().then(thisInstance => {
          instance = thisInstance;
      });
    });

    it("should send money in a 50/50 split if even", () => {
    const sent = 10;
    const half = 5;
    let balance;

    return instance.sendMoney(accounts[1], accounts[2], {from: accounts[0], value: sent})
      .then(transaction => {
        return instance.showBalance(accounts[1]);
      })
      .then(_balance => {
        balance = _balance;
        return getEventsPromise(instance.LogMoneyTransfer(accounts[0], accounts[1], accounts[2], sent));
      })
      .then((event) => {
        const eventArgs = event[0].args;
        assert.equal(balance, half, "account 1's balance is not half of amount sent");
        assert.equal(eventArgs.sender.valueOf(), accounts[0], "should be sender");
	    	assert.equal(eventArgs.recipientOne.valueOf(), accounts[1], "should be the recipientOne");
	    	assert.equal(eventArgs.recipientTwo.valueOf(), accounts[2], "should be the recipientTwo");
        assert.equal(eventArgs.amount.valueOf(), half, "should be the sent amount");
        return instance.showBalance(accounts[2]);
      })
      .then(balance => {
        assert.equal(balance, half, "account 2's balance is not half of amount sent");
        return;
      });
    });
});

// contract('MetaCoin', function(accounts) {
//   it("should put 10000 MetaCoin in the first account", function() {
//     return MetaCoin.deployed().then(function(instance) {
//       return instance.getBalance.call(accounts[0]);
//     }).then(function(balance) {
//       assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
//     });
//   });
//   it("should call a function that depends on a linked library", function() {
//     var meta;
//     var metaCoinBalance;
//     var metaCoinEthBalance;

//     return MetaCoin.deployed().then(function(instance) {
//       meta = instance;
//       return meta.getBalance.call(accounts[0]);
//     }).then(function(outCoinBalance) {
//       metaCoinBalance = outCoinBalance.toNumber();
//       return meta.getBalanceInEth.call(accounts[0]);
//     }).then(function(outCoinBalanceEth) {
//       metaCoinEthBalance = outCoinBalanceEth.toNumber();
//     }).then(function() {
//       assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, "Library function returned unexpected function, linkage may be broken");
//     });
//   });
//   it("should send coin correctly", function() {
//     var meta;

//     // Get initial balances of first and second account.
//     var account_one = accounts[0];
//     var account_two = accounts[1];

//     var account_one_starting_balance;
//     var account_two_starting_balance;
//     var account_one_ending_balance;
//     var account_two_ending_balance;

//     var amount = 10;

//     return MetaCoin.deployed().then(function(instance) {
//       meta = instance;
//       return meta.getBalance.call(account_one);
//     }).then(function(balance) {
//       account_one_starting_balance = balance.toNumber();
//       return meta.getBalance.call(account_two);
//     }).then(function(balance) {
//       account_two_starting_balance = balance.toNumber();
//       return meta.sendCoin(account_two, amount, {from: account_one});
//     }).then(function() {
//       return meta.getBalance.call(account_one);
//     }).then(function(balance) {
//       account_one_ending_balance = balance.toNumber();
//       return meta.getBalance.call(account_two);
//     }).then(function(balance) {
//       account_two_ending_balance = balance.toNumber();

//       assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
//       assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
//     });
//   });
// });
