/**
 * Recover an account
 * @param {org.example.basic.Recovery} recovery
 * @transaction
 */
async function recoverAccount(recovery) {
    
    const factory = getFactory();
    const namespace = 'org.example.basic';

    /*
    let vtNames = [];
    let prevT = await query('prevTransactions');
    for (let i = 0; i < prevT.length; i++) {
        if (recovery.initiator == prevT[i].participantInvoking.getIdentifier()) {

        }
        console.log(prevT[i].participantInvoking.getIdentifier());
    }
    */

    let nbclassifier = new Naivebayes();
    const nbcf = await query('selectNBclassifier', { nbcID: "recoveryClassifier" });
    let nbcstr = nbcf[0].jsondata.replace(/'/g, '"');
    try {
        nbclassifier = nbclassifier.fromJson(nbcstr);
    } catch (e) {
        throw new Error('ERROR: Naivebayes.fromJson expects a valid JSON string');
    }
    if (nbclassifier.categorize(recovery.sos, 'spam', 10) == 'spam'){
        throw new Error('The proposal has failed the spam detection');
    }

    const oldus = await query('selectMatchingUser', { uID: recovery.oldAccount });
    const newus = await query('selectMatchingUser', { uID: recovery.initiator });
    if (oldus.length != 1 || newus.length != 1) {
        throw new Error('ERROR: No user exist for the userID given or the ID is not unique.');
    }
    let oldu = oldus[0];
    let newu = newus[0];
    // check if the number of voters meets the requirement of a minimum 5 voters.
    //if (oldu.voters.length < 5) {
    //    throw new Error('ERROR: You have less than 5 voters.');
    //}
    // check if the balance in the new account is enough. New user need to have 10% coins of the old account
    if (newu.aCoin < oldu.aCoin * 0.2) {
        throw new Error('ERROR: Not enough balance in the new account. You need to have 20% of the amount you want to recover in the new account.');
    }
    oldu.attemptedRecover += 1;

    let sdate = new Date(Date.now());
    let edate = new Date(Date.parse(sdate));
    edate.setMonth(edate.getMonth() + 1);
    console.log(sdate);
    console.log(edate);

    let pname = "Recovery-"+oldu.getIdentifier()+"-"+oldu.attemptedRecover.toString();

    // ENCRYPTION
    const newrsakey = factory.newResource(namespace, 'RSAKey', 'RSA-' + pname);
    newrsakey.n = "";
    newrsakey.e = 10001;
    newrsakey.d = '';
    newrsakey.p = '';
    newrsakey.q = '';
    newrsakey.dmp1 = '';
    newrsakey.dmq1 = '';
    newrsakey.coeff = '';
    const keyRegistry = await getAssetRegistry(newrsakey.getFullyQualifiedType());
    await keyRegistry.add(newrsakey);

    //create the poll for the proposal
    const newpoll = factory.newResource(namespace, 'Poll', "Poll-" + pname);
    const inits = await query('selectMatchingUser', { uID: recovery.initiator });
    newpoll.host = inits[0];
    newpoll.detail = recovery.detail;
    newpoll.deadline = edate.toString() ;
    newpoll.result = '';  
    newpoll.rsakey = newrsakey;
    newpoll.validAnswers = ["True", "False"];
    const pollRegistry = await getAssetRegistry(newpoll.getFullyQualifiedType());
    await pollRegistry.add(newpoll);

    const newproposal = factory.newResource(namespace, 'Proposal', pname);
    newproposal.owner = oldu;
    newproposal.statementOS = recovery.sos;
    newproposal.detail = recovery.detail;
    newproposal.oldAccount = recovery.oldAccount;
    newproposal.newAccount = recovery.initiator;
    newproposal.detailpoll = newpoll.getIdentifier();
    newproposal.stage = "Voting";
    newproposal.votingReward = oldu.aCoin * 0.1;
    const ppsRegistry = await getAssetRegistry(newproposal.getFullyQualifiedType());
    await ppsRegistry.add(newproposal);
    
    // creat votetoken for each voter
    let i = 0;
    for (;i < newproposal.owner.voters.length; i++){
        let vtID = 'VT-' + pname + '-' + i.toString();
        const newVoteToken = factory.newResource(namespace, 'VoteToken', vtID);
        newVoteToken.poll = newpoll;
        newVoteToken.response = '';
        newVoteToken.creator = newpoll.host;
        newVoteToken.voter = newproposal.owner.voters[i];
        newVoteToken.owner = newproposal.owner.voters[i];
        const vtRegistry = await getAssetRegistry(newVoteToken.getFullyQualifiedType());
        await vtRegistry.add(newVoteToken);
    }
    // deduct the voting reward in advance
    newu.aCoin -= oldu.aCoin * 0.2;
    const userRegistry = await getParticipantRegistry('org.example.basic.User');
    await userRegistry.update(oldu);
    await userRegistry.update(newu);
}

/**
 * Recover an account
 * @param {org.example.basic.EndRecovery} endRecovery
 * @transaction
 */
async function finishRecovery(endRecovery) {

    const initproposals = await query('selectMatchingProposal', { ppsID: endRecovery.proposal.getIdentifier()});
    if (initproposals.length != 1) {
        throw new Error('ERROR: Cannot complete an empty recovery');
    }
    let initproposal = initproposals[0];
    let encrypted = false;

    const dpolls = await query('selectMatchingPoll', { pID: initproposal.detailpoll });
    if (dpolls.length == 0) {
        throw new Error('ERROR: Poll does not exist, maybe owner has vetoed the poll');
    }
    let dpoll = dpolls[0];

    const votetokens = await query('selectMatchingVoteTokens');
    if (votetokens.length == 0) {
        throw new Error('ERROR: No vote has been casted');
    }

    const userRegistry = await getParticipantRegistry('org.example.basic.User');
    const vtRegistry = await getAssetRegistry('org.example.basic.VoteToken');
    const pollRegistry = await getAssetRegistry('org.example.basic.Poll');
    const ppsRegistry = await getAssetRegistry('org.example.basic.Proposal');

    if (initproposal.stage != "Voting") {
        throw new Error('ERROR: The proposal cannot be concluded');
    }
    if (dpoll.result == '') {
        const qualifiedVT = votetokens.filter(function (votetoken) {
            return (votetoken.poll.getIdentifier() == dpoll.getIdentifier()) && (votetoken.owner.getIdentifier() == dpoll.host.getIdentifier());    
        });
        let answers = {}; // (key is the answer, value is the list of voters who give this answer)
        for (let i = 0; i < qualifiedVT.length; i++) {
            let response = qualifiedVT[i].response;
            if (encrypted) {
                response = RSAdecrypt(response, dpoll.rsakey);
            }
            if (!(response in answers)) {
                answers[response] = [];
            }
            answers[response].push(i);
        }
        let maxVote = 0;
        let voteAnswer = '';
        let rewarded_voters = [] // index of all voters who should be rewarded
        for (let ans in answers) {
            if (answers[ans].length > maxVote){
                maxVote = answers[ans].length;
                rewarded_voters = answers[ans];
                voteAnswer = ans;
            }
        }
        let deposit = initproposal.votingReward; // the 10% deposit returned to the recovery initiator
        // give the voting reward regardless of the voting result
        try{
            reward = initproposal.votingReward/rewarded_voters.length;
            for (let i = 0; i < rewarded_voters.length; i++) {
                const voters = await query('selectMatchingUser', { uID: qualifiedVT[rewarded_voters[i]].voter.getIdentifier() });
                let voter = voters[0];
                voter.aCoin += reward;
                await userRegistry.update(voter);
            };
            for (let i = 0; i < qualifiedVT.length; i++) {
                await vtRegistry.remove(qualifiedVT[i]);
            }
        }
        catch(error) {
            throw new Error('ERROR: Cannot complete voting reward transfer');
        }

        console.log(voteAnswer, maxVote);
        dpoll.result = voteAnswer;
        await pollRegistry.update(dpoll);
        
        try {
            const oldus = await query('selectMatchingUser', { uID: initproposal.oldAccount });
            const newus = await query('selectMatchingUser', { uID: initproposal.newAccount });
            let oldu = oldus[0];
            let newu = newus[0];
            if (voteAnswer == "True") { // if the vote is pass
                // transfer balance and return the deposit
                newu.aCoin += oldu.aCoin + deposit;
                oldu.aCoin = 0;
                newu.iteration += 1;
            } else {
                // return the deposit regardless of the voting result
                newu.aCoin += deposit;
            }
            await userRegistry.update(newu);
            await userRegistry.update(oldu);
        }
        catch(error) {
            throw new Error('ERROR: Cannot complete balance transfer');
        }
        initproposal.stage = "Concluded";
        await ppsRegistry.update(initproposal);
    } else {
        throw new Error('Poll already concluded or no voters has voted yet');
    }
 }

 /**
 * The original account owner can veto the proposal
 * to invite each of them. Locks the owner from setting up another poll.
 * @param {org.example.basic.VetoRecovery} vetoRecovery
 * @transaction
 */
async function refuseRecovery(vetoRecovery) {
    const userRegistry = await getParticipantRegistry('org.example.basic.User');
    const vtRegistry = await getAssetRegistry('org.example.basic.VoteToken');
    const ppsRegistry = await getAssetRegistry('org.example.basic.Proposal');
    const pollRegistry = await getAssetRegistry('org.example.basic.Poll');
    const proposals = await query('selectProposalsbyOldAccount', { ouID: vetoRecovery.owner.getIdentifier() });
    let frauds = []; // any recovery proposal on the user's account
    for (let i = 0; i < proposals.length; i++) {
        console.log("stage", proposals[i].stage);
        if (proposals[i].stage == "Voting") {
            frauds.push(i);
        }
    }
    if (frauds.length == 0) {
        throw new Error('ERROR: There are no active account recovery attempt on your account');
    }
    // remove any account recovery on the user's account
    for (let i = 0; i < frauds.length; i++) {
        let encrypted = false;
        let fraud = proposals[frauds[i]];
        const newus = await query('selectMatchingUser', { uID: fraud.newAccount });
        let newu = newus[0];
        const dpolls = await query('selectMatchingPoll', { pID: fraud.detailpoll });
        if (dpolls.length == 0) {
            throw new Error('ERROR: Poll does not exist, maybe owner has already removed the poll');
        }
        let dpoll = dpolls[0];
        let deposit = dpoll.votingReward;
        // give the voting reward regardless of the voting result
        const votetokens = await query('selectMatchingVoteTokens');
        const qualifiedVT = votetokens.filter(function (votetoken) {
            return (votetoken.poll.getIdentifier() == dpoll.getIdentifier()) && (votetoken.owner.getIdentifier() == dpoll.host.getIdentifier());    
        });
        if (qualifiedVT.length == 0) { // if no one has voted yet, the initial owner can take the deposit himself
            try{
                const oldus = await query('selectMatchingUser', { uID: fraud.owner.getIdentifier() });
                let oldu = oldus[0];
                oldu.aCoin += fraud.votingReward;
                dpoll.result = "False";
                await userRegistry.update(oldu);
                await pollRegistry.update(dpoll);
            }
            catch(error) {
                throw new Error('ERROR: Cannot transfer voting reward to the original account owner');
            }
        }
        else { // reward voters if any voter has already voted
            try{
                // check number of correct voters
                let rewarded_voters = [] // index of all voters who should be rewarded
                for (let i = 0; i < qualifiedVT.length; i++) {
                    let response = qualifiedVT[i].response;
                    if (encrypted) {
                        response = RSAdecrypt(response, dpoll.rsakey);
                    }
                    // if the account recovery is refused, then it means that the voter should vote False if they are correct
                    if (response == "False") { 
                        rewarded_voters.push(i);
                    }
                }
                let reward = fraud.votingReward;
                // if all voters got it wrong, then reward each voters equally.
                if (rewarded_voters.length == 0) {
                    reward /= qualifiedVT.length;
                    for (let i = 0; i < qualifiedVT.length; i++) { // add voters are rewarded
                        rewarded_voters.push(i);
                    }
                }
                // only reward correct voters
                else {
                    reward /= rewarded_voters.length;
                }
                for (let i = 0; i < rewarded_voters.length; i++) {
                    const voters = await query('selectMatchingUser', { uID: qualifiedVT[rewarded_voters[i]].voter.getIdentifier() });
                    let voter = voters[0];
                    voter.aCoin += reward;
                    await userRegistry.update(voter);
                };

                for (let i = 0; i < qualifiedVT.length; i++) {
                    await vtRegistry.remove(qualifiedVT[i]);
                }
            }
            catch(error) {
                throw new Error(error);//'ERROR: Cannot transfer voting reward to voters'
            }
        }
        console.log("newu",newu);
        newu.reputation = 0;
        //newu.aCoin += deposit; // return the deposit regardless of the proposal outcome
        await userRegistry.update(newu);
        await ppsRegistry.remove(fraud);
    }
}
