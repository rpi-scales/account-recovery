/**
 * Recover an account
 * @param {org.example.basic.Recovery} recovery
 * @transaction
 */
async function recoverAccount(recovery) {
  	
    const factory = getFactory();
    const namespace = 'org.example.basic';

    let nbclassifier = new Naivebayes();
    const nbcf = await query('selectNBclassifier', { nbcID: "nbc-public" });
    let nbcstr = nbcf[0].jsondata.replace(/'/g, '"');
    try {
        nbclassifier = nbclassifier.fromJson(nbcstr);
    } catch (e) {
        throw new Error('ERROR: Naivebayes.fromJson expects a valid JSON string');
    }
    if (nbclassifier.categorize(recovery.sos, 'spam', 10) == 'spam'){
        throw new Error('The proposal has failed the spam detection');
    }

    let sdate = new Date(Date.now());
    let edate = new Date(Date.parse(sdate));
    edate.setMonth(edate.getMonth() + 1);
    console.log(sdate);
    console.log(edate);

    // ENCRYPTION
    const newrsakey = factory.newResource(namespace, 'RSAKey', 'RSA-' + recovery.proposalName);
    newrsakey.n = "";
    newrsakey.e = 10001;
    newrsakey.d = '';
    newrsakey.p = '';
    newrsakey.q = '';
    newrsakey.dmp1 = '';
    newrsakey.dmq1 = '';
    newrsakey.coeff = '';
    let assetRegistry = await getAssetRegistry(newrsakey.getFullyQualifiedType());
    await assetRegistry.add(newrsakey);

    //create the poll for the proposal
    const newpoll = factory.newResource(namespace, 'Poll', "Poll-" + recovery.proposalName);
    const inits = await query('selectMatchingUser', { uID: recovery.initiator });
    newpoll.host = inits[0];
    newpoll.detail = recovery.detail;
    newpoll.deadline = edate.toString() ;
    newpoll.result = '';  
    newpoll.rsakey = newrsakey;
    assetRegistry = await getAssetRegistry(newpoll.getFullyQualifiedType());
    await assetRegistry.add(newpoll);

    let pname = recovery.proposalName;
    const newproposal = factory.newResource(namespace, 'Proposal', pname);
    const origs = await query('selectMatchingUser', { uID: recovery.oldAccount });
    newproposal.owner = origs[0];
    newproposal.statementOS = recovery.sos;
    newproposal.detail = recovery.detail;
    newproposal.oldAccount = recovery.oldAccount;
    newproposal.newAccount = recovery.initiator;
    newproposal.detailpoll = newpoll.getIdentifier();
    assetRegistry = await getAssetRegistry(newproposal.getFullyQualifiedType());
    await assetRegistry.add(newproposal);
    
    // creat votetoken for each voter
    let i = 0;
    for (;i < recovery.voters.length; i++){
        let vtID = 'VT-' + pname + '-' + i.toString();
        const newVoteToken = factory.newResource(namespace, 'VoteToken', vtID);
        newVoteToken.creator = newpoll.host;
        newVoteToken.poll = newpoll;
        newVoteToken.response = '';
        newVoteToken.owner = recovery.voters[i];
        assetRegistry = await getAssetRegistry(newVoteToken.getFullyQualifiedType());
        await assetRegistry.add(newVoteToken);
    }
    
}

/**
 * Recover an account
 * @param {org.example.basic.EndRecovery} endRecovery
 * @transaction
 */
async function finishRecovery(endRecovery) {

	const initproposals = await query('selectMatchingProposal', { ppsID: endRecovery.proposalName });
	if (initproposals.length == 0) {
		throw new Error('ERROR: Cannot complete an empty recovery');
	}
	let initproposal = initproposals[0];
	let encrypted = false;

	const votetokens = await query('selectMatchingVoteTokens');
	if (votetokens.length == 0) {
		throw new Error('ERROR: No votetokens found');
	}

	const dpolls = await query('selectMatchingPoll', { pID: initproposal.detailpoll });
	if (dpolls.length == 0) {
		throw new Error('ERROR: Poll does not exist, maybe owner has vetoed the poll');
	}
	let dpoll = dpolls[0];

    if (dpoll.result == '') {
        
        const qualifiedVT = votetokens.filter(function (votetoken) {
            return (votetoken.poll.getIdentifier() == dpoll.getIdentifier()) && (votetoken.owner.getIdentifier() == dpoll.host.getIdentifier());
        });
        
        let answers = {};
        for (let i = 0; i < qualifiedVT.length; i++) {
            let response = qualifiedVT[i].response;
            // decrypt the vote
            if (encrypted) {
                response = RSAdecrypt(response, dpoll.rsakey);
            }
            answers[response] = 1 + (answers[response] || 0);
            let assetRegistry = await getAssetRegistry(qualifiedVT[i].getFullyQualifiedType());
            await assetRegistry.remove(qualifiedVT[i]);
        }
        let maxv = 0;
        let maxk = '';
        try {
            for (let ans in answers) {
                console.log(ans, answers[ans]);
                if (answers[ans] > maxv){
                    maxv = answers[ans];
                    maxk = ans;
                } else if (answers[ans] == maxv){
                    maxk = maxk + ", " + ans;
                }
            }
        }
        catch(error) {
            console.error(error);
        }
        console.log(maxk, maxv);
        dpoll.result = maxk;
        assetRegistry = await getAssetRegistry('org.example.basic.Poll');
        await assetRegistry.update(dpoll);

        if (maxk == "True") {
        	try {
	        	const oldus = await query('selectMatchingUser', { uID: initproposal.oldAccount });
	        	let oldu = oldus[0];
			    const newus = await query('selectMatchingUser', { uID: initproposal.newAccount });
			    let newu = newus[0];
			    // transfer balance from old to new account
			    newu.aCoin += (oldu.aCoin) * 0.9;
			    oldu.aCoin = 0;
			    newu.iteration += 1; 
			    const assetRegistry = await getParticipantRegistry('org.example.basic.User');
			    await assetRegistry.update(newu);
			    await assetRegistry.update(oldu);
	        }
	        catch(error) {
	            throw new Error('ERROR: Cannot complete balance transfer');
	        }
        }

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
	const frauds = await query('selectProposalsbyOldAccount', { ouID: vetoRecovery.owner.userId });
	let fraud = frauds[0];
	const newus = await query('selectMatchingUser', { uID: fraud.newAccount });
	let newu = newus[0];
	console.log(newu.userId);
	newu.reputation = 0;
	let assetRegistry = await getParticipantRegistry('org.example.basic.User');
	await assetRegistry.update(newu);
	assetRegistry = await getAssetRegistry(fraud.getFullyQualifiedType());
	await assetRegistry.remove(fraud);
}
