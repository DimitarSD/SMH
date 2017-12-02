## Ropsten deployment

#### Change 'from' value with your account address

```json
ropsten: {
   network_id: 3,
   host: "localhost",
   port: 8545,
   gas: 2900000,
   from: '0x99301e6925e51c8c315948dcd477be233a5a1b44'
},
```
#### Deploy command

```{r, engine='bash', count_lines}
 ACCOUNT_PASSWORD='your password' truffle migrate --network ropsten
```

