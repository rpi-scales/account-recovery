/*
module.exports = function (options) {
  return new Naivebayes(options)
}
*/

// keys we use to serialize a classifier's state
let STATE_KEYS = Naivebayes.prototype.STATE_KEYS = [
  'categories', 'docCount', 'totalDocuments', 'feature', 'featureSize',
  'wordCount', 'wordFrequencyCount', 'options'
];

/**
 * Initializes a NaiveBayes instance from a JSON state representation.
 * Use this with classifier.toJson().
 *
 * @param  {String} jsonStr   state representation obtained by classifier.toJson()
 * @return {NaiveBayes}       Classifier
 */
Naivebayes.prototype.fromJson = function (jsonStr) {
  var parsed;
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error('Naivebayes.fromJson expects a valid JSON string.')
  }
  // init a new classifier
  var classifier = new Naivebayes(parsed.options);

  // override the classifier's state
  STATE_KEYS.forEach(function (k) {
    if (typeof parsed[k] === 'undefined' || parsed[k] === null) {
      throw new Error('Naivebayes.fromJson: JSON string is missing an expected property: `'+k+'`.')
    }
    classifier[k] = parsed[k]
  })

  return classifier
}

/**
 * fallback tokenizer
 *
 * @param  {String} text
 * @return {Array}
 */
let defaultTokenizer = function (text) {
  //remove punctuation from text - remove anything that isn't a word char or a space
  console.log('FALLBACK TOKENIZER IS RUNNING')
  var rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g
  var sanitized = text.replace(rgxPunctuation, ' ')
  //console.log(sanitized);
  let wordlist = sanitized.split(/\s+/);
  listfeatures = wordlist.join('|').toLowerCase().split('|');
  return wordlist
}


/**$
 * review tokenizer
 *
 * @param  {String} text
 * @return {Array}
 */
let reviewTokenizer = function (text) {
  var rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g
  var sanitized = text.replace(rgxPunctuation, ' ')
  //console.log(sanitized);
  let wordlist = sanitized.split(/\s+/);
  let wordslen = wordlist.length;
  let listfeatures = wordlist.join('|').toLowerCase().split('|');
  //listfeatures = [];

  //Additional features for reivew
  //Record the length, user cannot fake this string because punctuation is removed from words
  let flen = 'len=' + Math.round(wordslen/1).toString();
  listfeatures.push(flen);

  //Record the number of times a number occured in a review
  let numbercount = text.replace(/\D/g,' ').split(/\s+/).length-2;
  let fnum = "num=" + numbercount.toString();
  listfeatures.push(fnum);

  let povlist = [
  ['we', 'us', 'our', 'ours', 'me', 'ourselves', 'i', 'my', 'mine'],
  ['you', 'your',' yours', 'yourself', 'yourselves'],
  ['she', 'her', 'hers', 'herself', 'he', 'him', 'his', 'himself', 'it', 'its', 'they', 'them', 'their', 'theirs']
  ];
  let povcount = [0, 0, 0];
  let sumpov = 0;
  wordlist.forEach(function (word) {
    for (let j=0; j<povlist.length; j++){
      if (povlist[j].indexOf(word) != -1){
        povcount[j] += 1;
        sumpov += 1;
      }
    }
  })
  let featname = ['first-person', 'second-person', 'third-person'];
  for (let i=0; i<povcount.length; i++){
    if (sumpov)
      listfeatures.push(featname[i]+'='+ Math.round(povcount[i]*100/(sumpov))+'%');
    else
      listfeatures.push(featname[i]+'=0%');
  }
  //console.log('listfeatures');
  //console.log(listfeatures);
  return listfeatures;
}


/**
 * reviewer tokenizer
 *
 * @param  {String} text
 * @return {Array}
 */
let reviewerTokenizer = function (text) {
  var parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('Learn or categorize expects a valid JSON string.')
  }
  let listfeatures = [];
    //check details of username
  //length of username
  let uname = parsed.username;
  listfeatures.push("usernamelen=" + uname.length.toString());
  //number of times a digit occurred
  let numbercount = uname.replace(/\D/g,'').length;
  listfeatures.push("usernamenumcount=" + numbercount.toString());


  listfeatures.push("city=" + parsed.city);
  listfeatures.push("level=" + parsed.level.toString());
  listfeatures.push("experience=" + parsed.experience.toString());
  listfeatures.push("token_balance=" + parsed.token_balance.toString());

  listfeatures.push("restaurants_advertised=" + parsed.restaurants_advertised.length.toString());
  listfeatures.push("peer_review=" + parsed.peer_review.length.toString());

  console.log('listfeatures');
  console.log(listfeatures);
  return listfeatures;
}


/**
 * Naive-Bayes Classifier
 *
 * This is a naive-bayes classifier that uses Laplace Smoothing.
  * @param  {String} datatype for review or reviewer
 *
 */
function Naivebayes (datatype) {
  datatype = datatype || 0;
  this.options = datatype.toString().toLowerCase();
  if (this.options == 'review')
    this.tokenizer = reviewTokenizer;
  else if (this.options == 'reviewer')
    this.tokenizer = reviewerTokenizer;
  else
    this.tokenizer = defaultTokenizer;
  
  this.feature = {} //feature and its size
  this.featureSize = 0
  this.totalDocuments = 0 //number of documents we have learned from  
  this.docCount = {} //for each category, how often were documents mapped to it
  this.wordCount = {} //for each category, how many words total were mapped to it
  this.wordFrequencyCount = {} // for each category, how frequent was a given word mapped to it  
  this.categories = {} //hashmap of our category names
}

/**
 * Initialize each of our data structure entries for this new category
 *
 * @param  {String} categoryName
 */
Naivebayes.prototype.initializeCategory = function (categoryName) {
  if (!this.categories[categoryName]) {
    this.docCount[categoryName] = 0
    this.wordCount[categoryName] = 0
    this.wordFrequencyCount[categoryName] = {}
    this.categories[categoryName] = true
  }
  return this
}

/**
 * train our naive-bayes classifier by telling it what `category`
 * the `text` corresponds to.
 *
 * @param  {String} text
 * @param  {String} class
 */
Naivebayes.prototype.learn = function (text, category) {
  var self = this
  //initialize category data structures if we've never seen this category
  self.initializeCategory(category)
  //update our count of how many documents mapped to this category
  self.docCount[category]++
  //update the total number of documents we have learned from
  self.totalDocuments++
  //normalize the text into a word array
  var tokens = self.tokenizer(text)
  //get a frequency count for each token in the text
  var frequencyTable = self.frequencyTable(tokens)
  /*
      Update our feature and our word frequency count for this category
   */

  Object
  .keys(frequencyTable)
  .forEach(function (token) {
    //add this word to our feature if not already existing
    if (!self.feature[token]) {
      self.feature[token] = true;
      self.featureSize++;
    }

    var frequencyInText = frequencyTable[token]

    //update the frequency information for this word in this category
    if (!self.wordFrequencyCount[category][token])
      self.wordFrequencyCount[category][token] = frequencyInText
    else
      self.wordFrequencyCount[category][token] += frequencyInText

    //update the count of all words we have seen mapped to this category
    self.wordCount[category] += frequencyInText
  })

  return self
}

/**
 * Determine what category `text` belongs to.
 *
 * @param  {String} text
   @param  {String} desiredCat
   @param  {String} threshold
   @param  {Boolean} showpossibility
 * @return {String} category
 */
Naivebayes.prototype.categorize = function (text, desiredCat, threshold, showpossibility) {
  desiredCat = desiredCat || 0;
  threshold = threshold || 0;
  showpossibility = showpossibility || 0;

  var self = this
    , maxProbability = -Infinity
    , chosenCategory = null

  var tokens = self.tokenizer(text)
  var frequencyTable = self.frequencyTable(tokens)

  //iterate thru our categories to find the one with max probability for this text
  let probs = [];
  let catprobs = [];
  Object
  .keys(self.categories)
  .forEach(function (category) {

    //start by calculating the overall probability of this category
    //=>  out of all documents we've ever looked at, how many were
    //    mapped to this category

    //take the log to avoid underflow
    let logProbability = Math.log(self.docCount[category]) - Math.log(self.totalDocuments);
    //now determine P( w | c ) for each word `w` in the text
    Object
    .keys(frequencyTable)
    .forEach(function (token) {
      var frequencyInText = frequencyTable[token]
      var tokenProbability = self.tokenProbability(token, category)
      //console.log(token, frequencyInText * Math.log(tokenProbability));

      // console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)

      //determine the log of the P( w | c ) for this word
      logProbability += frequencyInText * Math.log(tokenProbability)
    })
    probs.push(logProbability);
    catprobs.push([category, logProbability]);

    if (logProbability > maxProbability) {
      maxProbability = logProbability;
      chosenCategory = category;
    }
  })
  let returnCategory = chosenCategory;
  //calculate the prob of this category if user given the desired category and limit
  if (desiredCat != 0 && threshold != 0) {
    probs.sort();
    let secondcat = '';
    catprobs.forEach(function (catprob) {
    if (catprob[1] == probs[1]) {
      secondcat = catprob[0]
    }
    });
    console.log('['+chosenCategory+'] is e^'+ (probs[0] - probs[1]) + ' times more likely than [' + secondcat+']');
    if (probs.length > 1 && chosenCategory==desiredCat && probs[0] - probs[1] > Math.log(threshold)){
      returnCategory = desiredCat;
    } else {
      returnCategory = 'not '+ desiredCat;
    }
  }
  // if user want the probability of each category to be
  if (showpossibility) {
    //normallize each category
    let probsum = 0;
    catprobs.forEach(function (catprob) {
      catprob[1] -= maxProbability;
      catprob[1] = Math.exp(catprob[1]);
      probsum += catprob[1];
    });
    catprobs.forEach(function (catprob) {
      catprob[1] /= probsum;
    });
    return [returnCategory, catprobs];
  }
  console.log(returnCategory);
  return returnCategory;
}

/**
 * Calculate probability that a `token` belongs to a `category`
 *
 * @param  {String} token
 * @param  {String} category
 * @return {Number} probability
 */
Naivebayes.prototype.tokenProbability = function (token, category) {
  //how many times this word has occurred in documents mapped to this category
  let wordFrequencyCount = this.wordFrequencyCount[category][token] || 0

  //what is the count of all words that have ever been mapped to this category
  let wordCount = this.wordCount[category]

  //use laplace Add-1 Smoothing equation
  return ( wordFrequencyCount + 1) / ( wordCount + this.featureSize )
}

/**
 * Build a frequency hashmap where
 * - the keys are the entries in `tokens`
 * - the values are the frequency of each entry in `tokens`
 *
 * @param  {Array} tokens  Normalized word array
 * @return {Object}
 */
Naivebayes.prototype.frequencyTable = function (tokens) {
  var frequencyTable = Object.create(null)

  tokens.forEach(function (token) {
    if (!frequencyTable[token])
      frequencyTable[token] = 1
    else
      frequencyTable[token]++
  })

  return frequencyTable
}

/**
 * Dump the classifier's state as a JSON string.
 * @return {String} Representation of the classifier.
 */
Naivebayes.prototype.toJson = function () {
  let state = {};
  let self = this;
  STATE_KEYS.forEach(function (k) {
    state[k] = self[k]
  })

  let jsonStr = JSON.stringify(state)

  return jsonStr
}


/**
 * @return {Number} Return the classifier's number of features.
 */
Naivebayes.prototype.getSize = function () {
  let self = this;
  return self.featureSize;
}


/**
 * reduce the size of the classifier
 */
Naivebayes.prototype.reduce = function () {
  let self = this;
  Object
  .keys(self.wordFrequencyCount)
  .forEach(function (label) {
    // average occurance of a feature
    let meanCount = self.wordCount[label] / (Object.keys(self.wordFrequencyCount[label]).length);
    //console.log(self.wordFrequencyCount[label]);
    Object
    .keys(self.wordFrequencyCount[label])
    .forEach(function (key) { // val occurance of this feature
      if (self.wordFrequencyCount[label][key] < 1 + 0.5 * meanCount) {
        self.wordCount[label] -= self.wordFrequencyCount[label][key];
        delete self.wordFrequencyCount[label][key];
        
        let unique = 1;
        Object
        .values(self.wordFrequencyCount)
        .forEach(function (value) {
          if (Object.keys(value).indexOf(key) != -1 ) {
            unique = 0;
          }
        });
        if (unique) {
          delete self.feature[key];
          self.featureSize -= 1;
        }
      }
    });
    //Object.keys(self.wordFrequencyCount[label]).length;

  });
  this.wordCount = self.wordCount;
  this.wordFrequencyCount = self.wordFrequencyCount;
  this.feature = self.feature;
  this.featureSize = self.featureSize;
  return self.featureSize;
}


