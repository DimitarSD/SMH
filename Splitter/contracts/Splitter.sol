pragma solidity ^0.4.18;

contract Splitter {
    address public owner; // Alice
    address public recipientOne; // Bob
    address public recipientTwo; // Carol

    mapping (address => uint) public accounts; // address(key) => uint(value)

    // Events
    event LogMoneyTransfer(address sender, address recipientOne, address recipientTwo, uint amount);
    event LogMoneyWithdraw(address sender, uint amount);

    function Splitter(address ownerAddress) public {
        owner = ownerAddress;
    }

    function sendMoney(address recipientOneAddress, address recipientTwoAddress) public payable returns (bool success) {
        require(msg.value > 0);

        uint amountSent = msg.value;

        if (amountSent % 2 != 0) {
            accounts[owner] += 1;
            amountSent -= 1;
        }

        accounts[recipientOneAddress] += amountSent / 2;
        accounts[recipientTwoAddress] += amountSent / 2;

        LogMoneyTransfer(msg.sender, recipientOneAddress, recipientTwoAddress, amountSent);

        return true;
    }

    function withdrawMoney() public payable returns (bool success) {
	    require(accounts[msg.sender] > 0);

        uint balance = accounts[msg.sender];
        accounts[msg.sender] = 0;
    	msg.sender.transfer(balance);

        LogMoneyWithdraw(msg.sender, balance);

        return true;
    }

    function showBalance(address user) public constant returns(uint) {
        return accounts[user];
    }

    function kill() public returns (bool success) {
        require(msg.sender == owner);
        selfdestruct(owner);

        return true;
    }
}