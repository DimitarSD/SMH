import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import splitter_artifacts from '../../../../build/contracts/Splitter.json';

@Component({
  selector: 'app-meta-sender',
  templateUrl: './meta-sender.component.html',
  styleUrls: ['./meta-sender.component.css']
})

export class MetaSenderComponent implements OnInit {
  accounts: string[];
  Splitter: any;

  model = {
    senderAddress: '',
    firstRecipientAddress: '',
    secondRecipientAddress: '',
    amountToSend: 0,
    senderBalance: 0,
    firstRecipientBalance: 0,
    secondRecipientBalance: 0
  };

  constructor(private web3Service: Web3Service) {

  }

  ngOnInit(): void {
    this.watchAccount();

    this.web3Service.artifactsToContract(splitter_artifacts)
      .then((SplitterAbstraction) => {
        this.Splitter = SplitterAbstraction;
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.senderAddress = accounts[0];
      this.model.firstRecipientAddress = accounts[1];
      this.model.secondRecipientAddress = accounts[2];
      console.log(accounts);
      this.refreshBalance();
    });
  }

  async sendMoney() {
    let amount = this.model.amountToSend;
    let firstRecipient = this.model.firstRecipientAddress;
    let secondRecipient = this.model.secondRecipientAddress;

    if (amount <= 0 || firstRecipient == '' || secondRecipient == '') {
      console.log('Invalid data. Can\'t send money');

      return;
    }

    try {
      let splitter = await this.Splitter.deployed();
      let transaction = await splitter.sendMoney(firstRecipient, secondRecipient, {from: this.model.senderAddress, value: amount, gas: 1000000});
      splitter.LogMoneyTransfer().watch((error, result) => {
          this.model.firstRecipientAddress = result.args.recipientOne;
          this.model.secondRecipientAddress = result.args.recipientTwo;
          this.refreshBalance();
      });
      
      if (!transaction) {
        console.log('one - ', transaction);
        this.refreshBalance();
      } else {
        console.log('two - ', transaction);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async refreshBalance() {
    try {
      var deployedSplitter = await this.Splitter.deployed();
      deployedSplitter.showBalance(this.model.senderAddress)
      .then((balance) => {
          this.model.senderBalance = balance;
          console.log(balance.toString(10));
      }); 
      
      deployedSplitter.showBalance(this.model.firstRecipientAddress)
      .then((balance) => {
          this.model.firstRecipientBalance = balance;
          console.log(balance.toString(10));
      }); 

      deployedSplitter.showBalance(this.model.secondRecipientAddress)
      .then((balance) => {
          this.model.secondRecipientBalance = balance;
          console.log(balance.toString(10));
      }); 
    } catch (error) {
      console.log(error);
    }
  }

  setAmount(e) {
    this.model.amountToSend = parseInt(e.target.value);
  }

  setFirstRecipientAddress(e) {
    this.model.firstRecipientAddress = e.target.value;
  }

  setSecondRecipientAddress(e) {
    this.model.secondRecipientAddress = e.target.value;
  }

}
