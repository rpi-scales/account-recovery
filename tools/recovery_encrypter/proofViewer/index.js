function clear() {
	return;
}

function decryptProof() {
	let enproof = document.getElementById("prooftxt").value.replace(/'/g, '"');
	let enproofjson = {};
	try {
        enproofjson = JSON.parse(enproof)
    } catch (e) {
        alert('The proof textbox expects a valid JSON string');
        return;
    }

    let n = document.getElementById("inputn").value;
    let e = document.getElementById("inpute").value;
    let d = document.getElementById("inputd").value;
    let p = document.getElementById("inputp").value;
    let q = document.getElementById("inputq").value;

    let key = new rsaKey();
	key.setAll(n, e, d, p, q);

	if (!(n in enproofjson)) {
		alert('The public key \"n\" you put was not found in the proof. 1: The key was not pasted correctly, 2: You are not one of the voters');
		return;
	}
	let entxt = enproofjson[n];
	let ans = RSAdecrypt(entxt, key);
	document.getElementById("anstxt").value = ans;
}