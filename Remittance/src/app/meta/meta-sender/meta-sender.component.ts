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

  executedDeposits: Deposit[];
  executedWithdraws: Withdraw[];

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
    this.executedDeposits = [];
    this.executedWithdraws = [];
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
      console.log(accounts);

      this.refresh();
    });

  }

  async refresh() {
    this.getCurrentBlockNumber();

    this.model.executedDeposits = this.executedDeposits;
    this.model.executedWithdraws = this.executedWithdraws;
  }

  private encryptPasswordOne(e) {
    this.passwordOneInputValue = e.target.value;
  }

  private encryptPasswordTwo(e) {
    this.passwordTwoInputValue = e.target.value;
  }

  private generateHashes() {
    if (!this.passwordOneInputValue || !this.passwordTwoInputValue) {
      alert('Please add password');
      return;
    }

    this.model.passwordOneHash = this.web3Service.encryptPassword(this.passwordOneInputValue);
    this.model.passwordTwoHash = this.web3Service.encryptPassword(this.passwordTwoInputValue);

    this.model.masterPasswordHash = this.web3Service.encryptPasswords(this.model.passwordOneHash, this.model.passwordTwoHash);
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

      remittance.LogDeposit({}, {fromBlock: 0 }).watch((error, result) => {
        var currentDeposit: Deposit = {
          senderAddress: result.args.depositor,
          amountSent: result.args.amount,
          deadline: result.args.deadline
        };

        this.executedDeposits.push(currentDeposit);
        this.refresh();
      });
    } catch(error) {
      console.log('Error (Deposit Money) = ', error);
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

  private async withdrawdMoney() {
    if (!this.receiverAddressTextFieldValue || !this.passwordOneHashTextFieldValue || !this.passwordTwoHashTextFieldValue) {
      alert('Please fill all text fields');
      return;
    }

    var masterPassword = this.web3Service.encryptPasswords(this.passwordOneHashTextFieldValue, this.passwordTwoHashTextFieldValue);

    try {
      var remittance = await this.Remittance.deployed();
      remittance.withdraw(masterPassword, {from: this.receiverAddressTextFieldValue, gas: 100000});

      remittance.LogWithdraw({}, {fromBlock: 0}).watch((error, result) => {
        var currentWithdraw: Withdraw = {
          receiverAddress: result.args.receiver,
          amountReceived: result.args.receivedAmount.toString(10)
        };
        console.log(currentWithdraw);
        this.executedWithdraws.push(currentWithdraw);
        this.refresh();
      });

    } catch (error) {
      console.log('Error (Withdraw Money) = ', error);
    }
  }
  
  private getCurrentBlockNumber() {
    this.web3Service.getBlockNumber().then((number) => {
      this.model.block = number;
    });
  }
}

type Deposit = {
  senderAddress: string;
  amountSent: number;
  deadline: number;
};

type Withdraw = {
  receiverAddress: string;
  amountReceived: number;
};