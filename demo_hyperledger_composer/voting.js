
/**
 * Take in a list of voters. Create a poll by minting an identical VoteToken for each user 
 * to invite each of them. Locks the owner from setting up another poll.
 * @param {org.example.basic.CreatePoll} createPoll
 * @transaction
 */
async function createANewPoll(createPoll) {
    // create a new poll
    console.log('create new poll');

    let nbclassifier = new Naivebayes();
    // get the wanted classifier
    const nbcf = await query('selectNBclassifier', { nbcID: "nbc-public" });
    let nbcstr = nbcf[0].jsondata.replace(/'/g, '"');
    try {
        nbclassifier = nbclassifier.fromJson(nbcstr);
    } catch (e) {
        throw new Error('ERROR: Naivebayes.fromJson expects a valid JSON string');
    }

    if (nbclassifier.categorize(createPoll.pollDetail, 'spam', 10) == 'spam'){
        throw new Error('The poll has failed the spam detection');
    }

    const factory = getFactory();
  
    // Below is specific to the network (to be edited)
    const namespace = 'org.example.basic';
  
    const newpoll = factory.newResource(namespace, 'Poll', createPoll.pollName);
    newpoll.pollID = createPoll.pollName;
    newpoll.host = createPoll.pollOwner;
    newpoll.detail = createPoll.pollDetail;
    //check if the poll has deadline 
    let ddldate = new Date(createPoll.pollDeadline);
    if (ddldate == 'Invalid Date') { //No deadline specified or incorrect date format
        newpoll.deadline = '';
    } else if (Date.now() > ddldate.getTime()) {
        throw new Error('Cannot set deadline prior to current time');
    } else {
        newpoll.deadline = createPoll.pollDeadline;
    }
    newpoll.result = '';
  
    // ENCRYPTION
    const newrsakey = factory.newResource(namespace, 'RSAKey', 'RSA-' + createPoll.pollName);
    newrsakey.rsakeyID = 'RSA-' + createPoll.pollName;
    newrsakey.n = createPoll.publicKey;
    newrsakey.e = 10001;
    newrsakey.d = '';
    newrsakey.p = '';
    newrsakey.q = '';
    newrsakey.dmp1 = '';
    newrsakey.dmq1 = '';
    newrsakey.coeff = '';
  
    let assetRegistry = await getAssetRegistry(newrsakey.getFullyQualifiedType());
    await assetRegistry.add(newrsakey);
    newpoll.rsakey = newrsakey;
  
    assetRegistry = await getAssetRegistry(newpoll.getFullyQualifiedType());
    await assetRegistry.add(newpoll);
   
    // creat votetoken for each voter
    let i = 0;
    for (;i < createPoll.voters.length; i++){
        let vtID = 'VT-' + createPoll.pollName + '-' + i.toString();
        const newVoteToken = factory.newResource(namespace, 'VoteToken', vtID);
        newVoteToken.creator = createPoll.pollOwner;
        newVoteToken.poll = newpoll;
        newVoteToken.response = '';
        newVoteToken.owner = createPoll.voters[i];
        assetRegistry = await getAssetRegistry(newVoteToken.getFullyQualifiedType());
        await assetRegistry.add(newVoteToken);
    }
}

/**
 * Modifies the response in a VoteToken, and send it back to the poll owner. 
 * The transaction will only be allowed if the receiver of the VoteToken is the creater of the token
 * @param {org.example.basic.Vote} voteForPoll
 * @transaction
 */
async function voteForPoll(vote) {

    //check the deadline
    if (vote.votetoken.poll.deadline != '') {
        let ddldate = new Date(vote.votetoken.poll.deadline);
        ddldate = ddldate.getTime();
        if (Date.now() > ddldate) {
            throw new Error('Poll deadline already past');
        }
    }
    
    // Encrypt the vote
    let response ='';
    if (vote.votetoken.poll.rsakey.n != '') {
        response = RSAencrypt(vote.response, vote.votetoken.poll.rsakey);
        console.log('Vote is encrypted');
    }
   
    vote.votetoken.owner = vote.votetoken.creator;
    if (response == ''){
        console.log('Vote is not encrypted');
        response = vote.response;
    }
    vote.votetoken.response = response;
    const assetRegistry = await getAssetRegistry('org.example.basic.VoteToken');
    // persist the state of the votetoken
    await assetRegistry.update(vote.votetoken);
}

/**
 * Reveal the poll secret which is previous only known by the owner of the poll
 * This action is only able to be performed after the poll deadline has reached
 * @param {org.example.basic.RevealKey} RevealPollSecretKey
 * @transaction
 */
async function RevealPollSecretKey(revealkey) {
    //check the deadline
    if (revealkey.poll.deadline != ''){
        let ddldate = new Date(revealkey.poll.deadline);
        ddldate = ddldate.getTime();
        if (Date.now() < ddldate) {
            throw new Error('Cannot reveal the key before poll deadline');
        }
    }
  
    const factory = getFactory();
    const namespace = 'org.example.basic';
    let id = revealkey.poll.rsakey.rsakeyID;
    let n = revealkey.poll.rsakey.n;
    let e = revealkey.poll.rsakey.e;
    
    const newrsakey = factory.newResource(namespace, 'RSAKey', id + '-P');
    newrsakey.rsakeyID = id + '-P';
    newrsakey.n = n;
    newrsakey.e = e;
    let d = revealkey.d;
    let p = revealkey.p;
    let q = revealkey.q;
    newrsakey.d = d;
    newrsakey.p = p;
    newrsakey.q = q;
    d = parseBigInt(d,16);
    p = parseBigInt(p,16);
    q = parseBigInt(q,16);
    let p1 = p.subtract(BigInteger.ONE);
    let q1 = q.subtract(BigInteger.ONE);
    let dmp1 = d.mod(p1);
    let dmq1 = d.mod(q1);
    let coef = q.modInverse(p);
    newrsakey.dmp1 = dmp1.toString();
    newrsakey.dmq1 = dmq1.toString();
    newrsakey.coeff = coef.toString();
    
    // test if the private key is correct before update to the RSAkey
    let test = 'Test RSA encryption';
    let ctest = RSAencrypt(test, newrsakey);
    ctest = RSAdecrypt(ctest, newrsakey);
    if (test != ctest) {
        throw new Error('Incorrect public/secret key pair, please try again');
    }
    console.log('Publishing private key...');
    
    let assetRegistry = await getAssetRegistry(revealkey.poll.rsakey.getFullyQualifiedType());
    await assetRegistry.remove(revealkey.poll.rsakey);
    
    assetRegistry = await getAssetRegistry(newrsakey.getFullyQualifiedType());
    await assetRegistry.add(newrsakey);
    revealkey.poll.rsakey = newrsakey;

    assetRegistry = await getAssetRegistry(revealkey.poll.getFullyQualifiedType());
    // persist the state of the votetoken
    await assetRegistry.update(revealkey.poll);
}


/**
 * Read the result by checking all received VoteToken, then these VoteTokens are destroyed. 
 * Unlock the poll owner to set up the next round. and determine the lottery winner (needs more research)
 * @param {org.example.basic.CompletePoll} CompleteThePoll
 * @transaction
 */
async function CompleteThePoll(completePoll) {
    console.log('completePoll');
    
    //check the deadline
    if (completePoll.poll.deadline != ''){
        let ddldate = new Date(completePoll.poll.deadline);
        ddldate = ddldate.getTime();
        if (Date.now() < ddldate) {
            throw new Error('Cannot complete the poll before its deadline');
        }
    }

    let encrypted = false;
    if (completePoll.poll.rsakey.n != ''){
        console.log("Decrypting votes...");
        encrypted = true;
    }

    const votetokens = await query('selectMatchingVoteTokens');
    if (votetokens.length >= 1 && completePoll.poll.result == '') {
        
        const qualifiedVT = votetokens.filter(function (votetoken) {
            return (votetoken.poll.getIdentifier() == completePoll.poll.getIdentifier()) && (votetoken.owner.getIdentifier() == completePoll.poll.host.getIdentifier());
        });
        
        let answers = {};
        for (let i = 0; i < qualifiedVT.length; i++) {
            //console.log(qualifiedVT[i].poll.getIdentifier());
            let response = qualifiedVT[i].response;

            // decrypt the vote
            if (encrypted) {
                response = RSAdecrypt(response, completePoll.poll.rsakey);
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
        completePoll.poll.result = maxk;
        
        //const assetRegistry = await getAssetRegistry('org.example.basic.Poll');
        // persist the state of the votetoken
        //await assetRegistry.update(completePoll.poll);


        let nbclassifier = new Naivebayes();
        // get the wanted classifier
        const nbcf = await query('selectNBclassifier', { nbcID: "nbc-public" });
        console.log('nbcf');
        console.log(nbcf);
        let nbcstr = nbcf[0].jsondata.replace(/'/g, '"');
        try {
            nbclassifier = nbclassifier.fromJson(nbcstr);
        } catch (e) {
            throw new Error('ERROR: Naivebayes.fromJson expects a valid JSON string');
        }

        nbclassifier.learn(completePoll.poll.pollDetail, maxk);
        console.log(nbclassifier);
        let jsonnb = nbclassifier.toJson();
        jsonnb = jsonnb.replace(/'/g, '"');
        console.log(jsonnb);


        
    } else {
        throw new Error('Poll already concluded or no voters has voted yet');
    }
}
