// Depends on jsbn.js and rng.js

// Version 1.1: support utf-8 encoding in pkcs1pad2

function RSAencrypt(text, rsakey) {
    let n = parseBigInt(rsakey.n,16);
    let e = parseInt(rsakey.e,16);
    //console.log(RSAn);
    let m = pkcs1pad2(text,(n.bitLength()+7)>>3);
    if(m == null) return null;
    let c = m.modPowInt(e, n);
    if(c == null) return null;
    let h = c.toString(16);
    if((h.length & 1) == 0) return h; else return "0" + h;
}

// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s,n) {
  if(n < s.length + 11) { // TODO: fix for utf-8
    alert("Message too long for RSA");
    return null;
  }
  var ba = new Array();
  var i = s.length - 1;
  while(i >= 0 && n > 0) {
    var c = s.charCodeAt(i--);
    if(c < 128) { // encode using utf-8
      ba[--n] = c;
    }
    else if((c > 127) && (c < 2048)) {
      ba[--n] = (c & 63) | 128;
      ba[--n] = (c >> 6) | 192;
    }
    else {
      ba[--n] = (c & 63) | 128;
      ba[--n] = ((c >> 6) & 63) | 128;
      ba[--n] = (c >> 12) | 224;
    }
  }
  ba[--n] = 0;
  var rng = new SecureRandom();
  var x = new Array();
  while(n > 2) { // random non-zero pad
    x[0] = 0;
    while(x[0] == 0) rng.nextBytes(x);
    ba[--n] = x[0];
  }
  ba[--n] = 2;
  ba[--n] = 0;
  return new BigInteger(ba);
}



function RSAdecrypt(ctext, rsakey) {
    let c = parseBigInt(ctext, 16);
    let n = parseBigInt(rsakey.n,16);
    let m = RSADoPrivate(c, rsakey);
    if(m == null) return null;
    return pkcs1unpad2(m, (n.bitLength()+7)>>3);
}


function RSADoPrivate(x, rsakey) {
	let n = parseBigInt(rsakey.n,16);
    let d = parseBigInt(rsakey.d,16);
    let p = parseBigInt(rsakey.p,16);
    let q = parseBigInt(rsakey.q,16);
    let dmp1 = parseBigInt(rsakey.dmp1,10);
    let dmq1 = parseBigInt(rsakey.dmq1,10);
    let coeff = parseBigInt(rsakey.coeff,10);
  
    console.log('d:', rsakey.d);

    if(p == null || q == null)
        return x.modPow(d, n);

    // TODO: re-calculate any missing CRT params
    let xp = x.mod(p).modPow(dmp1, p);
    let xq = x.mod(q).modPow(dmq1, q);

    while(xp.compareTo(xq) < 0)
        xp = xp.add(p);
    return xp.subtract(xq).multiply(coeff).mod(p).multiply(q).add(xq);
}


// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d,n) {
  var b = d.toByteArray();
  var i = 0;
  while(i < b.length && b[i] == 0) ++i;
  if(b.length-i != n-1 || b[i] != 2)
    return null;
  ++i;
  while(b[i] != 0)
    if(++i >= b.length) return null;
  var ret = "";
  while(++i < b.length) {
    var c = b[i] & 255;
    if(c < 128) { // utf-8 decode
      ret += String.fromCharCode(c);
    }
    else if((c > 191) && (c < 224)) {
      ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
      ++i;
    }
    else {
      ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
      i += 2;
    }
  }
  return ret;
}

function parseBigInt(str,r) {
  return new BigInteger(str,r);
}