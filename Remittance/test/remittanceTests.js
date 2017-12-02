var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
  let instance;
  // Sender
  let sender = accounts[0];

  // Receiver
  let receiver = accounts[1];
  let receiverWithEmptyBalance = accounts[2];

  // Amount
  let amountSent = 5;
  let amountSentInvalid = 0;
  let deadline = 10;

  // Passwords
  let passwordOneHash = '0x8e0974d003326d170a80ab1b6a4e4ac494f0dfb18fe0a1f2926392a0f112d7ea';
  let passwordTwoHash = '0x644c1b2043f4209b9b11dc715a43e4f1aa203bcc5d1ed9952c063883255afbb1';
  let masterPasswordHash = '0x02d95b5b7c6a7932bde2e5b03ebd9c20f9becb1b9928aff6a0922951d8c0bc38';

  let invalidPasswordOneHash = '0xb98cdd595ac98e345ebc42ff56fc0d3fa51ce443ed2bd3a9f710446a1f816945';
  let invalidPasswordTwoHash = '0x9f0d101f10cb16264e2fd1980e2763494c4d1725c8b40680249025a5f8b8fb74';

  beforeEach(async () => {
    let thisInstance = await Remittance.new(deadline);
    instance = thisInstance;
  });

  it('should create new deposit', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent})
    let event = await getEventsPromise(instance.LogDeposit(sender, amountSent, deadline));

    const eventArgs = event[0].args;
    assert.equal(eventArgs.depositor.valueOf(), sender, "should be sender");
    assert.equal(eventArgs.amount, amountSent, "should be the sent amount");
  });

  
  it('should throw when invalid amount is sent', async () => {
    try {
      await instance.deposit(masterPasswordHash, {from: sender, value: amountSentInvalid});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('receiver should withdraw before deadline', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent})
    await instance.withdraw(passwordOneHash, passwordTwoHash, {from: receiver})
    let event = await getEventsPromise(instance.LogWithdraw(receiver, amountSent));

    const eventArgs = event[0].args;
    assert.equal(eventArgs.receiver.valueOf(), receiver, "should be receiver");
    assert.equal(eventArgs.receivedAmount, amountSent, "should be the sent amount");
  });

  it('withdraw should fail when invalid passwords are used', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent});

    try {
      await instance.withdraw(invalidPasswordOneHash, invalidPasswordTwoHash, {from: receiver});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('withdraw should fail second time after deposit is received', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent});
    await instance.withdraw(passwordOneHash, passwordTwoHash, {from: receiver});

    try {
      await instance.withdraw(passwordOneHash, passwordTwoHash, {from: receiver});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('withdraw should fail when deposit amount is zero', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent});
    await instance.withdraw(passwordOneHash, passwordTwoHash, {from: receiver});

    try {
      await instance.withdraw(passwordOneHash, passwordTwoHash, {from: receiverWithEmptyBalance});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('should fail when sender withdraw before deadline', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent});

    try {
      await instance.withdraw(passwordOneHash, passwordTwoHash, {from: sender});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('sender should withdraw after deadline', async () => {
    await instance.deposit(masterPasswordHash, {from: sender, value: amountSent});

    try {
      await instance.withdraw(passwordOneHash, passwordTwoHash, {from: sender});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error, 'Exception while processing transaction: revert', 'Exception while processing transaction: revert error must be returned');
    }
  });

  it('kill switch should fail if it is not executed by owner', async () => {
    let invalidOwner = receiver;

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
    inner((error, response) => {
      error ? reject(error) : resolve(response);
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