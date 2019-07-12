let key0 = {
	//public
	'n': '6317648c119084ddbd7b317b6e753f7d1a513d64151003068dd4c7b6f983b992821c49a4ea25bd43e674ae9567870698c40586286dc89f935d58eba0d5759ce1',
	'e': 10001,
	// private
	'd': 'dceb8a7fbda9369027a240efaf9437b7f2b4acea350b3db39f028540ab89c26ecaa5d4835cf55e444ba2cc9436798636043f71bc661330011ef24ca45500171',
	'p': 'c542a13db8a66dfbef4ea31da13d77f2a734e156596db521d0839d2c2d79d59b',
	'q': '80993d21b23d28d49e7eb31f68851b11848e80b89564a1f84ed87b61a5909d33'
}
let key1 = {
	//public
	'n': '7ba7111744d808dbb11fd70150b6107de61acc9b073f52ee9b79b92912d81db2f5a1755d9a777c80595de46c0aa1644db302fb07db9cf2e9d9356cdcb7fdf70b',
	'e': 10001,
	// private
	'd': 'a1de7261239e2afa6d44611137b71e9fb13a23de4dfe777223d594ae501cd9c238d48d5de7994acf1c2b03827e1939bd09098bb1ac0461fee1af6c3eb1f5a91',
	'p': 'c036479b1a18c8c337c7691896b6fe14c32ce04ca5e662d585c8724bb58f5f77',
	'q': 'a4b0327aa201edf5eccd19e3a20c6abd45f21d9c338bef14382b567a626e520d'
}
let key2 = {
	//public
	'n': 'b1972cdbf5e7ea805faaa8eee277caae778c8630943bdcbdcef37b81b7eed85fa1de9d9e9fc23cca45b98e0f22bf1920d578994c50ec43c6c6f5c24859bb1479',
	'e': 10001,
	// private
	'd': '37b3bf324ef32b2e90d32aa1a30f07d7a94fbe574667705968ac1e3515c828bd6e9b53a26cfaab4ec0a3202e78f7f2051181713387b6443c7d5a5f19fe266471',
	'p': 'fbfd0f7bf12c3d7ae299fa3c33acfd854e27d7a81661a322e8652a5deb69e5df',
	'q': 'b46aeade93b8d08417a1492e54905a1ce786ebec267e52e4e87e01b7f3dde0a7'
}
let key3 = {
	//public
	'n': '479a84cdced9015dd2e75f820173d1f1c8fc9869a54fb5a1409bfe7ddc502ae836d47fb8aadcdc8d2b6351272aceee7e98fe26059895ba9d548c24628e121af1',
	'e': 10001,
	// private
	'd': '41c80319d05e2c93359eba6f8546122a3eab509a3df4ecb827d3280a18cccd9d6f7505e2082bcbadf304458517847b321ec61852291dbf89c82b1e8e8fba09d',
	'p': '89a5a75a6b45b4efb2d2170adb64326c50f21b3886d1478829727f6e901e11db',
	'q': '852ba0023601e0f52b121beee0d37d974eaddb7c09e04e2d8f04410aecfa1e23'
}
let key4 = {
	//public
	'n': '9302c7fa0c7a4f746c6430f2151e80cf0891c5d004560cedfc7c76bfbc24b6526d8fc7d60829e6926deec64182a7f086bcf3f25d03cc4ed33cb77b53148d02f5',
	'e': 10001,
	// private
	'd': '63a603f56b55d0dbc2c91b204cce735362a4a4e83eb8316573bace276319a3772b7e09df493eecee178bf379d29dfdfaad73d30e4380f40e745d39aa65d3c621',
	'p': 'e49b2da1bf3f50e4e35bd3c83551b575173852edf488f863290b3ee520df4129',
	'q': 'a4a08cd3b32fc294d561631a592555fba77576b99c077b70320870bc133630ed'
}

let keys = [key0, key1, key2, key3, key4];



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