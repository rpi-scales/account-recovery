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
	completeProof=completeProof.replace(/"/g, "'");
	document.getElementById("resulttxt").value = completeProof;
}