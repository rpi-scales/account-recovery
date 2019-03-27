# Voting simulator
import math

class Game(object):
    # number of voters, super majority threshold, reward when correct vote, reward when wrong vote
    def __init__(self, n, k, rr, rw):
        self.numPlayer = n
        self.k = float(k)
        self.rewardRight = rr
        self.rewardWrong = rw
        # R: Random
        # T: Truthful
        # S: Spam
        # H: Ham
        self.strategy = [["R", "S"], ["R", "H"], ["T", "S"], ["T", "H"]]
        # price of time voters spent voting
        self.voteCost = 1

    def getReward(self, strategy, correct):
        r = 0
        if strategy[1] == correct:
            r += self.rewardRight
        else:
            r += self.rewardWrong
        # A truthful vote will cost time
        if strategy[0] == "T":
            r -= self.voteCost
        return r

    def generateOutcomes(self, correct):
        outcomes = [[]]

        # generate all outcomes
        for n in range(self.numPlayer):
            newoutcome = []
            for s in self.strategy:
                if s[0] == "T" and s[1] != correct:
                    continue
                for oc in outcomes:
                    newoutcome.append([s] + oc)
            outcomes = newoutcome

        # calculate the voting reward for each outcome
        for outcome in outcomes:
            topvote = "S"
            result = {"S": 0, "H": 0}
            for vote in outcome:
                result[vote[1]] += 1

            # Ham is difficult to get, so >k voters vote means ham
            if result["H"] >= round(self.numPlayer * self.k):
                topvote = "H"

            for i in range(len(outcome)):
                reward = self.getReward(outcome[i], topvote)
                outcome[i] = outcome[i] + [reward]

        return outcomes

    # correct is the correct answer: spam/ham
    def play(self, correct):
        outcomes = self.generateOutcomes(correct)
        for outcome in outcomes:
            print outcome

        # calculate the rational choice, equilibrium state for each voter
        for p in range(1):
            strategy = dict()
            totalreward = {"R": 0, "T": 0}
            totalcount = {"R": 0, "T": 0}
            for outcome in outcomes:
                playervote = outcome[p]
                totalreward[playervote[0]] += playervote[2]
                totalcount[playervote[0]] += 1

                # other people's strategy
                other = outcome[:]
                del other[p]
                other = "".join([o[0] for o in other])

                # reverse calculate the player's strategy given other's strategy
                if other not in strategy:
                    strategy[other] = []
                strategy[other].append(playervote)

            # merge random choices together (Random(Spam) + Random(Ham) = Random)
            for k in strategy:
                # news = [choice, total reward, reward counts]
                news = [["R", 0, 0], ["T", 0, 0]]
                for s in strategy[k]:
                    if s[0] == "R":
                        news[0][1] += s[2]
                        news[0][2] += 1.0
                    else:
                        news[1][1] += s[2]
                        news[1][2] += 1.0
                news[0][1] /= news[0][2]
                news[1][1] /= news[1][2]
                strategy[k] = news

            truthful = 0
            random = 0
            for k in sorted(strategy):
                if strategy[k][0][1] < strategy[k][1][1]:
                    truthful += 1
                else:
                    random += 1
                print "Others_choices: {}  My_choices:".format(k), strategy[k][0][:2], strategy[k][1][:2], strategy[k][0][1] < strategy[k][1][1]
            print "Vote randomly dominance: {}\nVote truthfully dominance: {}".format(random, truthful)
            print "Expected reward random:", totalreward["R"]/float(totalcount["R"]), " Expected reward truthfull:", totalreward["T"]/float(totalcount["T"])

# number of voters, super majority threshold, reward when correct vote, reward when wrong vote
game = Game(6, 0.6, 100, 0)
#58.2304526749  94.4732510288
# H, S
game.play("S")
