pragma solidity ^0.4.18;

contract Remittance {
    address public owner;
    uint public deadline;

    struct Deposit {
        address depositor;
        uint amount;
        uint depositDeadline;
    }

    mapping (bytes32 => Deposit) deposits; // bytes32(key) => uint(value)

    // Events
    event LogDeposit(address depositor, uint amount, uint deadline);
    event LogWithdraw(address receiver, uint receivedAmount);

    function Remittance(uint remittanceDeadline) public {
        owner = msg.sender;
        deadline = remittanceDeadline;
    }

    function deposit(bytes32 masterPasswordHash) public payable returns (bool success) {
        require(msg.value > 0);
        require(masterPasswordHash != 0);

        deposits[masterPasswordHash] = Deposit({
            depositor: msg.sender,
            amount: msg.value,
            depositDeadline: block.number + deadline
        });

        // Log event
        LogDeposit(msg.sender, msg.value, block.number + deadline);

        return true;
    }

    function withdraw(bytes32 passwordOneHash, bytes32 passwordTwoHash) public payable returns (bool success) {
        bytes32 masterPasswordHash = keccak256(passwordOneHash, passwordTwoHash);
        Deposit storage currentDeposit = deposits[masterPasswordHash];

        require(currentDeposit.amount > 0);

        if (currentDeposit.depositor == msg.sender) {
            // Return money to owner
            require(currentDeposit.depositDeadline <= block.number);
        } else {
            // Send money for processing
            require(currentDeposit.depositDeadline > block.number);
        }

        // Make transaction
        msg.sender.transfer(currentDeposit.amount);

        // Log event
        LogWithdraw(msg.sender, currentDeposit.amount);

        // Reset current deposit data (not sure about gas costs)
        currentDeposit.amount = 0;

        return true;
    }

    function kill() public returns (bool success) {
        require(msg.sender == owner);
        selfdestruct(owner);

        return true;
    }
}