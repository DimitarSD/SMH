import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import RemittanceArtifacts from '../../../../build/contracts/Remittance.json';

@Component({
  selector: 'app-meta-sender',
  templateUrl: './meta-sender.component.html',
  styleUrls: ['./meta-sender.component.css']
})

export class MetaSenderComponent implements OnInit {
  accounts: string[];
  Remittance: any;

  sender: string;

  // Password Generator Text Fields
  passwordOneInputValue: string;
  passwordTwoInputValue: string;

  // Deposit Text Fields
  depositAmountTextFieldValue: string;
  masterPasswordTextFieldValue: string;

  // Withdraw Text Fields
  receiverAddressTextFieldValue: string;
  passwordOneHashTextFieldValue: string;
  passwordTwoHashTextFieldValue: string;

  model = {
    accounts: [],
    executedDeposits: [],
    executedWithdraws: [],
    block: 0,
    passwordOneHash: '',
    passwordTwoHash: '',
    masterPasswordHash: ''
  };

  constructor(private web3Service: Web3Service) {
  }

  ngOnInit(): void {
    this.watchAccount();

    this.web3Service.artifactsToContract(RemittanceArtifacts)
      .then((RemittanceAbstraction) => {
        this.Remittance = RemittanceAbstraction;
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.model.accounts = accounts;
      this.accounts = accounts;
      this.sender = accounts[0];
    });

  }

  updateUI() {
    this.getCurrentBlockNumber();
  }

  private encryptPasswordOne(e) {
    this.passwordOneInputValue = e.target.value;
  }

  private encryptPasswordTwo(e) {
    this.passwordTwoInputValue = e.target.value;
  }

  private async generateHashes() {
    if (!this.passwordOneInputValue || !this.passwordTwoInputValue) {
      alert('Please add password');
      return;
    }

    var hashedPasswordOne = this.web3Service.encryptPassword(this.passwordOneInputValue);
    var hashedPasswordTwo = this.web3Service.encryptPassword(this.passwordTwoInputValue);

    this.model.passwordOneHash = hashedPasswordOne;
    this.model.passwordTwoHash = hashedPasswordTwo;

    this.getMasterPasswordHash(hashedPasswordOne, hashedPasswordTwo);
  }

  private setAmount(e) {
    this.depositAmountTextFieldValue = e.target.value;
  }

  private setMasterPasswordHash(e) {
    this.masterPasswordTextFieldValue = e.target.value;
  }

  private async depositMoney() {
    if (!this.depositAmountTextFieldValue || !this.masterPasswordTextFieldValue) {
      alert('Please, fill in all fields to continue');
      return;
    }

    try {
      var remittance = await this.Remittance.deployed();
      remittance.deposit(this.masterPasswordTextFieldValue, {from: this.sender, value: parseInt(this.depositAmountTextFieldValue), gas: 1000000});

      remittance.LogDeposit({}, {fromBlock: 0}).watch((error, result) => {
        if (error) {
          console.log('Error LogDeposit = ', error);
        } else {
          var currentDeposit: Deposit = {
            senderAddress: result.args.depositor,
            amountSent: result.args.amount.toString(10),
            deadline: result.args.deadline.toString(10)
          };
  
          if (this.model.executedDeposits.findIndex(x => x.senderAddress === currentDeposit.senderAddress
             && x.amountSent === currentDeposit.amountSent && x.deadline === currentDeposit.deadline) < 0) {
              this.model.executedDeposits.push(currentDeposit);
          }
        }
      });
    } catch(error) {
      console.log('Error (Deposit Money) = ', error);
    }
  }

  private async withdrawdMoney() {
    if (!this.receiverAddressTextFieldValue || !this.passwordOneHashTextFieldValue || !this.passwordTwoHashTextFieldValue) {
      alert('Please, fill in all text fields');
      return;
    }
    
    try {
      var remittance = await this.Remittance.deployed();
      remittance.withdraw(this.passwordOneHashTextFieldValue, this.passwordTwoHashTextFieldValue, {from: this.receiverAddressTextFieldValue, gas: 100000});

      remittance.LogWithdraw({}, {fromBlock: 0}).watch((error, result) => {
        if (error) {
          console.log('Error LogWithdraw = ', error);
        } else {
          var currentWithdraw: Withdraw = {
            receiverAddress: result.args.receiver,
            amountReceived: result.args.receivedAmount.toString(10)
          };
          
          if (this.model.executedWithdraws.findIndex(x => x.receiverAddress === currentWithdraw.receiverAddress
            && x.amountReceived === currentWithdraw.amountReceived < 0)) {
              this.model.executedWithdraws.push(currentWithdraw);
         }
        }
      });
    } catch (error) {
      console.log('Error (Withdraw Money) = ', error);
    }
  }

  private setReceiverAddress(e) {
    this.receiverAddressTextFieldValue = e.target.value;
  }

  private setPasswordOneHash(e) {
    this.passwordOneHashTextFieldValue = e.target.value;
  }

  private setPasswordTwoHash(e) {
    this.passwordTwoHashTextFieldValue = e.target.value;
  }
  
  // Helpers
  private getCurrentBlockNumber() {
    this.web3Service.getBlockNumber().then((number) => {
      this.model.block = number;
    });
  }

  private async getMasterPasswordHash(hashedPasswordOne, hashedPasswordTwo) {
    var remittance = await this.Remittance.deployed();

    remittance.hashPasswords(hashedPasswordOne, hashedPasswordTwo)
    .then((masterPasswordHash) => {
      this.model.masterPasswordHash = masterPasswordHash;
      console.log('Master Password 1 = ', masterPasswordHash);
    });
  }
}

type Deposit = {
  senderAddress: string;
  amountSent: string;
  deadline: string;
};

type Withdraw = {
  receiverAddress: string;
  amountReceived: number;
};