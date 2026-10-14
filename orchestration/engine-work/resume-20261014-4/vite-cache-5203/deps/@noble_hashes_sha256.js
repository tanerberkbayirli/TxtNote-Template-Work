import { i as sha256$1, n as SHA256$1, r as sha224$1, t as SHA224$1 } from "./sha2-CzHEPxPF.js";
//#region TxtNote/node_modules/@noble/hashes/esm/sha256.js
/**
* SHA2-256 a.k.a. sha256. In JS, it is the fastest hash, even faster than Blake3.
*
* To break sha256 using birthday attack, attackers need to try 2^128 hashes.
* BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
*
* Check out [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
* @module
* @deprecated
*/
/** @deprecated Use import from `noble/hashes/sha2` module */
var SHA256 = SHA256$1;
/** @deprecated Use import from `noble/hashes/sha2` module */
var sha256 = sha256$1;
/** @deprecated Use import from `noble/hashes/sha2` module */
var SHA224 = SHA224$1;
/** @deprecated Use import from `noble/hashes/sha2` module */
var sha224 = sha224$1;
//#endregion
export { SHA224, SHA256, sha224, sha256 };
