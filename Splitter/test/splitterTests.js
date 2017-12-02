var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function (accounts) {
  let instance;

  let sender = accounts[0];
  let recipientOne = accounts[1];
  let recipientTwo = accounts[2];

  let amountSent = 4;
  let amountSentOddNumber = 5;
  let amountOne = 1;
  let amountSentHalf = 2;
  let invalidAmountSent = 0;

  beforeEach(async () => {
    let thisInstance = await Splitter.new();
    instance = thisInstance;
  });

  it('should send money', async () => {
    await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: amountSent})
    let event = await getEventsPromise(instance.LogMoneyTransfer(sender, recipientOne, recipientTwo, amountSent));
    
    const eventArgs = event[0].args;
    assert.equal(eventArgs.sender.valueOf(), sender, "should be sender");
    assert.equal(eventArgs.recipientOne.valueOf(), recipientOne, "should be recipient one");
    assert.equal(eventArgs.recipientTwo.valueOf(), recipientTwo, "should be recipient two");
    assert.equal(eventArgs.amount, amountSent, "should be the sent amount");
  });

  it('send money should throw when invalid amount is used', async () => {
    try {
      await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: invalidAmountSent})
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('recipients should get half', async () => {
    await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: amountSent});
    let balance = await instance.showBalance(recipientOne);
    
    assert.equal(balance, amountSentHalf, "should get half");
  });

  it('sender should get +1 if amount is odd number', async () => {
    await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: amountSentOddNumber});
    let balance = await instance.showBalance(sender);
    
    assert.equal(balance.toString(10), amountOne, "should get half");
  });

  it('should withdraw money', async () => {
    await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: amountSent});
    await instance.withdrawMoney({from: recipientOne});
    let event = await getEventsPromise(instance.LogMoneyWithdraw(sender, amountSentHalf));
    
    const eventArgs = event[0].args;
    assert.equal(eventArgs.sender.valueOf(), recipientOne, "should be sender");
    assert.equal(eventArgs.amount, amountSentHalf, "should be the sent amount");
  });

  it('withdraw should fail if balance is empty', async () => {
    await instance.sendMoney(recipientOne, recipientTwo, {from: sender, value: amountSent});

    try {
      await instance.withdrawMoney({from: sender})
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('kill switch should fail if it is not executed by owner', async () => {
    let invalidOwner = recipientOne;

    try {
      await instance.kill({from: invalidOwner});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });
});

function assertJump(error, search, message) {
  assert.isAbove(error.message.search(search), -1, message);
}

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
