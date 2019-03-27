model.cto       // Model
voting.js       // functions for voting

	createANewPoll
	voteForPoll
	RevealPollSecretKey
	CompleteThePoll

complain.js     // functions for complain

	recoverAccount
	finishRecovery
	refuseRecovery

query.qry       // query file for voting and complain
	
	selectMatchingVoteTokens
	selectNBclassifier
	selectMatchingUser
	selectMatchingPoll
	selectMatchingProposal
	selectProposalsbyOldAccount

permissions.acl // rules of permission to transactions and assets
	
	OwnerHasFullAccessToThemselves
	EverybodyHasFullAccessToRSAKey
	OwnerHasFullAccessToTheirVoteToken
	OwnerHasFullAccessToTheirPoll
	OnlyVoteTokenOwnerCanVote
	EverybodyCanSubmitAccountRecovery
	OnlyInitiatorEndAccountRecovery
	OnlyOwnerCanVetoRecovery
	EverybodyCanCreateProposal
	OnlyOwnerHasFullAccessToTheirProposal


Notice: the following classifier.js, rsa.js and library.js contain works of other programmers

{
classifier.js   // Modified from Tolga Tezel's work
	--
	Copyright (c) by Tolga Tezel <tolgatezel11@gmail.com>
	--
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	--
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	--
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
}

{
rsa.js          // Copyright (c) 2005  Tom Wu
library.js      // Copyright (c) 2005  Tom Wu Basic JavaScript BN library
	@author "Tom Wu" <tjw@cs.stanford.edu>
	http://www-cs-students.stanford.edu/~tjw/jsbn/
}
