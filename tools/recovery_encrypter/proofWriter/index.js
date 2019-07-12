function globalVariables() {
	// pubKeyPairs and privKeyPairs are the hardcoded rsa public and private key pair
	this.rsakeys = [];

	this.initRSAKey = function(k) {
		for (let i=0; i<k.length; i++) {
			nk = new rsaKey();
			nk.setAll(k[i].n, k[i].e, k[i].d, k[i].p, k[i].q);
			this.rsakeys.push(nk);
		}
    };
}

let globals = new globalVariables();
globals.initRSAKey(keys);

function rsaKey() {
    this.n = '';
    this.e = 10001;
    this.d = '';
    this.p = '';
    this.q = '';
    this.dmp1 = '';
    this.dmq1 = '';
    this.coeff = '';

    this.setPub = function(pubKey) {
    	this.n = pubKey;
    };
    this.setAll = function(n, e, d, p, q) {
    	this.n = n;
	    this.e = e;
	    this.d = d;
	    this.p = p;
	    this.q = q;
	    this.validate();
    }
    this.validate = function() {
        let d = parseBigInt(this.d,16);
	    let p = parseBigInt(this.p,16);
	    let q = parseBigInt(this.q,16);
	    let p1 = p.subtract(BigInteger.ONE);
	    let q1 = q.subtract(BigInteger.ONE);
	    let dmp1 = d.mod(p1);
	    let dmq1 = d.mod(q1);
	    let coef = q.modInverse(p);
	    this.dmp1 = dmp1.toString();
	    this.dmq1 = dmq1.toString();
	    this.coeff = coef.toString();
	    // test if the private key is correct before update to the RSAkey
	    let test = 'Test RSA encryption';
	    let ctest = RSAencrypt(test, this);
	    ctest = RSAdecrypt(ctest, this);
	    if (test != ctest) {
	        alert('Incorrect public/secret key pair, please try again');
	    }
    }
}

function clear() {
	return;
}

function createInput() {
	// clean old modules
	let vtm = document.getElementById("voterMain");
	let oldmods = document.getElementById("vmd");
	if (oldmods) {
		vtm.removeChild(oldmods);
	}
    
    let mods = document.createElement("div");
	mods.setAttribute('id', 'vmd');
	mods.setAttribute('class', 'voterModules');
	for (let i=0; i<globals.rsakeys.length; i++) {
		let txt = document.createTextNode("\nWrite proof for " + globals.rsakeys[i].n + "\n");
		let br = document.createElement("BR");
		let box = document.createElement("input");
		box.setAttribute('id', 'txtbox'+i.toString());
		box.setAttribute('class', 'voterBox');
		box.setAttribute('type', 'text');
		box.setAttribute('value', 'default');
		let mod = document.createElement("div");
		mod.setAttribute('id', 'voterModule'+i.toString());
		mod.setAttribute('class', 'voterModule');
  		mod.appendChild(txt);
		mod.appendChild(box);
		mod.appendChild(br);
		mods.appendChild(mod);
	}
	let btn = document.createElement("INPUT");
	btn.setAttribute("type", "button");
	btn.setAttribute('id', 'proofbtn');
	btn.setAttribute("value", "Submit recovery proof");
	btn.setAttribute("onclick", "submitProof()");
	mods.appendChild(btn);
	vtm.appendChild(mods);
}

function submitProof() {
	let txts = document.getElementsByClassName("voterBox");
	if (txts.length != globals.rsakeys.length) {
		alert("Unable to encrypt");
		return;
	}
	let rsaKeyList = {};
	for (let i=0; i<globals.rsakeys.length; i++) {
		let proof = document.getElementById("txtbox"+i.toString()).value; // the proof that the user writes
		response = RSAencrypt(proof, globals.rsakeys[i]);
		//ans = RSAdecrypt(response, globals.rsakeys[i]);
		let pk = globals.rsakeys[i].n;
		rsaKeyList[pk] = response;
	}
	let completeProof = JSON.stringify(rsaKeyList);
	document.getElementById("resulttxt").value = completeProof;
}



/*

		function nbTrain(){
			let text = document.nbtest.plaintext1.value;
			let category = document.nbtest.plaintext2.value;
			classifier.learn(text, category);

		}
		function nbCategorize(){
			let text = document.nbtest.plaintext3.value;
			let result = classifier.categorize(text,0, 0, true);
			console.log(result);
			document.nbtest.status.value = result;
			//classifier.learn('amazing, awesome movie!! Yeah!! Oh boy.', 'positive')
		}

		function nbToJSON(){
			let stateJson = classifier.toJson();
			document.nbtest.savejsonstring.value = stateJson;
			console.log(classifier);
			document.nbtest.classsize.value = classifier.getSize();
		}

		function nbFromJSON(){
			let jsonstr = document.nbtest.loadjsonstring.value;

			try {
			    classifier = classifier.fromJson(jsonstr);
			} catch (e) {
			    alert('ERROR: Naivebayes.fromJson expects a valid JSON string.');
			}
			console.log(classifier);
		}


		function nbTestTrain(){
			//classifier = new Naivebayes();
			for (let i = 0; i < trainingdata.length; i++){
				console.log(trainingdata[i].Category);
				classifier.learn(trainingdata[i].Text, trainingdata[i].Category);
			}
			document.nbtest.ttrainsz.value = trainingdata.length;
		}


		
		function nbTestWithThreshold(catP, trsh){
			let trueP = 0;
			let falseP = 0;
			let trueN = 0;
			let falseN = 0;
			for (let i=0; i<testingdata.length; i++){
				let res = classifier.categorize(testingdata[i].Text, catP, trsh);
				if (res == catP){
					if (testingdata[i].Category == catP) {
						trueP += 1;
					}
					else {
						falseP += 1;
					}
				} else {
					if (testingdata[i].Category == catP) {
						falseN += 1;
					}
					else {
						trueN += 1;
					}
				}
			}
			return [trueP, falseP, trueN, falseN];
		}


		function nbTestCategorize(limited){
		    let result = '';
		    let catP = document.nbtest.plaintextPC.value;
			let catN = document.nbtest.plaintextNC.value;
			let trsh = 1;
			if (limited) {
				trsh = document.nbtest.plaintext5.value;
			}

				
			let res = nbTestWithThreshold(catP, trsh);

			let rTP = res[0];
			let rFP = res[1];
			let rTN = res[2];
			let rFN = res[3];
			
			let rAC = (rTP+rTN)/(rTP+rFP+rFN+rTN);
			let rPC = rTP/(rTP+rFP);
			let rRC = rTP/(rTP+rFN);
			let rFS = 2*(rRC * rPC) / (rRC + rPC)
			
			console.log('test end');
			document.nbtest.ttestsz.value = testingdata.length;
			document.nbtest.nbTP.value = rTP;
			document.nbtest.nbFP.value = rFP;
			document.nbtest.nbTN.value = rTN;
			document.nbtest.nbFN.value = rFN;
			
			document.nbtest.nbAC.value = rAC;
			document.nbtest.nbPC.value = rPC;
			document.nbtest.nbRC.value = rRC;
			document.nbtest.nbFS.value = rFS;
		}
		
		function nbReduce(){
			classifier.reduce();
		}


		function drawChart(){
			let step = 0.5;
			let listx = [];
			let listy0 = [];
			let listy1 = [];
			let listy2 = [];
			let listy3 = [];
			let expn = document.nbtest.plaintexttexp.value;
			for (let i = -5/step; i < expn/step; i++){
				listx.push(i*step);
				let catP = document.nbtest.plaintextPC.value;
				let catN = document.nbtest.plaintextNC.value;
				let res = nbTestWithThreshold(catP, i*step);

				let rTP = res[0];
				let rFP = res[1];
				let rTN = res[2];
				let rFN = res[3];
				
				let rAC = (rTP+rTN)/(rTP+rFP+rFN+rTN);
				let rPC = rTP/(rTP+rFP);
				let rRC = rTP/(rTP+rFN);
				let rFS = 2*(rRC * rPC) / (rRC + rPC)
				
				
				listy0.push(100*rAC);
				listy1.push(100*rPC);
				listy2.push(100*rRC);
				listy3.push(100*rFS);

			}

			var trace0 = {
			  x: listx,
			  y: listy0,
			  type: 'scatter',
			  name: '% Accuracy'
			};
			var trace1 = {
			  x: listx,
			  y: listy1,
			  type: 'scatter',
			  name: '% Precision'
			};
			var trace2 = {
			  x: listx,
			  y: listy2,
			  type: 'scatter',
			  name: '% Recall'
			};
			var trace3 = {
			  x: listx,
			  y: listy3,
			  type: 'scatter',
			  name: '% F-score'
			};

			var layout = {
			  title: 'Performance of Naivebayes classifier under different thresholds',
			  xaxis: {
			    title: 'Threshold in exp',
			    showgrid: false,
			    zeroline: false
			  },
			  yaxis: {
			    title: 'Percent',
			    showline: false
			  }
			};

			var data = [trace0, trace1, trace2, trace3];
			Plotly.newPlot('plot1', data, layout);
		}
*/