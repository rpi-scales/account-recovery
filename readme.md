# Decentralized account recovery

> This project aims to provide users a method to recover a lost account in a decentralized application

Decentralized applications achieve stronger security and fault tolerance by placing trust in the majority of users instead of a single third party.  However, it also means that there will be no administrator to handle unexpected situations. 

Because there is no trusted central management, a decentralized application can do little when a user loses their private key. Therefore, as decentralized applications are becoming mainstream, account recovery will be a much-needed feature.

More explanation could be found at <https://kirbisity.github.io/scales_project/>.

### Get Started

>  This project aims to provide users a method to recover a lost account in a decentralized application

The **basic-sample-network.bna** file under [demo_hyperledger_composer](https://github.com/oshanis/scales/tree/master/smart_contracts/Decentralized_account_recovery/demo_hyperledger_composer) folder contains sample network with account recovery feature.  The base network is the trade network sample on Hyperledger Composer, which only supports trading of commodities between traders. We added a few transaction scripts (called chaincode) to enable a user to recover another account.



1. Upload the **basic-sample-network.bna** to Hyperledger Composer when creating a new network. For this demo propose, we choose user0 to be the lost account.
2. As **admin**. Create a new **NBclassifier** asset by copying the data in nb.txt in [demo_hyperledger_composer](https://github.com/oshanis/scales/tree/master/smart_contracts/Decentralized_account_recovery/demo_hyperledger_composer) folder.

3. As **admin**. We would populate the network with a few participants like this. *User0* is the account that we choose to be "lost" later.  Other users like *user1* etc. represents other random users in a trade network.

```
{
  "$class": "org.example.basic.User",
  "userId": "user0",
  "name": "Alice",
  "aCoin": 100,
  "iteration": 0,
  "reputation": 100,
  "voters": []
}
```

4. As each **sender**. Call *SendMoney* transactions to trade between *User0* and some other users. This step is to get some previous trade partners for the account to be recovered. 

```
{
  "$class": "org.example.basic.SendMoney",
  "amount": 10,
  "sender": "resource:org.example.basic.User#user0",
  "receiver": "resource:org.example.basic.User#user1"
}
```

After these two steps. You should see the "voters" field of the user0 populated. 

5. Issue new IDs corresponding to each user by opening the ID registry to act as users.

When running through transactions, you can switch between different users by clicking the button in the top-right corner. On Hyperledger Composer you can do everything as admin. But if you currently act as a user and forget to switch to another user when submit another transaction, you may run into permission denied errors. 

Preparation is now complete. Then you may use the following transactions to go through the account recovery process. 

6. Now suppose user0 account is lost. As **admin**, we create user3, who is going to recover the account.

7. As **user3**. Submit ***Recovery*** transaction like this. The *sos* field is the plaintext explanation of what happened. The *detail* field should be the encrypted proofs for voters. We can omit is since we act as voters in this case.

```
{
  "$class": "org.example.basic.Recovery",
  "proposalName": "recovery0",
  "sos": "I just realized that I lost my account...",
  "detail": "a1d19e476016aea3a4313315c13f0a716eef25d...",
  "initiator": "user3",
  "oldAccount": "user0"
}
```

You should now see a new proposal called recovery0 and one votetoken called VT-recovery0 for each voter in the asset.

8. **Switch** to other users one by one to **vote**. The following script is the voter transaction for user1. The voter votes true if the recovery is authentic.

```
{
	"$class": "org.example.basic.Vote",
	"response": "True",
	"votetoken": "resource:org.example.basic.VoteToken#VT-recovery0-0"
}
```

**Option A**

9a. When you finished all votes. You can switch yo **user3** to conclude the vote. Call **EndRecovery**.

```
{
  "$class": "org.example.basic.EndRecovery",
  "proposalName": "recovery0",
  "proposal": "resource:org.example.basic.Proposal#recovery0"
}
```

If the vote is passed. The money in user0 should be 0 and the money is given to user3.

**Option B**

9b. As **user0**. If you discover that the recovery is a spam. Then you can call **VetoRecovery**.

```
{
  "$class": "org.example.basic.VetoRecovery",
  "owner": "resource:org.example.basic.User#user0"
}
```

After this. the proposal is removed and user3 cannot call EndRecovery.

Complete!



### Source Code

The code for Hyperledger Composer is located under [demo_hyperledger_composer](https://github.com/oshanis/scales/tree/master/smart_contracts/Decentralized_account_recovery/demo_hyperledger_composer) folder.

Description for each piece of code:

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| classifier.js  | The script containning the Naive Bayes program.              |
| complain.js    | Script file on Hyperledger Composer contains transactions. This script contains the transactions required for the recovery feature. |
| library.js     | The library necessary for the RSA encryption.                |
| model.cto      | Model file on Hyperledger Composer contains the definition of all participants, assets and transactions. |
| permission.acl | Permission file contains rules that determines whether a type of user can modify a type of asset, who can submit which transaction, etc. |
| query.qry      | Query file is used for finding the users, assets, etc.       |
| rsa.js         | This script containing the RSA encryption program.           |
| voting.js      | This script contains the transactions required for the recovery feature |



### SImulation 

> To determine the minimum number of voters required for the voting. We used a python program to list all voting outcomes, then find compare the expected reward to see if there exist a stable result at some number of voters.

The Python code for voting simulation is located under [simulation](https://github.com/oshanis/scales/tree/master/smart_contracts/Decentralized_account_recovery/simulation) folder.

Sample usage

```python
n = 6
# n is the number of the voters in the game
Game(n, 0.6, 10, 0)
game.play("S")
game.play("H")

game.play("S", True)
```



### Future Work

It is possible for a malicious attacker to steal a user's account by intentionally engaging in many transactions with the user using different accounts, to a point when the attacker controls more than 60% of the trade partners under three-fifth vote. In another case, it is common for a person to have multiple accounts. If these accounts have traded with the lost account, they could have more weight in the voting system. In order to solve this vulnerability, we can predict the relation between individual users on the network to find if they indeed belong to the same person. 

In the search for a method to alleviate this limitation, we draw inspiration from *BitIodine: Extracting Intelligence from the Bitcoin Network*, which has proven to be able to identify addresses likely to belong to the same user on bitcoin. Their method is to first parse the blockchain data into a dynamic database that can be accessed and updated with better performance. Then the clusterizer will cluster address profiles based on related information including transaction data. Then the scrapers will crawl the internet, mainly forums and trading services related to bitcoin, to associate more information with the addresses and detect interesting flows of coins. 

For future work, we can add a service to periodically cluster the accounts in our network to identify the accounts likely to belong to the same person. When a recovery request is submitted, as the information about account owner's trade partners is recovered from the historian registry, the smart contract can then filter out the voters that are likely to be a duplicate account of another voter in the current voting group and only retain one of them as a voter.

Furthermore, even though our work has primarily been on the Hyperledger eco-system. The application could see more practicality in Ethereum. So developing on Ethereum might be an option.