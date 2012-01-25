/*

	Notice of Copyrights and Licenses:
	-------------------------------------
	The bitaddress.org project, software and embedded resources are copyright bitaddress.org. 
	The bitaddress.org name and logo are not part of the open source license.

	Portions of the all-in-one HTML document contain JavaScript codes that are the copyrights of others. 
	The individual copyrights are included throughout the document along with their licenses.
	Included JavaScript libraries are separated with HTML script tags.

	Summary of JavaScript functions with a redistributable license:
	JavaScript function		License
	-------------------		--------------
	Array.prototype.map		Public Domain
	window.Crypto			BSD License
	window.SecureRandom		BSD License
	window.EllipticCurve		BSD License
	window.BigInteger		BSD License
	window.QRCode			MIT License
	window.Bitcoin			MIT License

	The bitaddress.org software is available under The MIT License (MIT)
	Copyright (c) 2011 bitaddress.org

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and 
	associated documentation files (the "Software"), to deal in the Software without restriction, including 
	without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject 
	to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial 
	portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
	LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	GitHub Repository: https://github.com/pointbiz/bitaddress.org
*/



	// Array.prototype.map function is in the public domain.
	// Production steps of ECMA-262, Edition 5, 15.4.4.19  
	// Reference: http://es5.github.com/#x15.4.4.19  
	if (!Array.prototype.map) {
		Array.prototype.map = function (callback, thisArg) {
			var T, A, k;
			if (this == null) {
				throw new TypeError(" this is null or not defined");
			}
			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
			var O = Object(this);
			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
			// 3. Let len be ToUint32(lenValue).  
			var len = O.length >>> 0;
			// 4. If IsCallable(callback) is false, throw a TypeError exception.  
			// See: http://es5.github.com/#x9.11  
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
			if (thisArg) {
				T = thisArg;
			}
			// 6. Let A be a new array created as if by the expression new Array(len) where Array is  
			// the standard built-in constructor with that name and len is the value of len.  
			A = new Array(len);
			// 7. Let k be 0  
			k = 0;
			// 8. Repeat, while k < len  
			while (k < len) {
				var kValue, mappedValue;
				// a. Let Pk be ToString(k).  
				//   This is implicit for LHS operands of the in operator  
				// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
				//   This step can be combined with c  
				// c. If kPresent is true, then  
				if (k in O) {
					// i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
					kValue = O[k];
					// ii. Let mappedValue be the result of calling the Call internal method of callback  
					// with T as the this value and argument list containing kValue, k, and O.  
					mappedValue = callback.call(T, kValue, k, O);
					// iii. Call the DefineOwnProperty internal method of A with arguments  
					// Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},  
					// and false.  
					// In browsers that support Object.defineProperty, use the following:  
					// Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });  
					// For best browser support, use the following:  
					A[k] = mappedValue;
				}
				// d. Increase k by 1.  
				k++;
			}
			// 9. return A  
			return A;
		};
	}  

	(function () {

		var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

		// Global Crypto object
		var Crypto = window.Crypto = {};

		// Crypto utilities
		var util = Crypto.util = {

			// Bit-wise rotate left
			rotl: function (n, b) {
				return (n << b) | (n >>> (32 - b));
			},

			// Bit-wise rotate right
			rotr: function (n, b) {
				return (n << (32 - b)) | (n >>> b);
			},

			// Swap big-endian to little-endian and vice versa
			endian: function (n) {

				// If number given, swap endian
				if (n.constructor == Number) {
					return util.rotl(n, 8) & 0x00FF00FF |
			util.rotl(n, 24) & 0xFF00FF00;
				}

				// Else, assume array and swap all items
				for (var i = 0; i < n.length; i++)
					n[i] = util.endian(n[i]);
				return n;

			},

			// Generate an array of any length of random bytes
			randomBytes: function (n) {
				for (var bytes = []; n > 0; n--)
					bytes.push(Math.floor(Math.random() * 256));
				return bytes;
			},

			// Convert a byte array to big-endian 32-bit words
			bytesToWords: function (bytes) {
				for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
					words[b >>> 5] |= bytes[i] << (24 - b % 32);
				return words;
			},

			// Convert big-endian 32-bit words to a byte array
			wordsToBytes: function (words) {
				for (var bytes = [], b = 0; b < words.length * 32; b += 8)
					bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
				return bytes;
			},

			// Convert a byte array to a hex string
			bytesToHex: function (bytes) {
				for (var hex = [], i = 0; i < bytes.length; i++) {
					hex.push((bytes[i] >>> 4).toString(16));
					hex.push((bytes[i] & 0xF).toString(16));
				}
				return hex.join("");
			},

			// Convert a hex string to a byte array
			hexToBytes: function (hex) {
				for (var bytes = [], c = 0; c < hex.length; c += 2)
					bytes.push(parseInt(hex.substr(c, 2), 16));
				return bytes;
			},

			// Convert a byte array to a base-64 string
			bytesToBase64: function (bytes) {

				// Use browser-native function if it exists
				if (typeof btoa == "function") return btoa(Binary.bytesToString(bytes));

				for (var base64 = [], i = 0; i < bytes.length; i += 3) {
					var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
					for (var j = 0; j < 4; j++) {
						if (i * 8 + j * 6 <= bytes.length * 8)
							base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
						else base64.push("=");
					}
				}

				return base64.join("");

			},

			// Convert a base-64 string to a byte array
			base64ToBytes: function (base64) {

				// Use browser-native function if it exists
				if (typeof atob == "function") return Binary.stringToBytes(atob(base64));

				// Remove non-base-64 characters
				base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");

				for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
					if (imod4 == 0) continue;
					bytes.push(((base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2)) |
				(base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
				}

				return bytes;

			}

		};

		// Crypto mode namespace
		Crypto.mode = {};

		// Crypto character encodings
		var charenc = Crypto.charenc = {};

		// UTF-8 encoding
		var UTF8 = charenc.UTF8 = {

			// Convert a string to a byte array
			stringToBytes: function (str) {
				return Binary.stringToBytes(unescape(encodeURIComponent(str)));
			},

			// Convert a byte array to a string
			bytesToString: function (bytes) {
				return decodeURIComponent(escape(Binary.bytesToString(bytes)));
			}

		};

		// Binary encoding
		var Binary = charenc.Binary = {

			// Convert a string to a byte array
			stringToBytes: function (str) {
				for (var bytes = [], i = 0; i < str.length; i++)
					bytes.push(str.charCodeAt(i));
				return bytes;
			},

			// Convert a byte array to a string
			bytesToString: function (bytes) {
				for (var str = [], i = 0; i < bytes.length; i++)
					str.push(String.fromCharCode(bytes[i]));
				return str.join("");
			}

		};

	})();



		/*!
		* Crypto-JS v2.0.0
		* http://code.google.com/p/crypto-js/
		* Copyright (c) 2009, Jeff Mott. All rights reserved.
		* http://code.google.com/p/crypto-js/wiki/License
		*/
		(function () {

			// Shortcuts
			var C = Crypto,
	util = C.util,
	charenc = C.charenc,
	UTF8 = charenc.UTF8,
	Binary = charenc.Binary;

			// Constants
			var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
		  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
		  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
		  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
		  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
		  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
		  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
		  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
		  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
		  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
		  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
		  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
		  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
		  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
		  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
		  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

			// Public API
			var SHA256 = C.SHA256 = function (message, options) {
				var digestbytes = util.wordsToBytes(SHA256._sha256(message));
				return options && options.asBytes ? digestbytes :
		   options && options.asString ? Binary.bytesToString(digestbytes) :
		   util.bytesToHex(digestbytes);
			};

			// The core
			SHA256._sha256 = function (message) {

				// Convert to byte array
				if (message.constructor == String) message = UTF8.stringToBytes(message);
				/* else, assume byte array already */

				var m = util.bytesToWords(message),
		l = message.length * 8,
		H = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
			  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19],
		w = [],
		a, b, c, d, e, f, g, h, i, j,
		t1, t2;

				// Padding
				m[l >> 5] |= 0x80 << (24 - l % 32);
				m[((l + 64 >> 9) << 4) + 15] = l;

				for (var i = 0; i < m.length; i += 16) {

					a = H[0];
					b = H[1];
					c = H[2];
					d = H[3];
					e = H[4];
					f = H[5];
					g = H[6];
					h = H[7];

					for (var j = 0; j < 64; j++) {

						if (j < 16) w[j] = m[j + i];
						else {

							var gamma0x = w[j - 15],
					gamma1x = w[j - 2],
					gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^
							  ((gamma0x << 14) | (gamma0x >>> 18)) ^
							   (gamma0x >>> 3),
					gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^
							  ((gamma1x << 13) | (gamma1x >>> 19)) ^
							   (gamma1x >>> 10);

							w[j] = gamma0 + (w[j - 7] >>> 0) +
					   gamma1 + (w[j - 16] >>> 0);

						}

						var ch = e & f ^ ~e & g,
				maj = a & b ^ a & c ^ b & c,
				sigma0 = ((a << 30) | (a >>> 2)) ^
						 ((a << 19) | (a >>> 13)) ^
						 ((a << 10) | (a >>> 22)),
				sigma1 = ((e << 26) | (e >>> 6)) ^
						 ((e << 21) | (e >>> 11)) ^
						 ((e << 7) | (e >>> 25));


						t1 = (h >>> 0) + sigma1 + ch + (K[j]) + (w[j] >>> 0);
						t2 = sigma0 + maj;

						h = g;
						g = f;
						f = e;
						e = d + t1;
						d = c;
						c = b;
						b = a;
						a = t1 + t2;

					}

					H[0] += a;
					H[1] += b;
					H[2] += c;
					H[3] += d;
					H[4] += e;
					H[5] += f;
					H[6] += g;
					H[7] += h;

				}

				return H;

			};

			// Package private blocksize
			SHA256._blocksize = 16;

		})();






		/*!
		* Crypto-JS v2.0.0
		* http://code.google.com/p/crypto-js/
		* Copyright (c) 2009, Jeff Mott. All rights reserved.
		* http://code.google.com/p/crypto-js/wiki/License
		*
		* A JavaScript implementation of the RIPEMD-160 Algorithm
		* Version 2.2 Copyright Jeremy Lin, Paul Johnston 2000 - 2009.
		* Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
		* Distributed under the BSD License
		* See http://pajhome.org.uk/crypt/md5 for details.
		* Also http://www.ocf.berkeley.edu/~jjlin/jsotp/
		* Ported to Crypto-JS by Stefan Thomas.
		*/

		(function () {
			// Shortcuts
			var C = Crypto,
	util = C.util,
	charenc = C.charenc,
	UTF8 = charenc.UTF8,
	Binary = charenc.Binary;

			// Convert a byte array to little-endian 32-bit words
			util.bytesToLWords = function (bytes) {

				var output = Array(bytes.length >> 2);
				for (var i = 0; i < output.length; i++)
					output[i] = 0;
				for (var i = 0; i < bytes.length * 8; i += 8)
					output[i >> 5] |= (bytes[i / 8] & 0xFF) << (i % 32);
				return output;
			};

			// Convert little-endian 32-bit words to a byte array
			util.lWordsToBytes = function (words) {
				var output = [];
				for (var i = 0; i < words.length * 32; i += 8)
					output.push((words[i >> 5] >>> (i % 32)) & 0xff);
				return output;
			};

			// Public API
			var RIPEMD160 = C.RIPEMD160 = function (message, options) {
				var digestbytes = util.lWordsToBytes(RIPEMD160._rmd160(message));
				return options && options.asBytes ? digestbytes :
			options && options.asString ? Binary.bytesToString(digestbytes) :
			util.bytesToHex(digestbytes);
			};

			// The core
			RIPEMD160._rmd160 = function (message) {
				// Convert to byte array
				if (message.constructor == String) message = UTF8.stringToBytes(message);

				var x = util.bytesToLWords(message),
			len = message.length * 8;

				/* append padding */
				x[len >> 5] |= 0x80 << (len % 32);
				x[(((len + 64) >>> 9) << 4) + 14] = len;

				var h0 = 0x67452301;
				var h1 = 0xefcdab89;
				var h2 = 0x98badcfe;
				var h3 = 0x10325476;
				var h4 = 0xc3d2e1f0;

				for (var i = 0; i < x.length; i += 16) {
					var T;
					var A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
					var A2 = h0, B2 = h1, C2 = h2, D2 = h3, E2 = h4;
					for (var j = 0; j <= 79; ++j) {
						T = safe_add(A1, rmd160_f(j, B1, C1, D1));
						T = safe_add(T, x[i + rmd160_r1[j]]);
						T = safe_add(T, rmd160_K1(j));
						T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
						A1 = E1; E1 = D1; D1 = bit_rol(C1, 10); C1 = B1; B1 = T;
						T = safe_add(A2, rmd160_f(79 - j, B2, C2, D2));
						T = safe_add(T, x[i + rmd160_r2[j]]);
						T = safe_add(T, rmd160_K2(j));
						T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
						A2 = E2; E2 = D2; D2 = bit_rol(C2, 10); C2 = B2; B2 = T;
					}
					T = safe_add(h1, safe_add(C1, D2));
					h1 = safe_add(h2, safe_add(D1, E2));
					h2 = safe_add(h3, safe_add(E1, A2));
					h3 = safe_add(h4, safe_add(A1, B2));
					h4 = safe_add(h0, safe_add(B1, C2));
					h0 = T;
				}
				return [h0, h1, h2, h3, h4];
			}

			function rmd160_f(j, x, y, z) {
				return (0 <= j && j <= 15) ? (x ^ y ^ z) :
			(16 <= j && j <= 31) ? (x & y) | (~x & z) :
			(32 <= j && j <= 47) ? (x | ~y) ^ z :
			(48 <= j && j <= 63) ? (x & z) | (y & ~z) :
			(64 <= j && j <= 79) ? x ^ (y | ~z) :
			"rmd160_f: j out of range";
			}
			function rmd160_K1(j) {
				return (0 <= j && j <= 15) ? 0x00000000 :
			(16 <= j && j <= 31) ? 0x5a827999 :
			(32 <= j && j <= 47) ? 0x6ed9eba1 :
			(48 <= j && j <= 63) ? 0x8f1bbcdc :
			(64 <= j && j <= 79) ? 0xa953fd4e :
			"rmd160_K1: j out of range";
			}
			function rmd160_K2(j) {
				return (0 <= j && j <= 15) ? 0x50a28be6 :
			(16 <= j && j <= 31) ? 0x5c4dd124 :
			(32 <= j && j <= 47) ? 0x6d703ef3 :
			(48 <= j && j <= 63) ? 0x7a6d76e9 :
			(64 <= j && j <= 79) ? 0x00000000 :
			"rmd160_K2: j out of range";
			}
			var rmd160_r1 = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
		7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
		3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
		1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
		4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
	];
			var rmd160_r2 = [
		5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
		6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
		15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
		8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
		12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
	];
			var rmd160_s1 = [
		11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
		7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
		11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
		11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
		9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
	];
			var rmd160_s2 = [
		8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
		9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
		9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
		15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
		8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
	];

			/*
			* Add integers, wrapping at 2^32. This uses 16-bit operations internally
			* to work around bugs in some JS interpreters.
			*/
			function safe_add(x, y) {
				var lsw = (x & 0xFFFF) + (y & 0xFFFF);
				var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
				return (msw << 16) | (lsw & 0xFFFF);
			}

			/*
			* Bitwise rotate a 32-bit number to the left.
			*/
			function bit_rol(num, cnt) {
				return (num << cnt) | (num >>> (32 - cnt));
			}
		})();

	/*!
	* Random number generator with ArcFour PRNG
	* 
	* NOTE: For best results, put code like
	* <body onclick='SecureRandom.seedTime();' onkeypress='SecureRandom.seedTime();'>
	* in your main HTML document.
	* 
	* Copyright Tom Wu, bitaddress.org  BSD License.
	* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
	*/
	(function () {

		// Constructor function of Global SecureRandom object
		var sr = window.SecureRandom = function () { };

		// Properties
		sr.state;
		sr.pool;
		sr.pptr;

		// Pool size must be a multiple of 4 and greater than 32.
		// An array of bytes the size of the pool will be passed to init()
		sr.poolSize = 256;


		// --- object methods ---

		// public method
		// ba: byte array
		sr.prototype.nextBytes = function (ba) {
			var i;
			for (i = 0; i < ba.length; ++i) ba[i] = sr.getByte();
		};


		// --- static methods ---

		// Mix in the current time (w/milliseconds) into the pool
		// NOTE: this method should be called from body click/keypress event handlers to increase entropy
		sr.seedTime = function () {
			sr.seedInt(new Date().getTime());
		}

		sr.getByte = function () {
			if (sr.state == null) {
				sr.seedTime();
				sr.state = sr.ArcFour(); // Plug in your RNG constructor here
				sr.state.init(sr.pool);
				for (sr.pptr = 0; sr.pptr < sr.pool.length; ++sr.pptr)
					sr.pool[sr.pptr] = 0;
				sr.pptr = 0;
			}
			// TODO: allow reseeding after first request
			return sr.state.next();
		}

		// Mix in a 32-bit integer into the pool
		sr.seedInt = function (x) {
			sr.pool[sr.pptr++] ^= x & 255;
			sr.pool[sr.pptr++] ^= (x >> 8) & 255;
			sr.pool[sr.pptr++] ^= (x >> 16) & 255;
			sr.pool[sr.pptr++] ^= (x >> 24) & 255;
			if (sr.pptr >= sr.poolSize) sr.pptr -= sr.poolSize;
		}


		// Arcfour is a PRNG
		sr.ArcFour = function () {
			function Arcfour() {
				this.i = 0;
				this.j = 0;
				this.S = new Array();
			}

			// Initialize arcfour context from key, an array of ints, each from [0..255]
			function ARC4init(key) {
				var i, j, t;
				for (i = 0; i < 256; ++i)
					this.S[i] = i;
				j = 0;
				for (i = 0; i < 256; ++i) {
					j = (j + this.S[i] + key[i % key.length]) & 255;
					t = this.S[i];
					this.S[i] = this.S[j];
					this.S[j] = t;
				}
				this.i = 0;
				this.j = 0;
			}

			function ARC4next() {
				var t;
				this.i = (this.i + 1) & 255;
				this.j = (this.j + this.S[this.i]) & 255;
				t = this.S[this.i];
				this.S[this.i] = this.S[this.j];
				this.S[this.j] = t;
				return this.S[(t + this.S[this.i]) & 255];
			}

			Arcfour.prototype.init = ARC4init;
			Arcfour.prototype.next = ARC4next;

			return new Arcfour();
		};


		// Initialize the pool with junk if needed.
		if (sr.pool == null) {
			sr.pool = new Array();
			sr.pptr = 0;
			var t;
			if (navigator.appName == "Netscape" && navigator.appVersion < "5" && window.crypto) {
				// Extract entropy (256 bits) from NS4 RNG if available
				var z = window.crypto.random(32);
				for (t = 0; t < z.length; ++t)
					sr.pool[sr.pptr++] = z.charCodeAt(t) & 255;
			}
			while (sr.pptr < sr.poolSize) {  // extract some randomness from Math.random()
				t = Math.floor(65536 * Math.random());
				sr.pool[sr.pptr++] = t >>> 8;
				sr.pool[sr.pptr++] = t & 255;
			}
			sr.pptr = 0;
			sr.seedTime();
			// entropy
			sr.seedInt(window.screenX);
			sr.seedInt(window.screenY);
		}
	})();
	
	
	
	

	/*!
	* Basic Javascript Elliptic Curve implementation
	* Ported loosely from BouncyCastle's Java EC code
	* Only Fp curves implemented for now
	* 
	* Copyright Tom Wu, bitaddress.org  BSD License.
	* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
	*/
	(function () {

		// Constructor function of Global EllipticCurve object
		var ec = window.EllipticCurve = function () { };


		// ----------------
		// ECFieldElementFp constructor
		ec.FieldElementFp = function (q, x) {
			this.x = x;
			// TODO if(x.compareTo(q) >= 0) error
			this.q = q;
		}

		ec.FieldElementFp.prototype.equals = function (other) {
			if (other == this) return true;
			return (this.q.equals(other.q) && this.x.equals(other.x));
		};

		ec.FieldElementFp.prototype.toBigInteger = function () {
			return this.x;
		};

		ec.FieldElementFp.prototype.negate = function () {
			return new ec.FieldElementFp(this.q, this.x.negate().mod(this.q));
		};

		ec.FieldElementFp.prototype.add = function (b) {
			return new ec.FieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
		};

		ec.FieldElementFp.prototype.subtract = function (b) {
			return new ec.FieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
		};

		ec.FieldElementFp.prototype.multiply = function (b) {
			return new ec.FieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
		};

		ec.FieldElementFp.prototype.square = function () {
			return new ec.FieldElementFp(this.q, this.x.square().mod(this.q));
		};

		ec.FieldElementFp.prototype.divide = function (b) {
			return new ec.FieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
		};

		ec.FieldElementFp.prototype.getByteLength = function () {
			return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
		};

		// ----------------
		// ECPointFp constructor
		ec.PointFp = function (curve, x, y, z) {
			this.curve = curve;
			this.x = x;
			this.y = y;
			// Projective coordinates: either zinv == null or z * zinv == 1
			// z and zinv are just BigIntegers, not fieldElements
			if (z == null) {
				this.z = BigInteger.ONE;
			}
			else {
				this.z = z;
			}
			this.zinv = null;
			//TODO: compression flag
		};

		ec.PointFp.prototype.getX = function () {
			if (this.zinv == null) {
				this.zinv = this.z.modInverse(this.curve.q);
			}
			return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q));
		};

		ec.PointFp.prototype.getY = function () {
			if (this.zinv == null) {
				this.zinv = this.z.modInverse(this.curve.q);
			}
			return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q));
		};

		ec.PointFp.prototype.equals = function (other) {
			if (other == this) return true;
			if (this.isInfinity()) return other.isInfinity();
			if (other.isInfinity()) return this.isInfinity();
			var u, v;
			// u = Y2 * Z1 - Y1 * Z2
			u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
			if (!u.equals(BigInteger.ZERO)) return false;
			// v = X2 * Z1 - X1 * Z2
			v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
			return v.equals(BigInteger.ZERO);
		};

		ec.PointFp.prototype.isInfinity = function () {
			if ((this.x == null) && (this.y == null)) return true;
			return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
		};

		ec.PointFp.prototype.negate = function () {
			return new ec.PointFp(this.curve, this.x, this.y.negate(), this.z);
		};

		ec.PointFp.prototype.add = function (b) {
			if (this.isInfinity()) return b;
			if (b.isInfinity()) return this;

			// u = Y2 * Z1 - Y1 * Z2
			var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
			// v = X2 * Z1 - X1 * Z2
			var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);


			if (BigInteger.ZERO.equals(v)) {
				if (BigInteger.ZERO.equals(u)) {
					return this.twice(); // this == b, so double
				}
				return this.curve.getInfinity(); // this = -b, so infinity
			}

			var THREE = new BigInteger("3");
			var x1 = this.x.toBigInteger();
			var y1 = this.y.toBigInteger();
			var x2 = b.x.toBigInteger();
			var y2 = b.y.toBigInteger();

			var v2 = v.square();
			var v3 = v2.multiply(v);
			var x1v2 = x1.multiply(v2);
			var zu2 = u.square().multiply(this.z);

			// x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
			var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
			// y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
			var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
			// z3 = v^3 * z1 * z2
			var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

			return new ec.PointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
		};

		ec.PointFp.prototype.twice = function () {
			if (this.isInfinity()) return this;
			if (this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

			// TODO: optimized handling of constants
			var THREE = new BigInteger("3");
			var x1 = this.x.toBigInteger();
			var y1 = this.y.toBigInteger();

			var y1z1 = y1.multiply(this.z);
			var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
			var a = this.curve.a.toBigInteger();

			// w = 3 * x1^2 + a * z1^2
			var w = x1.square().multiply(THREE);
			if (!BigInteger.ZERO.equals(a)) {
				w = w.add(this.z.square().multiply(a));
			}
			w = w.mod(this.curve.q);
			// x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
			var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
			// y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
			var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
			// z3 = 8 * (y1 * z1)^3
			var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

			return new ec.PointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
		};

		// Simple NAF (Non-Adjacent Form) multiplication algorithm
		// TODO: modularize the multiplication algorithm
		ec.PointFp.prototype.multiply = function (k) {
			if (this.isInfinity()) return this;
			if (k.signum() == 0) return this.curve.getInfinity();

			var e = k;
			var h = e.multiply(new BigInteger("3"));

			var neg = this.negate();
			var R = this;

			var i;
			for (i = h.bitLength() - 2; i > 0; --i) {
				R = R.twice();

				var hBit = h.testBit(i);
				var eBit = e.testBit(i);

				if (hBit != eBit) {
					R = R.add(hBit ? this : neg);
				}
			}

			return R;
		};

		// Compute this*j + x*k (simultaneous multiplication)
		ec.PointFp.prototype.multiplyTwo = function (j, x, k) {
			var i;
			if (j.bitLength() > k.bitLength())
				i = j.bitLength() - 1;
			else
				i = k.bitLength() - 1;

			var R = this.curve.getInfinity();
			var both = this.add(x);
			while (i >= 0) {
				R = R.twice();
				if (j.testBit(i)) {
					if (k.testBit(i)) {
						R = R.add(both);
					}
					else {
						R = R.add(this);
					}
				}
				else {
					if (k.testBit(i)) {
						R = R.add(x);
					}
				}
				--i;
			}

			return R;
		};

		// patched by bitaddress.org and Casascius for use with Bitcoin.ECKey
		ec.PointFp.prototype.getEncoded = function () {
			var x = this.getX().toBigInteger();
			var y = this.getY().toBigInteger();
			var len = 32; // integerToBytes will zero pad if integer is less than 32 bytes. 32 bytes length is required by the Bitcoin protocol.
			var enc = ec.integerToBytes(x, len);
			enc.unshift(0x04);
			enc = enc.concat(ec.integerToBytes(y, len));
			return enc;
		};

		ec.PointFp.decodeFrom = function (curve, enc) {
			var type = enc[0];
			var dataLen = enc.length - 1;

			// Extract x and y as byte arrays
			var xBa = enc.slice(1, 1 + dataLen / 2);
			var yBa = enc.slice(1 + dataLen / 2, 1 + dataLen);

			// Prepend zero byte to prevent interpretation as negative integer
			xBa.unshift(0);
			yBa.unshift(0);

			// Convert to BigIntegers
			var x = new BigInteger(xBa);
			var y = new BigInteger(yBa);

			// Return point
			return new ec.PointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
		};

		ec.PointFp.prototype.add2D = function (b) {
			if (this.isInfinity()) return b;
			if (b.isInfinity()) return this;

			if (this.x.equals(b.x)) {
				if (this.y.equals(b.y)) {
					// this = b, i.e. this must be doubled
					return this.twice();
				}
				// this = -b, i.e. the result is the point at infinity
				return this.curve.getInfinity();
			}

			var x_x = b.x.subtract(this.x);
			var y_y = b.y.subtract(this.y);
			var gamma = y_y.divide(x_x);

			var x3 = gamma.square().subtract(this.x).subtract(b.x);
			var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

			return new ec.PointFp(this.curve, x3, y3);
		};

		ec.PointFp.prototype.twice2D = function () {
			if (this.isInfinity()) return this;
			if (this.y.toBigInteger().signum() == 0) {
				// if y1 == 0, then (x1, y1) == (x1, -y1)
				// and hence this = -this and thus 2(x1, y1) == infinity
				return this.curve.getInfinity();
			}

			var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
			var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
			var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

			var x3 = gamma.square().subtract(this.x.multiply(TWO));
			var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

			return new ec.PointFp(this.curve, x3, y3);
		};

		ec.PointFp.prototype.multiply2D = function (k) {
			if (this.isInfinity()) return this;
			if (k.signum() == 0) return this.curve.getInfinity();

			var e = k;
			var h = e.multiply(new BigInteger("3"));

			var neg = this.negate();
			var R = this;

			var i;
			for (i = h.bitLength() - 2; i > 0; --i) {
				R = R.twice();

				var hBit = h.testBit(i);
				var eBit = e.testBit(i);

				if (hBit != eBit) {
					R = R.add2D(hBit ? this : neg);
				}
			}

			return R;
		};

		ec.PointFp.prototype.isOnCurve = function () {
			var x = this.getX().toBigInteger();
			var y = this.getY().toBigInteger();
			var a = this.curve.getA().toBigInteger();
			var b = this.curve.getB().toBigInteger();
			var n = this.curve.getQ();
			var lhs = y.multiply(y).mod(n);
			var rhs = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(n);
			return lhs.equals(rhs);
		};

		ec.PointFp.prototype.validate = function () {
			var n = this.curve.getQ();

			// Check Q != O
			if (this.isInfinity()) {
				throw new Error("Point is at infinity.");
			}

			// Check coordinate bounds
			var x = this.getX().toBigInteger();
			var y = this.getY().toBigInteger();
			if (x.compareTo(BigInteger.ONE) < 0 || x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
				throw new Error('x coordinate out of bounds');
			}
			if (y.compareTo(BigInteger.ONE) < 0 || y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
				throw new Error('y coordinate out of bounds');
			}

			// Check y^2 = x^3 + ax + b (mod n)
			if (!this.isOnCurve()) {
				throw new Error("Point is not on the curve.");
			}

			// Check nQ = 0 (Q is a scalar multiple of G)
			if (this.multiply(n).isInfinity()) {
				// TODO: This check doesn't work - fix.
				throw new Error("Point is not a scalar multiple of G.");
			}

			return true;
		};




		// ----------------
		// ECCurveFp constructor
		ec.CurveFp = function (q, a, b) {
			this.q = q;
			this.a = this.fromBigInteger(a);
			this.b = this.fromBigInteger(b);
			this.infinity = new ec.PointFp(this, null, null);
		}

		ec.CurveFp.prototype.getQ = function () {
			return this.q;
		};

		ec.CurveFp.prototype.getA = function () {
			return this.a;
		};

		ec.CurveFp.prototype.getB = function () {
			return this.b;
		};

		ec.CurveFp.prototype.equals = function (other) {
			if (other == this) return true;
			return (this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
		};

		ec.CurveFp.prototype.getInfinity = function () {
			return this.infinity;
		};

		ec.CurveFp.prototype.fromBigInteger = function (x) {
			return new ec.FieldElementFp(this.q, x);
		};

		// for now, work with hex strings because they're easier in JS
		ec.CurveFp.prototype.decodePointHex = function (s) {
			switch (parseInt(s.substr(0, 2), 16)) { // first byte
				case 0:
					return this.infinity;
				case 2:
				case 3:
					// point compression not supported yet
					return null;
				case 4:
				case 6:
				case 7:
					var len = (s.length - 2) / 2;
					var xHex = s.substr(2, len);
					var yHex = s.substr(len + 2, len);

					return new ec.PointFp(this,
					this.fromBigInteger(new BigInteger(xHex, 16)),
					this.fromBigInteger(new BigInteger(yHex, 16)));

				default: // unsupported
					return null;
			}
		};


		ec.fromHex = function (s) { return new BigInteger(s, 16); };

		ec.integerToBytes = function (i, len) {
			var bytes = i.toByteArrayUnsigned();
			if (len < bytes.length) {
				bytes = bytes.slice(bytes.length - len);
			} else while (len > bytes.length) {
				bytes.unshift(0);
			}
			return bytes;
		};


		// Named EC curves
		// ----------------
		// X9ECParameters constructor
		ec.X9Parameters = function (curve, g, n, h) {
			this.curve = curve;
			this.g = g;
			this.n = n;
			this.h = h;
		}
		ec.X9Parameters.prototype.getCurve = function () { return this.curve; };
		ec.X9Parameters.prototype.getG = function () { return this.g; };
		ec.X9Parameters.prototype.getN = function () { return this.n; };
		ec.X9Parameters.prototype.getH = function () { return this.h; };

		// secp256k1 is the Curve used by Bitcoin
		ec.secNamedCurves = {
			// used by Bitcoin
			"secp256k1": function () {
				// p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
				var p = ec.fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
				var a = BigInteger.ZERO;
				var b = ec.fromHex("7");
				var n = ec.fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
				var h = BigInteger.ONE;
				var curve = new ec.CurveFp(p, a, b);
				var G = curve.decodePointHex("04"
					+ "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
					+ "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
				return new ec.X9Parameters(curve, G, n, h);
			}
		};

		// secp256k1 called by Bitcoin's ECKEY
		ec.getSECCurveByName = function (name) {
			if (ec.secNamedCurves[name] == undefined) return null;
			return ec.secNamedCurves[name]();
		}
	})();

		/*!
		* Basic JavaScript BN library - subset useful for RSA encryption.
		* 
		* Copyright (c) 2005  Tom Wu
		* All Rights Reserved.
		* BSD License
		* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
		*
		* Copyright Stephan Thomas
		* Copyright bitaddress.org
		*/

		(function () {

			// (public) Constructor function of Global BigInteger object
			var BigInteger = window.BigInteger = function BigInteger(a, b, c) {
				if (a != null)
					if ("number" == typeof a) this.fromNumber(a, b, c);
					else if (b == null && "string" != typeof a) this.fromString(a, 256);
					else this.fromString(a, b);
			};

			// Bits per digit
			var dbits;

			// JavaScript engine analysis
			var canary = 0xdeadbeefcafe;
			var j_lm = ((canary & 0xffffff) == 0xefcafe);

			// return new, unset BigInteger
			function nbi() { return new BigInteger(null); }

			// am: Compute w_j += (x*this_i), propagate carries,
			// c is initial carry, returns final carry.
			// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
			// We need to select the fastest one that works in this environment.

			// am1: use a single mult and divide to get the high bits,
			// max digit bits should be 26 because
			// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
			function am1(i, x, w, j, c, n) {
				while (--n >= 0) {
					var v = x * this[i++] + w[j] + c;
					c = Math.floor(v / 0x4000000);
					w[j++] = v & 0x3ffffff;
				}
				return c;
			}
			// am2 avoids a big mult-and-extract completely.
			// Max digit bits should be <= 30 because we do bitwise ops
			// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
			function am2(i, x, w, j, c, n) {
				var xl = x & 0x7fff, xh = x >> 15;
				while (--n >= 0) {
					var l = this[i] & 0x7fff;
					var h = this[i++] >> 15;
					var m = xh * l + h * xl;
					l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
					c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
					w[j++] = l & 0x3fffffff;
				}
				return c;
			}
			// Alternately, set max digit bits to 28 since some
			// browsers slow down when dealing with 32-bit numbers.
			function am3(i, x, w, j, c, n) {
				var xl = x & 0x3fff, xh = x >> 14;
				while (--n >= 0) {
					var l = this[i] & 0x3fff;
					var h = this[i++] >> 14;
					var m = xh * l + h * xl;
					l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
					c = (l >> 28) + (m >> 14) + xh * h;
					w[j++] = l & 0xfffffff;
				}
				return c;
			}
			if (j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
				BigInteger.prototype.am = am2;
				dbits = 30;
			}
			else if (j_lm && (navigator.appName != "Netscape")) {
				BigInteger.prototype.am = am1;
				dbits = 26;
			}
			else { // Mozilla/Netscape seems to prefer am3
				BigInteger.prototype.am = am3;
				dbits = 28;
			}

			BigInteger.prototype.DB = dbits;
			BigInteger.prototype.DM = ((1 << dbits) - 1);
			BigInteger.prototype.DV = (1 << dbits);

			var BI_FP = 52;
			BigInteger.prototype.FV = Math.pow(2, BI_FP);
			BigInteger.prototype.F1 = BI_FP - dbits;
			BigInteger.prototype.F2 = 2 * dbits - BI_FP;

			// Digit conversions
			var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
			var BI_RC = new Array();
			var rr, vv;
			rr = "0".charCodeAt(0);
			for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
			rr = "a".charCodeAt(0);
			for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
			rr = "A".charCodeAt(0);
			for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

			function int2char(n) { return BI_RM.charAt(n); }
			function intAt(s, i) {
				var c = BI_RC[s.charCodeAt(i)];
				return (c == null) ? -1 : c;
			}



			// return bigint initialized to value
			function nbv(i) { var r = nbi(); r.fromInt(i); return r; }


			// returns bit length of the integer x
			function nbits(x) {
				var r = 1, t;
				if ((t = x >>> 16) != 0) { x = t; r += 16; }
				if ((t = x >> 8) != 0) { x = t; r += 8; }
				if ((t = x >> 4) != 0) { x = t; r += 4; }
				if ((t = x >> 2) != 0) { x = t; r += 2; }
				if ((t = x >> 1) != 0) { x = t; r += 1; }
				return r;
			}







			// (protected) copy this to r
			BigInteger.prototype.copyTo = function (r) {
				for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
				r.t = this.t;
				r.s = this.s;
			};


			// (protected) set from integer value x, -DV <= x < DV
			BigInteger.prototype.fromInt = function (x) {
				this.t = 1;
				this.s = (x < 0) ? -1 : 0;
				if (x > 0) this[0] = x;
				else if (x < -1) this[0] = x + DV;
				else this.t = 0;
			};

			// (protected) set from string and radix
			BigInteger.prototype.fromString = function (s, b) {
				var k;
				if (b == 16) k = 4;
				else if (b == 8) k = 3;
				else if (b == 256) k = 8; // byte array
				else if (b == 2) k = 1;
				else if (b == 32) k = 5;
				else if (b == 4) k = 2;
				else { this.fromRadix(s, b); return; }
				this.t = 0;
				this.s = 0;
				var i = s.length, mi = false, sh = 0;
				while (--i >= 0) {
					var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
					if (x < 0) {
						if (s.charAt(i) == "-") mi = true;
						continue;
					}
					mi = false;
					if (sh == 0)
						this[this.t++] = x;
					else if (sh + k > this.DB) {
						this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
						this[this.t++] = (x >> (this.DB - sh));
					}
					else
						this[this.t - 1] |= x << sh;
					sh += k;
					if (sh >= this.DB) sh -= this.DB;
				}
				if (k == 8 && (s[0] & 0x80) != 0) {
					this.s = -1;
					if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
				}
				this.clamp();
				if (mi) BigInteger.ZERO.subTo(this, this);
			};


			// (protected) clamp off excess high words
			BigInteger.prototype.clamp = function () {
				var c = this.s & this.DM;
				while (this.t > 0 && this[this.t - 1] == c) --this.t;
			};

			// (protected) r = this << n*DB
			BigInteger.prototype.dlShiftTo = function (n, r) {
				var i;
				for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
				for (i = n - 1; i >= 0; --i) r[i] = 0;
				r.t = this.t + n;
				r.s = this.s;
			};

			// (protected) r = this >> n*DB
			BigInteger.prototype.drShiftTo = function (n, r) {
				for (var i = n; i < this.t; ++i) r[i - n] = this[i];
				r.t = Math.max(this.t - n, 0);
				r.s = this.s;
			};


			// (protected) r = this << n
			BigInteger.prototype.lShiftTo = function (n, r) {
				var bs = n % this.DB;
				var cbs = this.DB - bs;
				var bm = (1 << cbs) - 1;
				var ds = Math.floor(n / this.DB), c = (this.s << bs) & this.DM, i;
				for (i = this.t - 1; i >= 0; --i) {
					r[i + ds + 1] = (this[i] >> cbs) | c;
					c = (this[i] & bm) << bs;
				}
				for (i = ds - 1; i >= 0; --i) r[i] = 0;
				r[ds] = c;
				r.t = this.t + ds + 1;
				r.s = this.s;
				r.clamp();
			};


			// (protected) r = this >> n
			BigInteger.prototype.rShiftTo = function (n, r) {
				r.s = this.s;
				var ds = Math.floor(n / this.DB);
				if (ds >= this.t) { r.t = 0; return; }
				var bs = n % this.DB;
				var cbs = this.DB - bs;
				var bm = (1 << bs) - 1;
				r[0] = this[ds] >> bs;
				for (var i = ds + 1; i < this.t; ++i) {
					r[i - ds - 1] |= (this[i] & bm) << cbs;
					r[i - ds] = this[i] >> bs;
				}
				if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
				r.t = this.t - ds;
				r.clamp();
			};


			// (protected) r = this - a
			BigInteger.prototype.subTo = function (a, r) {
				var i = 0, c = 0, m = Math.min(a.t, this.t);
				while (i < m) {
					c += this[i] - a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				if (a.t < this.t) {
					c -= a.s;
					while (i < this.t) {
						c += this[i];
						r[i++] = c & this.DM;
						c >>= this.DB;
					}
					c += this.s;
				}
				else {
					c += this.s;
					while (i < a.t) {
						c -= a[i];
						r[i++] = c & this.DM;
						c >>= this.DB;
					}
					c -= a.s;
				}
				r.s = (c < 0) ? -1 : 0;
				if (c < -1) r[i++] = this.DV + c;
				else if (c > 0) r[i++] = c;
				r.t = i;
				r.clamp();
			};


			// (protected) r = this * a, r != this,a (HAC 14.12)
			// "this" should be the larger one if appropriate.
			BigInteger.prototype.multiplyTo = function (a, r) {
				var x = this.abs(), y = a.abs();
				var i = x.t;
				r.t = i + y.t;
				while (--i >= 0) r[i] = 0;
				for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
				r.s = 0;
				r.clamp();
				if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
			};


			// (protected) r = this^2, r != this (HAC 14.16)
			BigInteger.prototype.squareTo = function (r) {
				var x = this.abs();
				var i = r.t = 2 * x.t;
				while (--i >= 0) r[i] = 0;
				for (i = 0; i < x.t - 1; ++i) {
					var c = x.am(i, x[i], r, 2 * i, 0, 1);
					if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
						r[i + x.t] -= x.DV;
						r[i + x.t + 1] = 1;
					}
				}
				if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
				r.s = 0;
				r.clamp();
			};



			// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
			// r != q, this != m.  q or r may be null.
			BigInteger.prototype.divRemTo = function (m, q, r) {
				var pm = m.abs();
				if (pm.t <= 0) return;
				var pt = this.abs();
				if (pt.t < pm.t) {
					if (q != null) q.fromInt(0);
					if (r != null) this.copyTo(r);
					return;
				}
				if (r == null) r = nbi();
				var y = nbi(), ts = this.s, ms = m.s;
				var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
				if (nsh > 0) { pm.lShiftTo(nsh, y); pt.lShiftTo(nsh, r); }
				else { pm.copyTo(y); pt.copyTo(r); }
				var ys = y.t;
				var y0 = y[ys - 1];
				if (y0 == 0) return;
				var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
				var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
				var i = r.t, j = i - ys, t = (q == null) ? nbi() : q;
				y.dlShiftTo(j, t);
				if (r.compareTo(t) >= 0) {
					r[r.t++] = 1;
					r.subTo(t, r);
				}
				BigInteger.ONE.dlShiftTo(ys, t);
				t.subTo(y, y); // "negative" y so we can replace sub with am later
				while (y.t < ys) y[y.t++] = 0;
				while (--j >= 0) {
					// Estimate quotient digit
					var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
					if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {	// Try it out
						y.dlShiftTo(j, t);
						r.subTo(t, r);
						while (r[i] < --qd) r.subTo(t, r);
					}
				}
				if (q != null) {
					r.drShiftTo(ys, q);
					if (ts != ms) BigInteger.ZERO.subTo(q, q);
				}
				r.t = ys;
				r.clamp();
				if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
				if (ts < 0) BigInteger.ZERO.subTo(r, r);
			};


			// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
			// justification:
			//         xy == 1 (mod m)
			//         xy =  1+km
			//   xy(2-xy) = (1+km)(1-km)
			// x[y(2-xy)] = 1-k^2m^2
			// x[y(2-xy)] == 1 (mod m^2)
			// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
			// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
			// JS multiply "overflows" differently from C/C++, so care is needed here.
			BigInteger.prototype.invDigit = function () {
				if (this.t < 1) return 0;
				var x = this[0];
				if ((x & 1) == 0) return 0;
				var y = x & 3; 	// y == 1/x mod 2^2
				y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
				y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
				y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
				// last step - calculate inverse mod DV directly;
				// assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
				y = (y * (2 - x * y % this.DV)) % this.DV; 	// y == 1/x mod 2^dbits
				// we really want the negative inverse, and -DV < y < DV
				return (y > 0) ? this.DV - y : -y;
			};


			// (protected) true iff this is even
			BigInteger.prototype.isEven = function () { return ((this.t > 0) ? (this[0] & 1) : this.s) == 0; };


			// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
			BigInteger.prototype.exp = function (e, z) {
				if (e > 0xffffffff || e < 1) return BigInteger.ONE;
				var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
				g.copyTo(r);
				while (--i >= 0) {
					z.sqrTo(r, r2);
					if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
					else { var t = r; r = r2; r2 = t; }
				}
				return z.revert(r);
			};


			// (public) return string representation in given radix
			BigInteger.prototype.toString = function (b) {
				if (this.s < 0) return "-" + this.negate().toString(b);
				var k;
				if (b == 16) k = 4;
				else if (b == 8) k = 3;
				else if (b == 2) k = 1;
				else if (b == 32) k = 5;
				else if (b == 4) k = 2;
				else return this.toRadix(b);
				var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
				var p = this.DB - (i * this.DB) % k;
				if (i-- > 0) {
					if (p < this.DB && (d = this[i] >> p) > 0) { m = true; r = int2char(d); }
					while (i >= 0) {
						if (p < k) {
							d = (this[i] & ((1 << p) - 1)) << (k - p);
							d |= this[--i] >> (p += this.DB - k);
						}
						else {
							d = (this[i] >> (p -= k)) & km;
							if (p <= 0) { p += this.DB; --i; }
						}
						if (d > 0) m = true;
						if (m) r += int2char(d);
					}
				}
				return m ? r : "0";
			};


			// (public) -this
			BigInteger.prototype.negate = function () { var r = nbi(); BigInteger.ZERO.subTo(this, r); return r; };

			// (public) |this|
			BigInteger.prototype.abs = function () { return (this.s < 0) ? this.negate() : this; };

			// (public) return + if this > a, - if this < a, 0 if equal
			BigInteger.prototype.compareTo = function (a) {
				var r = this.s - a.s;
				if (r != 0) return r;
				var i = this.t;
				r = i - a.t;
				if (r != 0) return r;
				while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
				return 0;
			}

			// (public) return the number of bits in "this"
			BigInteger.prototype.bitLength = function () {
				if (this.t <= 0) return 0;
				return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
			};

			// (public) this mod a
			BigInteger.prototype.mod = function (a) {
				var r = nbi();
				this.abs().divRemTo(a, null, r);
				if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
				return r;
			}

			// (public) this^e % m, 0 <= e < 2^32
			BigInteger.prototype.modPowInt = function (e, m) {
				var z;
				if (e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
				return this.exp(e, z);
			};

			// "constants"
			BigInteger.ZERO = nbv(0);
			BigInteger.ONE = nbv(1);







			// Copyright (c) 2005-2009  Tom Wu
			// All Rights Reserved.
			// See "LICENSE" for details.
			// Extended JavaScript BN functions, required for RSA private ops.
			// Version 1.1: new BigInteger("0", 10) returns "proper" zero
			// Version 1.2: square() API, isProbablePrime fix


			// return index of lowest 1-bit in x, x < 2^31
			function lbit(x) {
				if (x == 0) return -1;
				var r = 0;
				if ((x & 0xffff) == 0) { x >>= 16; r += 16; }
				if ((x & 0xff) == 0) { x >>= 8; r += 8; }
				if ((x & 0xf) == 0) { x >>= 4; r += 4; }
				if ((x & 3) == 0) { x >>= 2; r += 2; }
				if ((x & 1) == 0) ++r;
				return r;
			}

			// return number of 1 bits in x
			function cbit(x) {
				var r = 0;
				while (x != 0) { x &= x - 1; ++r; }
				return r;
			}

			var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
			var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];



			// (protected) return x s.t. r^x < DV
			BigInteger.prototype.chunkSize = function (r) { return Math.floor(Math.LN2 * this.DB / Math.log(r)); };

			// (protected) convert to radix string
			BigInteger.prototype.toRadix = function (b) {
				if (b == null) b = 10;
				if (this.signum() == 0 || b < 2 || b > 36) return "0";
				var cs = this.chunkSize(b);
				var a = Math.pow(b, cs);
				var d = nbv(a), y = nbi(), z = nbi(), r = "";
				this.divRemTo(d, y, z);
				while (y.signum() > 0) {
					r = (a + z.intValue()).toString(b).substr(1) + r;
					y.divRemTo(d, y, z);
				}
				return z.intValue().toString(b) + r;
			};

			// (protected) convert from radix string
			BigInteger.prototype.fromRadix = function (s, b) {
				this.fromInt(0);
				if (b == null) b = 10;
				var cs = this.chunkSize(b);
				var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
				for (var i = 0; i < s.length; ++i) {
					var x = intAt(s, i);
					if (x < 0) {
						if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
						continue;
					}
					w = b * w + x;
					if (++j >= cs) {
						this.dMultiply(d);
						this.dAddOffset(w, 0);
						j = 0;
						w = 0;
					}
				}
				if (j > 0) {
					this.dMultiply(Math.pow(b, j));
					this.dAddOffset(w, 0);
				}
				if (mi) BigInteger.ZERO.subTo(this, this);
			};

			// (protected) alternate constructor
			BigInteger.prototype.fromNumber = function (a, b, c) {
				if ("number" == typeof b) {
					// new BigInteger(int,int,RNG)
					if (a < 2) this.fromInt(1);
					else {
						this.fromNumber(a, c);
						if (!this.testBit(a - 1))	// force MSB set
							this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
						if (this.isEven()) this.dAddOffset(1, 0); // force odd
						while (!this.isProbablePrime(b)) {
							this.dAddOffset(2, 0);
							if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
						}
					}
				}
				else {
					// new BigInteger(int,RNG)
					var x = new Array(), t = a & 7;
					x.length = (a >> 3) + 1;
					b.nextBytes(x);
					if (t > 0) x[0] &= ((1 << t) - 1); else x[0] = 0;
					this.fromString(x, 256);
				}
			};

			// (protected) r = this op a (bitwise)
			BigInteger.prototype.bitwiseTo = function (a, op, r) {
				var i, f, m = Math.min(a.t, this.t);
				for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
				if (a.t < this.t) {
					f = a.s & this.DM;
					for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
					r.t = this.t;
				}
				else {
					f = this.s & this.DM;
					for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
					r.t = a.t;
				}
				r.s = op(this.s, a.s);
				r.clamp();
			};

			// (protected) this op (1<<n)
			BigInteger.prototype.changeBit = function (n, op) {
				var r = BigInteger.ONE.shiftLeft(n);
				this.bitwiseTo(r, op, r);
				return r;
			};

			// (protected) r = this + a
			BigInteger.prototype.addTo = function (a, r) {
				var i = 0, c = 0, m = Math.min(a.t, this.t);
				while (i < m) {
					c += this[i] + a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				if (a.t < this.t) {
					c += a.s;
					while (i < this.t) {
						c += this[i];
						r[i++] = c & this.DM;
						c >>= this.DB;
					}
					c += this.s;
				}
				else {
					c += this.s;
					while (i < a.t) {
						c += a[i];
						r[i++] = c & this.DM;
						c >>= this.DB;
					}
					c += a.s;
				}
				r.s = (c < 0) ? -1 : 0;
				if (c > 0) r[i++] = c;
				else if (c < -1) r[i++] = this.DV + c;
				r.t = i;
				r.clamp();
			};

			// (protected) this *= n, this >= 0, 1 < n < DV
			BigInteger.prototype.dMultiply = function (n) {
				this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
				++this.t;
				this.clamp();
			};

			// (protected) this += n << w words, this >= 0
			BigInteger.prototype.dAddOffset = function (n, w) {
				if (n == 0) return;
				while (this.t <= w) this[this.t++] = 0;
				this[w] += n;
				while (this[w] >= this.DV) {
					this[w] -= this.DV;
					if (++w >= this.t) this[this.t++] = 0;
					++this[w];
				}
			};

			// (protected) r = lower n words of "this * a", a.t <= n
			// "this" should be the larger one if appropriate.
			BigInteger.prototype.multiplyLowerTo = function (a, n, r) {
				var i = Math.min(this.t + a.t, n);
				r.s = 0; // assumes a,this >= 0
				r.t = i;
				while (i > 0) r[--i] = 0;
				var j;
				for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
				for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
				r.clamp();
			};


			// (protected) r = "this * a" without lower n words, n > 0
			// "this" should be the larger one if appropriate.
			BigInteger.prototype.multiplyUpperTo = function (a, n, r) {
				--n;
				var i = r.t = this.t + a.t - n;
				r.s = 0; // assumes a,this >= 0
				while (--i >= 0) r[i] = 0;
				for (i = Math.max(n - this.t, 0); i < a.t; ++i)
					r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
				r.clamp();
				r.drShiftTo(1, r);
			};

			// (protected) this % n, n < 2^26
			BigInteger.prototype.modInt = function (n) {
				if (n <= 0) return 0;
				var d = this.DV % n, r = (this.s < 0) ? n - 1 : 0;
				if (this.t > 0)
					if (d == 0) r = this[0] % n;
					else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
				return r;
			};


			// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
			BigInteger.prototype.millerRabin = function (t) {
				var n1 = this.subtract(BigInteger.ONE);
				var k = n1.getLowestSetBit();
				if (k <= 0) return false;
				var r = n1.shiftRight(k);
				t = (t + 1) >> 1;
				if (t > lowprimes.length) t = lowprimes.length;
				var a = nbi();
				for (var i = 0; i < t; ++i) {
					//Pick bases at random, instead of starting at 2
					a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
					var y = a.modPow(r, this);
					if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
						var j = 1;
						while (j++ < k && y.compareTo(n1) != 0) {
							y = y.modPowInt(2, this);
							if (y.compareTo(BigInteger.ONE) == 0) return false;
						}
						if (y.compareTo(n1) != 0) return false;
					}
				}
				return true;
			};



			// (public)
			BigInteger.prototype.clone = function () { var r = nbi(); this.copyTo(r); return r; };

			// (public) return value as integer
			BigInteger.prototype.intValue = function () {
				if (this.s < 0) {
					if (this.t == 1) return this[0] - this.DV;
					else if (this.t == 0) return -1;
				}
				else if (this.t == 1) return this[0];
				else if (this.t == 0) return 0;
				// assumes 16 < DB < 32
				return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
			};


			// (public) return value as byte
			BigInteger.prototype.byteValue = function () { return (this.t == 0) ? this.s : (this[0] << 24) >> 24; };

			// (public) return value as short (assumes DB>=16)
			BigInteger.prototype.shortValue = function () { return (this.t == 0) ? this.s : (this[0] << 16) >> 16; };

			// (public) 0 if this == 0, 1 if this > 0
			BigInteger.prototype.signum = function () {
				if (this.s < 0) return -1;
				else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
				else return 1;
			};


			// (public) convert to bigendian byte array
			BigInteger.prototype.toByteArray = function () {
				var i = this.t, r = new Array();
				r[0] = this.s;
				var p = this.DB - (i * this.DB) % 8, d, k = 0;
				if (i-- > 0) {
					if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
						r[k++] = d | (this.s << (this.DB - p));
					while (i >= 0) {
						if (p < 8) {
							d = (this[i] & ((1 << p) - 1)) << (8 - p);
							d |= this[--i] >> (p += this.DB - 8);
						}
						else {
							d = (this[i] >> (p -= 8)) & 0xff;
							if (p <= 0) { p += this.DB; --i; }
						}
						if ((d & 0x80) != 0) d |= -256;
						if (k == 0 && (this.s & 0x80) != (d & 0x80)) ++k;
						if (k > 0 || d != this.s) r[k++] = d;
					}
				}
				return r;
			};

			BigInteger.prototype.equals = function (a) { return (this.compareTo(a) == 0); };
			BigInteger.prototype.min = function (a) { return (this.compareTo(a) < 0) ? this : a; };
			BigInteger.prototype.max = function (a) { return (this.compareTo(a) > 0) ? this : a; };

			// (public) this & a
			function op_and(x, y) { return x & y; }
			BigInteger.prototype.and = function (a) { var r = nbi(); this.bitwiseTo(a, op_and, r); return r; };

			// (public) this | a
			function op_or(x, y) { return x | y; }
			BigInteger.prototype.or = function (a) { var r = nbi(); this.bitwiseTo(a, op_or, r); return r; };

			// (public) this ^ a
			function op_xor(x, y) { return x ^ y; }
			BigInteger.prototype.xor = function (a) { var r = nbi(); this.bitwiseTo(a, op_xor, r); return r; };

			// (public) this & ~a
			function op_andnot(x, y) { return x & ~y; }
			BigInteger.prototype.andNot = function (a) { var r = nbi(); this.bitwiseTo(a, op_andnot, r); return r; };

			// (public) ~this
			BigInteger.prototype.not = function () {
				var r = nbi();
				for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
				r.t = this.t;
				r.s = ~this.s;
				return r;
			};

			// (public) this << n
			BigInteger.prototype.shiftLeft = function (n) {
				var r = nbi();
				if (n < 0) this.rShiftTo(-n, r); else this.lShiftTo(n, r);
				return r;
			};

			// (public) this >> n
			BigInteger.prototype.shiftRight = function (n) {
				var r = nbi();
				if (n < 0) this.lShiftTo(-n, r); else this.rShiftTo(n, r);
				return r;
			};

			// (public) returns index of lowest 1-bit (or -1 if none)
			BigInteger.prototype.getLowestSetBit = function () {
				for (var i = 0; i < this.t; ++i)
					if (this[i] != 0) return i * this.DB + lbit(this[i]);
				if (this.s < 0) return this.t * this.DB;
				return -1;
			};

			// (public) return number of set bits
			BigInteger.prototype.bitCount = function () {
				var r = 0, x = this.s & this.DM;
				for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
				return r;
			};

			// (public) true iff nth bit is set
			BigInteger.prototype.testBit = function (n) {
				var j = Math.floor(n / this.DB);
				if (j >= this.t) return (this.s != 0);
				return ((this[j] & (1 << (n % this.DB))) != 0);
			};

			// (public) this | (1<<n)
			BigInteger.prototype.setBit = function (n) { return this.changeBit(n, op_or); };
			// (public) this & ~(1<<n)
			BigInteger.prototype.clearBit = function (n) { return this.changeBit(n, op_andnot); };
			// (public) this ^ (1<<n)
			BigInteger.prototype.flipBit = function (n) { return this.changeBit(n, op_xor); };
			// (public) this + a
			BigInteger.prototype.add = function (a) { var r = nbi(); this.addTo(a, r); return r; };
			// (public) this - a
			BigInteger.prototype.subtract = function (a) { var r = nbi(); this.subTo(a, r); return r; };
			// (public) this * a
			BigInteger.prototype.multiply = function (a) { var r = nbi(); this.multiplyTo(a, r); return r; };
			// (public) this / a
			BigInteger.prototype.divide = function (a) { var r = nbi(); this.divRemTo(a, r, null); return r; };
			// (public) this % a
			BigInteger.prototype.remainder = function (a) { var r = nbi(); this.divRemTo(a, null, r); return r; };
			// (public) [this/a,this%a]
			BigInteger.prototype.divideAndRemainder = function (a) {
				var q = nbi(), r = nbi();
				this.divRemTo(a, q, r);
				return new Array(q, r);
			};

			// (public) this^e % m (HAC 14.85)
			BigInteger.prototype.modPow = function (e, m) {
				var i = e.bitLength(), k, r = nbv(1), z;
				if (i <= 0) return r;
				else if (i < 18) k = 1;
				else if (i < 48) k = 3;
				else if (i < 144) k = 4;
				else if (i < 768) k = 5;
				else k = 6;
				if (i < 8)
					z = new Classic(m);
				else if (m.isEven())
					z = new Barrett(m);
				else
					z = new Montgomery(m);

				// precomputation
				var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
				g[1] = z.convert(this);
				if (k > 1) {
					var g2 = nbi();
					z.sqrTo(g[1], g2);
					while (n <= km) {
						g[n] = nbi();
						z.mulTo(g2, g[n - 2], g[n]);
						n += 2;
					}
				}

				var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
				i = nbits(e[j]) - 1;
				while (j >= 0) {
					if (i >= k1) w = (e[j] >> (i - k1)) & km;
					else {
						w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
						if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
					}

					n = k;
					while ((w & 1) == 0) { w >>= 1; --n; }
					if ((i -= n) < 0) { i += this.DB; --j; }
					if (is1) {	// ret == 1, don't bother squaring or multiplying it
						g[w].copyTo(r);
						is1 = false;
					}
					else {
						while (n > 1) { z.sqrTo(r, r2); z.sqrTo(r2, r); n -= 2; }
						if (n > 0) z.sqrTo(r, r2); else { t = r; r = r2; r2 = t; }
						z.mulTo(r2, g[w], r);
					}

					while (j >= 0 && (e[j] & (1 << i)) == 0) {
						z.sqrTo(r, r2); t = r; r = r2; r2 = t;
						if (--i < 0) { i = this.DB - 1; --j; }
					}
				}
				return z.revert(r);
			};

			// (public) 1/this % m (HAC 14.61)
			BigInteger.prototype.modInverse = function (m) {
				var ac = m.isEven();
				if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
				var u = m.clone(), v = this.clone();
				var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
				while (u.signum() != 0) {
					while (u.isEven()) {
						u.rShiftTo(1, u);
						if (ac) {
							if (!a.isEven() || !b.isEven()) { a.addTo(this, a); b.subTo(m, b); }
							a.rShiftTo(1, a);
						}
						else if (!b.isEven()) b.subTo(m, b);
						b.rShiftTo(1, b);
					}
					while (v.isEven()) {
						v.rShiftTo(1, v);
						if (ac) {
							if (!c.isEven() || !d.isEven()) { c.addTo(this, c); d.subTo(m, d); }
							c.rShiftTo(1, c);
						}
						else if (!d.isEven()) d.subTo(m, d);
						d.rShiftTo(1, d);
					}
					if (u.compareTo(v) >= 0) {
						u.subTo(v, u);
						if (ac) a.subTo(c, a);
						b.subTo(d, b);
					}
					else {
						v.subTo(u, v);
						if (ac) c.subTo(a, c);
						d.subTo(b, d);
					}
				}
				if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
				if (d.compareTo(m) >= 0) return d.subtract(m);
				if (d.signum() < 0) d.addTo(m, d); else return d;
				if (d.signum() < 0) return d.add(m); else return d;
			};


			// (public) this^e
			BigInteger.prototype.pow = function (e) { return this.exp(e, new NullExp()); };

			// (public) gcd(this,a) (HAC 14.54)
			BigInteger.prototype.gcd = function (a) {
				var x = (this.s < 0) ? this.negate() : this.clone();
				var y = (a.s < 0) ? a.negate() : a.clone();
				if (x.compareTo(y) < 0) { var t = x; x = y; y = t; }
				var i = x.getLowestSetBit(), g = y.getLowestSetBit();
				if (g < 0) return x;
				if (i < g) g = i;
				if (g > 0) {
					x.rShiftTo(g, x);
					y.rShiftTo(g, y);
				}
				while (x.signum() > 0) {
					if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
					if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
					if (x.compareTo(y) >= 0) {
						x.subTo(y, x);
						x.rShiftTo(1, x);
					}
					else {
						y.subTo(x, y);
						y.rShiftTo(1, y);
					}
				}
				if (g > 0) y.lShiftTo(g, y);
				return y;
			};

			// (public) test primality with certainty >= 1-.5^t
			BigInteger.prototype.isProbablePrime = function (t) {
				var i, x = this.abs();
				if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
					for (i = 0; i < lowprimes.length; ++i)
						if (x[0] == lowprimes[i]) return true;
					return false;
				}
				if (x.isEven()) return false;
				i = 1;
				while (i < lowprimes.length) {
					var m = lowprimes[i], j = i + 1;
					while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
					m = x.modInt(m);
					while (i < j) if (m % lowprimes[i++] == 0) return false;
				}
				return x.millerRabin(t);
			};


			// JSBN-specific extension

			// (public) this^2
			BigInteger.prototype.square = function () { var r = nbi(); this.squareTo(r); return r; };


			// NOTE: BigInteger interfaces not implemented in jsbn:
			// BigInteger(int signum, byte[] magnitude)
			// double doubleValue()
			// float floatValue()
			// int hashCode()
			// long longValue()
			// static BigInteger valueOf(long val)



			// Copyright Stephan Thomas (start) --- //
			// BigInteger monkey patching
			BigInteger.valueOf = nbv;
			BigInteger.prototype.toByteArrayUnsigned = function () {
				var ba = this.toByteArray();
				if (ba.length) {
					if (ba[0] == 0) {
						ba = ba.slice(1);
					}
					return ba.map(function (v) {
						return (v < 0) ? v + 256 : v;
					});
				} else {
					// Empty array, nothing to do
					return ba;
				}
			};
			BigInteger.fromByteArrayUnsigned = function (ba) {
				if (!ba.length) {
					return ba.valueOf(0);
				} else if (ba[0] & 0x80) {
					// Prepend a zero so the BigInteger class doesn't mistake this
					// for a negative integer.
					return new BigInteger([0].concat(ba));
				} else {
					return new BigInteger(ba);
				}
			};
			// Copyright Stephan Thomas (end) --- //




			// ****** REDUCTION ******* //

			// Modular reduction using "classic" algorithm
			function Classic(m) { this.m = m; }
			Classic.prototype.convert = function (x) {
				if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
				else return x;
			};
			Classic.prototype.revert = function (x) { return x; };
			Classic.prototype.reduce = function (x) { x.divRemTo(this.m, null, x); };
			Classic.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
			Classic.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };





			// Montgomery reduction
			function Montgomery(m) {
				this.m = m;
				this.mp = m.invDigit();
				this.mpl = this.mp & 0x7fff;
				this.mph = this.mp >> 15;
				this.um = (1 << (m.DB - 15)) - 1;
				this.mt2 = 2 * m.t;
			}
			// xR mod m
			Montgomery.prototype.convert = function (x) {
				var r = nbi();
				x.abs().dlShiftTo(this.m.t, r);
				r.divRemTo(this.m, null, r);
				if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
				return r;
			}
			// x/R mod m
			Montgomery.prototype.revert = function (x) {
				var r = nbi();
				x.copyTo(r);
				this.reduce(r);
				return r;
			};
			// x = x/R mod m (HAC 14.32)
			Montgomery.prototype.reduce = function (x) {
				while (x.t <= this.mt2)	// pad x so am has enough room later
					x[x.t++] = 0;
				for (var i = 0; i < this.m.t; ++i) {
					// faster way of calculating u0 = x[i]*mp mod DV
					var j = x[i] & 0x7fff;
					var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
					// use am to combine the multiply-shift-add into one call
					j = i + this.m.t;
					x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
					// propagate carry
					while (x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
				}
				x.clamp();
				x.drShiftTo(this.m.t, x);
				if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
			};
			// r = "xy/R mod m"; x,y != r
			Montgomery.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
			// r = "x^2/R mod m"; x != r
			Montgomery.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };





			// A "null" reducer
			function NullExp() { }
			NullExp.prototype.convert = function (x) { return x; };
			NullExp.prototype.revert = function (x) { return x; };
			NullExp.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); };
			NullExp.prototype.sqrTo = function (x, r) { x.squareTo(r); };





			// Barrett modular reduction
			function Barrett(m) {
				// setup Barrett
				this.r2 = nbi();
				this.q3 = nbi();
				BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
				this.mu = this.r2.divide(m);
				this.m = m;
			}
			Barrett.prototype.convert = function (x) {
				if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
				else if (x.compareTo(this.m) < 0) return x;
				else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
			};
			Barrett.prototype.revert = function (x) { return x; };
			// x = x mod m (HAC 14.42)
			Barrett.prototype.reduce = function (x) {
				x.drShiftTo(this.m.t - 1, this.r2);
				if (x.t > this.m.t + 1) { x.t = this.m.t + 1; x.clamp(); }
				this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
				this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
				while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
				x.subTo(this.r2, x);
				while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
			};
			// r = x*y mod m; x,y != r
			Barrett.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
			// r = x^2 mod m; x != r
			Barrett.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };

		})();

		
		
		
//---------------------------------------------------------------------
	// QRCode for JavaScript
	//
	// Copyright (c) 2009 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//   http://www.opensource.org/licenses/mit-license.php
	//
	// The word "QR Code" is registered trademark of 
	// DENSO WAVE INCORPORATED
	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
	//
	//---------------------------------------------------------------------

	(function () {
		//---------------------------------------------------------------------
		// QRCode
		//---------------------------------------------------------------------

		var QRCode = window.QRCode = function (typeNumber, errorCorrectLevel) {
			this.typeNumber = typeNumber;
			this.errorCorrectLevel = errorCorrectLevel;
			this.modules = null;
			this.moduleCount = 0;
			this.dataCache = null;
			this.dataList = new Array();
		}

		QRCode.prototype = {

			addData: function (data) {
				var newData = new QRCode.QR8bitByte(data);
				this.dataList.push(newData);
				this.dataCache = null;
			},

			isDark: function (row, col) {
				if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
					throw new Error(row + "," + col);
				}
				return this.modules[row][col];
			},

			getModuleCount: function () {
				return this.moduleCount;
			},

			make: function () {
				this.makeImpl(false, this.getBestMaskPattern());
			},

			makeImpl: function (test, maskPattern) {

				this.moduleCount = this.typeNumber * 4 + 17;
				this.modules = new Array(this.moduleCount);

				for (var row = 0; row < this.moduleCount; row++) {

					this.modules[row] = new Array(this.moduleCount);

					for (var col = 0; col < this.moduleCount; col++) {
						this.modules[row][col] = null; //(col + row) % 3;
					}
				}

				this.setupPositionProbePattern(0, 0);
				this.setupPositionProbePattern(this.moduleCount - 7, 0);
				this.setupPositionProbePattern(0, this.moduleCount - 7);
				this.setupPositionAdjustPattern();
				this.setupTimingPattern();
				this.setupTypeInfo(test, maskPattern);

				if (this.typeNumber >= 7) {
					this.setupTypeNumber(test);
				}

				if (this.dataCache == null) {
					this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
				}

				this.mapData(this.dataCache, maskPattern);
			},

			setupPositionProbePattern: function (row, col) {

				for (var r = -1; r <= 7; r++) {

					if (row + r <= -1 || this.moduleCount <= row + r) continue;

					for (var c = -1; c <= 7; c++) {

						if (col + c <= -1 || this.moduleCount <= col + c) continue;

						if ((0 <= r && r <= 6 && (c == 0 || c == 6))
						|| (0 <= c && c <= 6 && (r == 0 || r == 6))
						|| (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			},

			getBestMaskPattern: function () {

				var minLostPoint = 0;
				var pattern = 0;

				for (var i = 0; i < 8; i++) {

					this.makeImpl(true, i);

					var lostPoint = QRCode.Util.getLostPoint(this);

					if (i == 0 || minLostPoint > lostPoint) {
						minLostPoint = lostPoint;
						pattern = i;
					}
				}

				return pattern;
			},

			createMovieClip: function (target_mc, instance_name, depth) {

				var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
				var cs = 1;

				this.make();

				for (var row = 0; row < this.modules.length; row++) {

					var y = row * cs;

					for (var col = 0; col < this.modules[row].length; col++) {

						var x = col * cs;
						var dark = this.modules[row][col];

						if (dark) {
							qr_mc.beginFill(0, 100);
							qr_mc.moveTo(x, y);
							qr_mc.lineTo(x + cs, y);
							qr_mc.lineTo(x + cs, y + cs);
							qr_mc.lineTo(x, y + cs);
							qr_mc.endFill();
						}
					}
				}

				return qr_mc;
			},

			setupTimingPattern: function () {

				for (var r = 8; r < this.moduleCount - 8; r++) {
					if (this.modules[r][6] != null) {
						continue;
					}
					this.modules[r][6] = (r % 2 == 0);
				}

				for (var c = 8; c < this.moduleCount - 8; c++) {
					if (this.modules[6][c] != null) {
						continue;
					}
					this.modules[6][c] = (c % 2 == 0);
				}
			},

			setupPositionAdjustPattern: function () {

				var pos = QRCode.Util.getPatternPosition(this.typeNumber);

				for (var i = 0; i < pos.length; i++) {

					for (var j = 0; j < pos.length; j++) {

						var row = pos[i];
						var col = pos[j];

						if (this.modules[row][col] != null) {
							continue;
						}

						for (var r = -2; r <= 2; r++) {

							for (var c = -2; c <= 2; c++) {

								if (r == -2 || r == 2 || c == -2 || c == 2
								|| (r == 0 && c == 0)) {
									this.modules[row + r][col + c] = true;
								} else {
									this.modules[row + r][col + c] = false;
								}
							}
						}
					}
				}
			},

			setupTypeNumber: function (test) {

				var bits = QRCode.Util.getBCHTypeNumber(this.typeNumber);

				for (var i = 0; i < 18; i++) {
					var mod = (!test && ((bits >> i) & 1) == 1);
					this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
				}

				for (var i = 0; i < 18; i++) {
					var mod = (!test && ((bits >> i) & 1) == 1);
					this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
				}
			},

			setupTypeInfo: function (test, maskPattern) {

				var data = (this.errorCorrectLevel << 3) | maskPattern;
				var bits = QRCode.Util.getBCHTypeInfo(data);

				// vertical		
				for (var i = 0; i < 15; i++) {

					var mod = (!test && ((bits >> i) & 1) == 1);

					if (i < 6) {
						this.modules[i][8] = mod;
					} else if (i < 8) {
						this.modules[i + 1][8] = mod;
					} else {
						this.modules[this.moduleCount - 15 + i][8] = mod;
					}
				}

				// horizontal
				for (var i = 0; i < 15; i++) {

					var mod = (!test && ((bits >> i) & 1) == 1);

					if (i < 8) {
						this.modules[8][this.moduleCount - i - 1] = mod;
					} else if (i < 9) {
						this.modules[8][15 - i - 1 + 1] = mod;
					} else {
						this.modules[8][15 - i - 1] = mod;
					}
				}

				// fixed module
				this.modules[this.moduleCount - 8][8] = (!test);

			},

			mapData: function (data, maskPattern) {

				var inc = -1;
				var row = this.moduleCount - 1;
				var bitIndex = 7;
				var byteIndex = 0;

				for (var col = this.moduleCount - 1; col > 0; col -= 2) {

					if (col == 6) col--;

					while (true) {

						for (var c = 0; c < 2; c++) {

							if (this.modules[row][col - c] == null) {

								var dark = false;

								if (byteIndex < data.length) {
									dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
								}

								var mask = QRCode.Util.getMask(maskPattern, row, col - c);

								if (mask) {
									dark = !dark;
								}

								this.modules[row][col - c] = dark;
								bitIndex--;

								if (bitIndex == -1) {
									byteIndex++;
									bitIndex = 7;
								}
							}
						}

						row += inc;

						if (row < 0 || this.moduleCount <= row) {
							row -= inc;
							inc = -inc;
							break;
						}
					}
				}

			}

		};

		QRCode.PAD0 = 0xEC;
		QRCode.PAD1 = 0x11;

		QRCode.createData = function (typeNumber, errorCorrectLevel, dataList) {

			var rsBlocks = QRCode.RSBlock.getRSBlocks(typeNumber, errorCorrectLevel);

			var buffer = new QRCode.BitBuffer();

			for (var i = 0; i < dataList.length; i++) {
				var data = dataList[i];
				buffer.put(data.mode, 4);
				buffer.put(data.getLength(), QRCode.Util.getLengthInBits(data.mode, typeNumber));
				data.write(buffer);
			}

			// calc num max data.
			var totalDataCount = 0;
			for (var i = 0; i < rsBlocks.length; i++) {
				totalDataCount += rsBlocks[i].dataCount;
			}

			if (buffer.getLengthInBits() > totalDataCount * 8) {
				throw new Error("code length overflow. ("
			+ buffer.getLengthInBits()
			+ ">"
			+ totalDataCount * 8
			+ ")");
			}

			// end code
			if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
				buffer.put(0, 4);
			}

			// padding
			while (buffer.getLengthInBits() % 8 != 0) {
				buffer.putBit(false);
			}

			// padding
			while (true) {

				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(QRCode.PAD0, 8);

				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(QRCode.PAD1, 8);
			}

			return QRCode.createBytes(buffer, rsBlocks);
		};

		QRCode.createBytes = function (buffer, rsBlocks) {

			var offset = 0;

			var maxDcCount = 0;
			var maxEcCount = 0;

			var dcdata = new Array(rsBlocks.length);
			var ecdata = new Array(rsBlocks.length);

			for (var r = 0; r < rsBlocks.length; r++) {

				var dcCount = rsBlocks[r].dataCount;
				var ecCount = rsBlocks[r].totalCount - dcCount;

				maxDcCount = Math.max(maxDcCount, dcCount);
				maxEcCount = Math.max(maxEcCount, ecCount);

				dcdata[r] = new Array(dcCount);

				for (var i = 0; i < dcdata[r].length; i++) {
					dcdata[r][i] = 0xff & buffer.buffer[i + offset];
				}
				offset += dcCount;

				var rsPoly = QRCode.Util.getErrorCorrectPolynomial(ecCount);
				var rawPoly = new QRCode.Polynomial(dcdata[r], rsPoly.getLength() - 1);

				var modPoly = rawPoly.mod(rsPoly);
				ecdata[r] = new Array(rsPoly.getLength() - 1);
				for (var i = 0; i < ecdata[r].length; i++) {
					var modIndex = i + modPoly.getLength() - ecdata[r].length;
					ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
				}

			}

			var totalCodeCount = 0;
			for (var i = 0; i < rsBlocks.length; i++) {
				totalCodeCount += rsBlocks[i].totalCount;
			}

			var data = new Array(totalCodeCount);
			var index = 0;

			for (var i = 0; i < maxDcCount; i++) {
				for (var r = 0; r < rsBlocks.length; r++) {
					if (i < dcdata[r].length) {
						data[index++] = dcdata[r][i];
					}
				}
			}

			for (var i = 0; i < maxEcCount; i++) {
				for (var r = 0; r < rsBlocks.length; r++) {
					if (i < ecdata[r].length) {
						data[index++] = ecdata[r][i];
					}
				}
			}

			return data;

		};

		//---------------------------------------------------------------------
		// QR8bitByte
		//---------------------------------------------------------------------
		QRCode.QR8bitByte = function (data) {
			this.mode = QRCode.Mode.MODE_8BIT_BYTE;
			this.data = data;
		}

		QRCode.QR8bitByte.prototype = {
			getLength: function (buffer) {
				return this.data.length;
			},

			write: function (buffer) {
				for (var i = 0; i < this.data.length; i++) {
					// not JIS ...
					buffer.put(this.data.charCodeAt(i), 8);
				}
			}
		};


		//---------------------------------------------------------------------
		// QRMode
		//---------------------------------------------------------------------
		QRCode.Mode = {
			MODE_NUMBER: 1 << 0,
			MODE_ALPHA_NUM: 1 << 1,
			MODE_8BIT_BYTE: 1 << 2,
			MODE_KANJI: 1 << 3
		};

		//---------------------------------------------------------------------
		// QRErrorCorrectLevel
		//---------------------------------------------------------------------
		QRCode.ErrorCorrectLevel = {
			L: 1,
			M: 0,
			Q: 3,
			H: 2
		};


		//---------------------------------------------------------------------
		// QRMaskPattern
		//---------------------------------------------------------------------
		QRCode.MaskPattern = {
			PATTERN000: 0,
			PATTERN001: 1,
			PATTERN010: 2,
			PATTERN011: 3,
			PATTERN100: 4,
			PATTERN101: 5,
			PATTERN110: 6,
			PATTERN111: 7
		};

		//---------------------------------------------------------------------
		// QRUtil
		//---------------------------------------------------------------------

		QRCode.Util = {

			PATTERN_POSITION_TABLE: [
		[],
		[6, 18],
		[6, 22],
		[6, 26],
		[6, 30],
		[6, 34],
		[6, 22, 38],
		[6, 24, 42],
		[6, 26, 46],
		[6, 28, 50],
		[6, 30, 54],
		[6, 32, 58],
		[6, 34, 62],
		[6, 26, 46, 66],
		[6, 26, 48, 70],
		[6, 26, 50, 74],
		[6, 30, 54, 78],
		[6, 30, 56, 82],
		[6, 30, 58, 86],
		[6, 34, 62, 90],
		[6, 28, 50, 72, 94],
		[6, 26, 50, 74, 98],
		[6, 30, 54, 78, 102],
		[6, 28, 54, 80, 106],
		[6, 32, 58, 84, 110],
		[6, 30, 58, 86, 114],
		[6, 34, 62, 90, 118],
		[6, 26, 50, 74, 98, 122],
		[6, 30, 54, 78, 102, 126],
		[6, 26, 52, 78, 104, 130],
		[6, 30, 56, 82, 108, 134],
		[6, 34, 60, 86, 112, 138],
		[6, 30, 58, 86, 114, 142],
		[6, 34, 62, 90, 118, 146],
		[6, 30, 54, 78, 102, 126, 150],
		[6, 24, 50, 76, 102, 128, 154],
		[6, 28, 54, 80, 106, 132, 158],
		[6, 32, 58, 84, 110, 136, 162],
		[6, 26, 54, 82, 110, 138, 166],
		[6, 30, 58, 86, 114, 142, 170]
	],

			G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
			G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
			G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

			getBCHTypeInfo: function (data) {
				var d = data << 10;
				while (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(QRCode.Util.G15) >= 0) {
					d ^= (QRCode.Util.G15 << (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(QRCode.Util.G15)));
				}
				return ((data << 10) | d) ^ QRCode.Util.G15_MASK;
			},

			getBCHTypeNumber: function (data) {
				var d = data << 12;
				while (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(QRCode.Util.G18) >= 0) {
					d ^= (QRCode.Util.G18 << (QRCode.Util.getBCHDigit(d) - QRCode.Util.getBCHDigit(QRCode.Util.G18)));
				}
				return (data << 12) | d;
			},

			getBCHDigit: function (data) {

				var digit = 0;

				while (data != 0) {
					digit++;
					data >>>= 1;
				}

				return digit;
			},

			getPatternPosition: function (typeNumber) {
				return QRCode.Util.PATTERN_POSITION_TABLE[typeNumber - 1];
			},

			getMask: function (maskPattern, i, j) {

				switch (maskPattern) {

					case QRCode.MaskPattern.PATTERN000: return (i + j) % 2 == 0;
					case QRCode.MaskPattern.PATTERN001: return i % 2 == 0;
					case QRCode.MaskPattern.PATTERN010: return j % 3 == 0;
					case QRCode.MaskPattern.PATTERN011: return (i + j) % 3 == 0;
					case QRCode.MaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
					case QRCode.MaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 == 0;
					case QRCode.MaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
					case QRCode.MaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 == 0;

					default:
						throw new Error("bad maskPattern:" + maskPattern);
				}
			},

			getErrorCorrectPolynomial: function (errorCorrectLength) {

				var a = new QRCode.Polynomial([1], 0);

				for (var i = 0; i < errorCorrectLength; i++) {
					a = a.multiply(new QRCode.Polynomial([1, QRCode.Math.gexp(i)], 0));
				}

				return a;
			},

			getLengthInBits: function (mode, type) {

				if (1 <= type && type < 10) {

					// 1 - 9

					switch (mode) {
						case QRCode.Mode.MODE_NUMBER: return 10;
						case QRCode.Mode.MODE_ALPHA_NUM: return 9;
						case QRCode.Mode.MODE_8BIT_BYTE: return 8;
						case QRCode.Mode.MODE_KANJI: return 8;
						default:
							throw new Error("mode:" + mode);
					}

				} else if (type < 27) {

					// 10 - 26

					switch (mode) {
						case QRCode.Mode.MODE_NUMBER: return 12;
						case QRCode.Mode.MODE_ALPHA_NUM: return 11;
						case QRCode.Mode.MODE_8BIT_BYTE: return 16;
						case QRCode.Mode.MODE_KANJI: return 10;
						default:
							throw new Error("mode:" + mode);
					}

				} else if (type < 41) {

					// 27 - 40

					switch (mode) {
						case QRCode.Mode.MODE_NUMBER: return 14;
						case QRCode.Mode.MODE_ALPHA_NUM: return 13;
						case QRCode.Mode.MODE_8BIT_BYTE: return 16;
						case QRCode.Mode.MODE_KANJI: return 12;
						default:
							throw new Error("mode:" + mode);
					}

				} else {
					throw new Error("type:" + type);
				}
			},

			getLostPoint: function (qrCode) {

				var moduleCount = qrCode.getModuleCount();

				var lostPoint = 0;

				// LEVEL1

				for (var row = 0; row < moduleCount; row++) {

					for (var col = 0; col < moduleCount; col++) {

						var sameCount = 0;
						var dark = qrCode.isDark(row, col);

						for (var r = -1; r <= 1; r++) {

							if (row + r < 0 || moduleCount <= row + r) {
								continue;
							}

							for (var c = -1; c <= 1; c++) {

								if (col + c < 0 || moduleCount <= col + c) {
									continue;
								}

								if (r == 0 && c == 0) {
									continue;
								}

								if (dark == qrCode.isDark(row + r, col + c)) {
									sameCount++;
								}
							}
						}

						if (sameCount > 5) {
							lostPoint += (3 + sameCount - 5);
						}
					}
				}

				// LEVEL2

				for (var row = 0; row < moduleCount - 1; row++) {
					for (var col = 0; col < moduleCount - 1; col++) {
						var count = 0;
						if (qrCode.isDark(row, col)) count++;
						if (qrCode.isDark(row + 1, col)) count++;
						if (qrCode.isDark(row, col + 1)) count++;
						if (qrCode.isDark(row + 1, col + 1)) count++;
						if (count == 0 || count == 4) {
							lostPoint += 3;
						}
					}
				}

				// LEVEL3

				for (var row = 0; row < moduleCount; row++) {
					for (var col = 0; col < moduleCount - 6; col++) {
						if (qrCode.isDark(row, col)
						&& !qrCode.isDark(row, col + 1)
						&& qrCode.isDark(row, col + 2)
						&& qrCode.isDark(row, col + 3)
						&& qrCode.isDark(row, col + 4)
						&& !qrCode.isDark(row, col + 5)
						&& qrCode.isDark(row, col + 6)) {
							lostPoint += 40;
						}
					}
				}

				for (var col = 0; col < moduleCount; col++) {
					for (var row = 0; row < moduleCount - 6; row++) {
						if (qrCode.isDark(row, col)
						&& !qrCode.isDark(row + 1, col)
						&& qrCode.isDark(row + 2, col)
						&& qrCode.isDark(row + 3, col)
						&& qrCode.isDark(row + 4, col)
						&& !qrCode.isDark(row + 5, col)
						&& qrCode.isDark(row + 6, col)) {
							lostPoint += 40;
						}
					}
				}

				// LEVEL4

				var darkCount = 0;

				for (var col = 0; col < moduleCount; col++) {
					for (var row = 0; row < moduleCount; row++) {
						if (qrCode.isDark(row, col)) {
							darkCount++;
						}
					}
				}

				var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
				lostPoint += ratio * 10;

				return lostPoint;
			}

		};


		//---------------------------------------------------------------------
		// QRMath
		//---------------------------------------------------------------------

		QRCode.Math = {

			glog: function (n) {

				if (n < 1) {
					throw new Error("glog(" + n + ")");
				}

				return QRCode.Math.LOG_TABLE[n];
			},

			gexp: function (n) {

				while (n < 0) {
					n += 255;
				}

				while (n >= 256) {
					n -= 255;
				}

				return QRCode.Math.EXP_TABLE[n];
			},

			EXP_TABLE: new Array(256),

			LOG_TABLE: new Array(256)

		};

		for (var i = 0; i < 8; i++) {
			QRCode.Math.EXP_TABLE[i] = 1 << i;
		}
		for (var i = 8; i < 256; i++) {
			QRCode.Math.EXP_TABLE[i] = QRCode.Math.EXP_TABLE[i - 4]
		^ QRCode.Math.EXP_TABLE[i - 5]
		^ QRCode.Math.EXP_TABLE[i - 6]
		^ QRCode.Math.EXP_TABLE[i - 8];
		}
		for (var i = 0; i < 255; i++) {
			QRCode.Math.LOG_TABLE[QRCode.Math.EXP_TABLE[i]] = i;
		}

		//---------------------------------------------------------------------
		// QRPolynomial
		//---------------------------------------------------------------------

		QRCode.Polynomial = function (num, shift) {

			if (num.length == undefined) {
				throw new Error(num.length + "/" + shift);
			}

			var offset = 0;

			while (offset < num.length && num[offset] == 0) {
				offset++;
			}

			this.num = new Array(num.length - offset + shift);
			for (var i = 0; i < num.length - offset; i++) {
				this.num[i] = num[i + offset];
			}
		}

		QRCode.Polynomial.prototype = {

			get: function (index) {
				return this.num[index];
			},

			getLength: function () {
				return this.num.length;
			},

			multiply: function (e) {

				var num = new Array(this.getLength() + e.getLength() - 1);

				for (var i = 0; i < this.getLength(); i++) {
					for (var j = 0; j < e.getLength(); j++) {
						num[i + j] ^= QRCode.Math.gexp(QRCode.Math.glog(this.get(i)) + QRCode.Math.glog(e.get(j)));
					}
				}

				return new QRCode.Polynomial(num, 0);
			},

			mod: function (e) {

				if (this.getLength() - e.getLength() < 0) {
					return this;
				}

				var ratio = QRCode.Math.glog(this.get(0)) - QRCode.Math.glog(e.get(0));

				var num = new Array(this.getLength());

				for (var i = 0; i < this.getLength(); i++) {
					num[i] = this.get(i);
				}

				for (var i = 0; i < e.getLength(); i++) {
					num[i] ^= QRCode.Math.gexp(QRCode.Math.glog(e.get(i)) + ratio);
				}

				// recursive call
				return new QRCode.Polynomial(num, 0).mod(e);
			}
		};

		//---------------------------------------------------------------------
		// QRRSBlock
		//---------------------------------------------------------------------

		QRCode.RSBlock = function (totalCount, dataCount) {
			this.totalCount = totalCount;
			this.dataCount = dataCount;
		}

		QRCode.RSBlock.RS_BLOCK_TABLE = [

		// L
		// M
		// Q
		// H

		// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],

		// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

		// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

		// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],

		// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],

		// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],

		// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],

		// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],

		// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],

		// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16]

];

		QRCode.RSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {

			var rsBlock = QRCode.RSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);

			if (rsBlock == undefined) {
				throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
			}

			var length = rsBlock.length / 3;

			var list = new Array();

			for (var i = 0; i < length; i++) {

				var count = rsBlock[i * 3 + 0];
				var totalCount = rsBlock[i * 3 + 1];
				var dataCount = rsBlock[i * 3 + 2];

				for (var j = 0; j < count; j++) {
					list.push(new QRCode.RSBlock(totalCount, dataCount));
				}
			}

			return list;
		};

		QRCode.RSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {

			switch (errorCorrectLevel) {
				case QRCode.ErrorCorrectLevel.L:
					return QRCode.RSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
				case QRCode.ErrorCorrectLevel.M:
					return QRCode.RSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
				case QRCode.ErrorCorrectLevel.Q:
					return QRCode.RSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
				case QRCode.ErrorCorrectLevel.H:
					return QRCode.RSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
				default:
					return undefined;
			}
		};

		//---------------------------------------------------------------------
		// QRBitBuffer
		//---------------------------------------------------------------------

		QRCode.BitBuffer = function () {
			this.buffer = new Array();
			this.length = 0;
		}

		QRCode.BitBuffer.prototype = {

			get: function (index) {
				var bufIndex = Math.floor(index / 8);
				return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
			},

			put: function (num, length) {
				for (var i = 0; i < length; i++) {
					this.putBit(((num >>> (length - i - 1)) & 1) == 1);
				}
			},

			getLengthInBits: function () {
				return this.length;
			},

			putBit: function (bit) {

				var bufIndex = Math.floor(this.length / 8);
				if (this.buffer.length <= bufIndex) {
					this.buffer.push(0);
				}

				if (bit) {
					this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
				}

				this.length++;
			}
		};
	})();
	
	
	
var Bitcoin = {};

		(function () {
			var B58 = Bitcoin.Base58 = {
				alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
				base: BigInteger.valueOf(58),

				/**
				* Convert a byte array to a base58-encoded string.
				*
				* Written by Mike Hearn for BitcoinJ.
				*   Copyright (c) 2011 Google Inc.
				*
				* Ported to JavaScript by Stefan Thomas.
				*/
				encode: function (input) {
					var bi = BigInteger.fromByteArrayUnsigned(input);
					var chars = [];

					while (bi.compareTo(B58.base) >= 0) {
						var mod = bi.mod(B58.base);
						chars.unshift(B58.alphabet[mod.intValue()]);
						bi = bi.subtract(mod).divide(B58.base);
					}
					chars.unshift(B58.alphabet[bi.intValue()]);

					// Convert leading zeros too.
					for (var i = 0; i < input.length; i++) {
						if (input[i] == 0x00) {
							chars.unshift(B58.alphabet[0]);
						} else break;
					}

					s = chars.join('');
					return s;
				},

				/**
				* Convert a base58-encoded string to a byte array.
				*
				* Written by Mike Hearn for BitcoinJ.
				*   Copyright (c) 2011 Google Inc.
				*
				* Ported to JavaScript by Stefan Thomas.
				*/
				decode: function (input) {
					bi = BigInteger.valueOf(0);
					var leadingZerosNum = 0;
					for (var i = input.length - 1; i >= 0; i--) {
						var alphaIndex = B58.alphabet.indexOf(input[i]);
						bi = bi.add(BigInteger.valueOf(alphaIndex)
						.multiply(B58.base.pow(input.length - 1 - i)));

						// This counts leading zero bytes
						if (input[i] == "1") leadingZerosNum++;
						else leadingZerosNum = 0;
					}
					var bytes = bi.toByteArrayUnsigned();

					// Add leading zeros
					while (leadingZerosNum-- > 0) bytes.unshift(0);

					return bytes;
				}
			};
		})();





		Bitcoin.Address = function (bytes) {
			if ("string" == typeof bytes) {
				bytes = Bitcoin.Address.decodeString(bytes);
			}
			this.hash = bytes;
			this.version = Bitcoin.Address.networkVersion;
		};

		Bitcoin.Address.networkVersion = 0x00; // mainnet

		Bitcoin.Address.prototype.toString = function () {
			// Get a copy of the hash
			var hash = this.hash.slice(0);

			// Version
			hash.unshift(this.version);
			var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });
			var bytes = hash.concat(checksum.slice(0, 4));
			return Bitcoin.Base58.encode(bytes);
		};

		Bitcoin.Address.prototype.getHashBase64 = function () {
			return Crypto.util.bytesToBase64(this.hash);
		};

		Bitcoin.Address.decodeString = function (string) {
			var bytes = Bitcoin.Base58.decode(string);
			var hash = bytes.slice(0, 21);
			var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });

			if (checksum[0] != bytes[21] ||
			checksum[1] != bytes[22] ||
			checksum[2] != bytes[23] ||
			checksum[3] != bytes[24]) {
				throw "Checksum validation failed!";
			}

			var version = hash.shift();

			if (version != 0) {
				throw "Version " + version + " not supported!";
			}

			return hash;
		};









		Bitcoin.ECDSA = (function () {
			var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
			var rng = new SecureRandom();

			function implShamirsTrick(P, k, Q, l) {
				var m = Math.max(k.bitLength(), l.bitLength());
				var Z = P.add2D(Q);
				var R = P.curve.getInfinity();

				for (var i = m - 1; i >= 0; --i) {
					R = R.twice2D();

					R.z = BigInteger.ONE;

					if (k.testBit(i)) {
						if (l.testBit(i)) {
							R = R.add2D(Z);
						} else {
							R = R.add2D(P);
						}
					} else {
						if (l.testBit(i)) {
							R = R.add2D(Q);
						}
					}
				}

				return R;
			};

			var ECDSA = {
				getBigRandom: function (limit) {
					return new BigInteger(limit.bitLength(), rng)
				.mod(limit.subtract(BigInteger.ONE))
				.add(BigInteger.ONE);
				},
				sign: function (hash, priv) {
					var d = priv;
					var n = ecparams.getN();
					var e = BigInteger.fromByteArrayUnsigned(hash);

					do {
						var k = ECDSA.getBigRandom(n);
						var G = ecparams.getG();
						var Q = G.multiply(k);
						var r = Q.getX().toBigInteger().mod(n);
					} while (r.compareTo(BigInteger.ZERO) <= 0);

					var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

					return ECDSA.serializeSig(r, s);
				},

				serializeSig: function (r, s) {
					var rBa = r.toByteArrayUnsigned();
					var sBa = s.toByteArrayUnsigned();

					var sequence = [];
					sequence.push(0x02); // INTEGER
					sequence.push(rBa.length);
					sequence = sequence.concat(rBa);

					sequence.push(0x02); // INTEGER
					sequence.push(sBa.length);
					sequence = sequence.concat(sBa);

					sequence.unshift(sequence.length);
					sequence.unshift(0x30) // SEQUENCE

					return sequence;
				},

				verify: function (hash, sig, pubkey) {
					var obj = ECDSA.parseSig(sig);
					var r = obj.r;
					var s = obj.s;

					var n = ecparams.getN();
					var e = BigInteger.fromByteArrayUnsigned(hash);

					if (r.compareTo(BigInteger.ONE) < 0 ||
				r.compareTo(n) >= 0)
						return false;

					if (s.compareTo(BigInteger.ONE) < 0 ||
				s.compareTo(n) >= 0)
						return false;

					var c = s.modInverse(n);

					var u1 = e.multiply(c).mod(n);
					var u2 = r.multiply(c).mod(n);

					var G = ecparams.getG();
					var Q = ECPointFp.decodeFrom(ecparams.getCurve(), pubkey);

					var point = implShamirsTrick(G, u1, Q, u2);

					var v = point.x.toBigInteger().mod(n);

					return v.equals(r);
				},

				parseSig: function (sig) {
					var cursor;
					if (sig[0] != 0x30)
						throw new Error("Signature not a valid DERSequence");

					cursor = 2;
					if (sig[cursor] != 0x02)
						throw new Error("First element in signature must be a DERInteger"); ;
					var rBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

					cursor += 2 + sig[cursor + 1];
					if (sig[cursor] != 0x02)
						throw new Error("Second element in signature must be a DERInteger");
					var sBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

					cursor += 2 + sig[cursor + 1];

					//if (cursor != sig.length)
					//	throw new Error("Extra bytes in signature");

					var r = BigInteger.fromByteArrayUnsigned(rBa);
					var s = BigInteger.fromByteArrayUnsigned(sBa);

					return { r: r, s: s };
				}
			};

			return ECDSA;
		})();









		Bitcoin.ECKey = (function () {
			var ECDSA = Bitcoin.ECDSA;
			var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
			var rng = new SecureRandom();

			var ECKey = function (input) {
				if (!input) {
					// Generate new key
					var n = ecparams.getN();
					this.priv = ECDSA.getBigRandom(n);
				} else if (input instanceof BigInteger) {
					// Input is a private key value
					this.priv = input;
				} else if (Bitcoin.Util.isArray(input)) {
					// Prepend zero byte to prevent interpretation as negative integer
					this.priv = BigInteger.fromByteArrayUnsigned(input);
				} else if ("string" == typeof input) {
					// Prepend zero byte to prevent interpretation as negative integer
					this.priv = BigInteger.fromByteArrayUnsigned(Crypto.util.base64ToBytes(input));
				}
			};

			ECKey.prototype.getPub = function () {
				if (this.pub) return this.pub;
				this.pub = ecparams.getG().multiply(this.priv).getEncoded();
				return this.pub;
			};

			ECKey.prototype.getPubKeyHash = function () {
				if (this.pubKeyHash) return this.pubKeyHash;
				return this.pubKeyHash = Bitcoin.Util.sha256ripe160(this.getPub());
			};

			ECKey.prototype.getBitcoinAddress = function () {
				var hash = this.getPubKeyHash();
				var addr = new Bitcoin.Address(hash);
				return addr.toString();
			};

			// Sipa Private Key Wallet Import Format (added by bitaddress.org)
			ECKey.prototype.getBitcoinWalletImportFormat = function () {
				// Get a copy of private key as a byte array
				var bytes = this.priv.toByteArrayUnsigned();

				// zero pad if private key is less than 32 bytes (thanks Casascius)
				while (bytes.length < 32) bytes.unshift(0x00);

				bytes.unshift(0x80); // prepend 0x80 byte
				var checksum = Crypto.SHA256(Crypto.SHA256(bytes, { asBytes: true }), { asBytes: true });
				bytes = bytes.concat(checksum.slice(0, 4));

				var privWif = Bitcoin.Base58.encode(bytes);
				return privWif;
			};

			// Private Key Hex Format (added by bitaddress.org) 
			ECKey.prototype.getBitcoinHexFormat = function () {
				// Get a copy of private key as a byte array
				var bytes = this.priv.toByteArrayUnsigned();
				// zero pad if private key is less than 32 bytes 
				while (bytes.length < 32) bytes.unshift(0x00);

				return Crypto.util.bytesToHex(bytes).toString().toUpperCase();
			};


			ECKey.prototype.setPub = function (pub) {
				this.pub = pub;
			};

			ECKey.prototype.toString = function (format) {
				format = format || "";
				if (format === "base64" || format === "b64") {
					return Crypto.util.bytesToBase64(this.priv.toByteArrayUnsigned());
				}
				// Wallet Import Format
				else if (format.toString().toLowerCase() == "wif") {
					return this.getBitcoinWalletImportFormat();
				}
				else {
					return this.getBitcoinHexFormat();
				}
			};

			ECKey.prototype.sign = function (hash) {
				return ECDSA.sign(hash, this.priv);
			};

			ECKey.prototype.verify = function (hash, sig) {
				return ECDSA.verify(hash, sig, this.getPub());
			};

			return ECKey;
		})();






		// Bitcoin utility functions
		Bitcoin.Util = {
			isArray: Array.isArray || function (o) {
				return Object.prototype.toString.call(o) === '[object Array]';
			},
			makeFilledArray: function (len, val) {
				var array = [];
				var i = 0;
				while (i < len) {
					array[i++] = val;
				}
				return array;
			},
			numToVarInt: function (i) {
				// TODO: THIS IS TOTALLY UNTESTED!
				if (i < 0xfd) {
					// unsigned char
					return [i];
				} else if (i <= 1 << 16) {
					// unsigned short (LE)
					return [0xfd, i >>> 8, i & 255];
				} else if (i <= 1 << 32) {
					// unsigned int (LE)
					return [0xfe].concat(Crypto.util.wordsToBytes([i]));
				} else {
					// unsigned long long (LE)
					return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]));
				}
			},
			valueToBigInt: function (valueBuffer) {
				if (valueBuffer instanceof BigInteger) return valueBuffer;

				// Prepend zero byte to prevent interpretation as negative integer
				return BigInteger.fromByteArrayUnsigned(valueBuffer);
			},
			formatValue: function (valueBuffer) {
				var value = this.valueToBigInt(valueBuffer).toString();
				var integerPart = value.length > 8 ? value.substr(0, value.length - 8) : '0';
				var decimalPart = value.length > 8 ? value.substr(value.length - 8) : value;
				while (decimalPart.length < 8) decimalPart = "0" + decimalPart;
				decimalPart = decimalPart.replace(/0*$/, '');
				while (decimalPart.length < 2) decimalPart += "0";
				return integerPart + "." + decimalPart;
			},
			parseValue: function (valueString) {
				var valueComp = valueString.split('.');
				var integralPart = valueComp[0];
				var fractionalPart = valueComp[1] || "0";
				while (fractionalPart.length < 8) fractionalPart += "0";
				fractionalPart = fractionalPart.replace(/^0+/g, '');
				var value = BigInteger.valueOf(parseInt(integralPart));
				value = value.multiply(BigInteger.valueOf(100000000));
				value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
				return value;
			},
			sha256ripe160: function (data) {
				return Crypto.RIPEMD160(Crypto.SHA256(data, { asBytes: true }), { asBytes: true });
			}
		};
		
/*
 * Crypto-JS v2.5.3
 * http://code.google.com/p/crypto-js/
 * (c) 2009-2012 by Jeff Mott. All rights reserved.
 * http://code.google.com/p/crypto-js/wiki/License
 */
(typeof Crypto=="undefined"||!Crypto.util)&&function(){var f=window.Crypto={},k=f.util={rotl:function(b,c){return b<<c|b>>>32-c},rotr:function(b,c){return b<<32-c|b>>>c},endian:function(b){if(b.constructor==Number)return k.rotl(b,8)&16711935|k.rotl(b,24)&4278255360;for(var c=0;c<b.length;c++)b[c]=k.endian(b[c]);return b},randomBytes:function(b){for(var c=[];b>0;b--)c.push(Math.floor(Math.random()*256));return c},bytesToWords:function(b){for(var c=[],a=0,j=0;a<b.length;a++,j+=8)c[j>>>5]|=(b[a]&255)<<
24-j%32;return c},wordsToBytes:function(b){for(var c=[],a=0;a<b.length*32;a+=8)c.push(b[a>>>5]>>>24-a%32&255);return c},bytesToHex:function(b){for(var c=[],a=0;a<b.length;a++)c.push((b[a]>>>4).toString(16)),c.push((b[a]&15).toString(16));return c.join("")},hexToBytes:function(b){for(var c=[],a=0;a<b.length;a+=2)c.push(parseInt(b.substr(a,2),16));return c},bytesToBase64:function(b){if(typeof btoa=="function")return btoa(h.bytesToString(b));for(var c=[],a=0;a<b.length;a+=3)for(var j=b[a]<<16|b[a+1]<<
8|b[a+2],d=0;d<4;d++)a*8+d*6<=b.length*8?c.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(j>>>6*(3-d)&63)):c.push("=");return c.join("")},base64ToBytes:function(b){if(typeof atob=="function")return h.stringToBytes(atob(b));for(var b=b.replace(/[^A-Z0-9+\/]/ig,""),c=[],a=0,j=0;a<b.length;j=++a%4)j!=0&&c.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(b.charAt(a-1))&Math.pow(2,-2*j+8)-1)<<j*2|"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(b.charAt(a))>>>
6-j*2);return c}},f=f.charenc={};f.UTF8={stringToBytes:function(b){return h.stringToBytes(unescape(encodeURIComponent(b)))},bytesToString:function(b){return decodeURIComponent(escape(h.bytesToString(b)))}};var h=f.Binary={stringToBytes:function(b){for(var c=[],a=0;a<b.length;a++)c.push(b.charCodeAt(a)&255);return c},bytesToString:function(b){for(var c=[],a=0;a<b.length;a++)c.push(String.fromCharCode(b[a]));return c.join("")}}}();
(function(){var f=Crypto,k=f.util,h=f.charenc,b=h.UTF8,c=h.Binary,a=f.SHA1=function(b,d){var e=k.wordsToBytes(a._sha1(b));return d&&d.asBytes?e:d&&d.asString?c.bytesToString(e):k.bytesToHex(e)};a._sha1=function(a){a.constructor==String&&(a=b.stringToBytes(a));var d=k.bytesToWords(a),e=a.length*8,a=[],g=1732584193,c=-271733879,f=-1732584194,i=271733878,h=-1009589776;d[e>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+15]=e;for(e=0;e<d.length;e+=16){for(var o=g,q=c,r=f,p=i,u=h,l=0;l<80;l++){if(l<16)a[l]=d[e+l];else{var s=
a[l-3]^a[l-8]^a[l-14]^a[l-16];a[l]=s<<1|s>>>31}s=(g<<5|g>>>27)+h+(a[l]>>>0)+(l<20?(c&f|~c&i)+1518500249:l<40?(c^f^i)+1859775393:l<60?(c&f|c&i|f&i)-1894007588:(c^f^i)-899497514);h=i;i=f;f=c<<30|c>>>2;c=g;g=s}g+=o;c+=q;f+=r;i+=p;h+=u}return[g,c,f,i,h]};a._blocksize=16;a._digestsize=20})();
(function(){var f=Crypto,k=f.util,h=f.charenc,b=h.UTF8,c=h.Binary;f.HMAC=function(a,j,d,e){j.constructor==String&&(j=b.stringToBytes(j));d.constructor==String&&(d=b.stringToBytes(d));d.length>a._blocksize*4&&(d=a(d,{asBytes:!0}));for(var g=d.slice(0),d=d.slice(0),f=0;f<a._blocksize*4;f++)g[f]^=92,d[f]^=54;a=a(g.concat(a(d.concat(j),{asBytes:!0})),{asBytes:!0});return e&&e.asBytes?a:e&&e.asString?c.bytesToString(a):k.bytesToHex(a)}})();
(function(){var f=Crypto,k=f.util,h=f.charenc,b=h.UTF8,c=h.Binary;f.PBKDF2=function(a,j,d,e){function g(a,d){return f.HMAC(m,d,a,{asBytes:!0})}a.constructor==String&&(a=b.stringToBytes(a));j.constructor==String&&(j=b.stringToBytes(j));for(var m=e&&e.hasher||f.SHA1,h=e&&e.iterations||1,i=[],t=1;i.length<d;){for(var o=g(a,j.concat(k.wordsToBytes([t]))),q=o,r=1;r<h;r++)for(var q=g(a,q),p=0;p<o.length;p++)o[p]^=q[p];i=i.concat(o);t++}i.length=d;return e&&e.asBytes?i:e&&e.asString?c.bytesToString(i):k.bytesToHex(i)}})();
(function(f){function k(a,b){var d=a._blocksize*4;return d-b.length%d}var h=f.pad={},b=function(a){for(var b=a.pop(),d=1;d<b;d++)a.pop()};h.NoPadding={pad:function(){},unpad:function(){}};h.ZeroPadding={pad:function(a,b){var d=a._blocksize*4,e=b.length%d;if(e!=0)for(e=d-e;e>0;e--)b.push(0)},unpad:function(){}};h.iso7816={pad:function(a,b){var d=k(a,b);for(b.push(128);d>1;d--)b.push(0)},unpad:function(a){for(;a.pop()!=128;);}};h.ansix923={pad:function(a,b){for(var d=k(a,b),e=1;e<d;e++)b.push(0);b.push(d)},
unpad:b};h.iso10126={pad:function(a,b){for(var d=k(a,b),e=1;e<d;e++)b.push(Math.floor(Math.random()*256));b.push(d)},unpad:b};h.pkcs7={pad:function(a,b){for(var d=k(a,b),e=0;e<d;e++)b.push(d)},unpad:b};var f=f.mode={},c=f.Mode=function(a){if(a)this._padding=a};c.prototype={encrypt:function(a,b,d){this._padding.pad(a,b);this._doEncrypt(a,b,d)},decrypt:function(a,b,d){this._doDecrypt(a,b,d);this._padding.unpad(b)},_padding:h.iso7816};b=(f.ECB=function(){c.apply(this,arguments)}).prototype=new c;b._doEncrypt=
function(a,b){for(var d=a._blocksize*4,e=0;e<b.length;e+=d)a._encryptblock(b,e)};b._doDecrypt=function(a,b){for(var d=a._blocksize*4,e=0;e<b.length;e+=d)a._decryptblock(b,e)};b.fixOptions=function(a){a.iv=[]};b=(f.CBC=function(){c.apply(this,arguments)}).prototype=new c;b._doEncrypt=function(a,b,d){for(var e=a._blocksize*4,g=0;g<b.length;g+=e){if(g==0)for(var c=0;c<e;c++)b[c]^=d[c];else for(c=0;c<e;c++)b[g+c]^=b[g+c-e];a._encryptblock(b,g)}};b._doDecrypt=function(a,b,d){for(var e=a._blocksize*4,g=
0;g<b.length;g+=e){var c=b.slice(g,g+e);a._decryptblock(b,g);for(var f=0;f<e;f++)b[g+f]^=d[f];d=c}};b=(f.CFB=function(){c.apply(this,arguments)}).prototype=new c;b._padding=h.NoPadding;b._doEncrypt=function(a,b,d){for(var e=a._blocksize*4,d=d.slice(0),g=0;g<b.length;g++){var c=g%e;c==0&&a._encryptblock(d,0);b[g]^=d[c];d[c]=b[g]}};b._doDecrypt=function(a,b,d){for(var e=a._blocksize*4,d=d.slice(0),g=0;g<b.length;g++){var c=g%e;c==0&&a._encryptblock(d,0);var f=b[g];b[g]^=d[c];d[c]=f}};b=(f.OFB=function(){c.apply(this,
arguments)}).prototype=new c;b._padding=h.NoPadding;b._doEncrypt=function(a,b,d){for(var e=a._blocksize*4,d=d.slice(0),c=0;c<b.length;c++)c%e==0&&a._encryptblock(d,0),b[c]^=d[c%e]};b._doDecrypt=b._doEncrypt;f=(f.CTR=function(){c.apply(this,arguments)}).prototype=new c;f._padding=h.NoPadding;f._doEncrypt=function(a,b,d){for(var e=a._blocksize*4,d=d.slice(0),c=0;c<b.length;){var f=d.slice(0);a._encryptblock(f,0);for(var h=0;c<b.length&&h<e;h++,c++)b[c]^=f[h];++d[e-1]==256&&(d[e-1]=0,++d[e-2]==256&&
(d[e-2]=0,++d[e-3]==256&&(d[e-3]=0,++d[e-4])))}};f._doDecrypt=f._doEncrypt})(Crypto);
(function(){var f=Crypto,k=f.util,h=f.charenc.UTF8,b;b=function(a){this.keys=Array(16);this._initialiseKeys(a)};b.PC1_offsets=[7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0,7,6,5,4,7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0,3,2,1,0];b.PC1_masks=[128,128,128,128,128,128,128,128,64,64,64,64,64,64,64,64,32,32,32,32,32,32,32,32,16,16,16,16,2,2,2,2,2,2,2,2,4,4,4,4,4,4,4,4,8,8,8,8,8,8,8,8,16,16,16,16];b.PC2_offsets1=[0,3,1,2,0,1,3,2,0,1,0,2,3,0,1,3,0,0,2,3,1,0,2,0,0,2,3,1];b.PC2_offsets2=[7,5,4,
7,5,6,0,7,4,0,6,5,4,7,0,6,5,7,4,5,6,7,5,4,6,0,4,6];b.PC2_masks1=[2,1,32,4,1,4,16,1,0,1,8,8,2,32,8,32,16,0,16,4,2,0,32,4,0,2,8,16];b.PC2_masks2=[2,32,8,1,2,2,0,4,4,0,8,16,32,16,0,32,4,32,2,1,16,8,8,16,1,0,1,4];b.keyShifts=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28];b.prototype._initialiseKeys=function(a){var e,c=Array(56);for(e=0;e<56;e++)c[e]=(a[b.PC1_offsets[e]]&b.PC1_masks[e])!=0;a=c.slice(0,28);c=c.slice(28,56);a=a.concat(a);c=c.concat(c);for(e=0;e<16;e++){for(var f=[0,0,0,0,0,0,0,0],h=b.keyShifts[e],
i=0;i<28;i++)a[i+h]&&(f[b.PC2_offsets1[i]]+=b.PC2_masks1[i]),c[i+h]&&(f[b.PC2_offsets2[i]]+=b.PC2_masks2[i]);f[0]=((f[0]&31)<<27)+((f[0]&32)>>5);for(i=1;i<=6;i++)f[i]<<=27-4*i;f[7]=((f[7]&62)>>1)+((f[7]&1)<<31);this.keys[e]=f}};b.prototype.getKey=function(a){return this.keys[a]};var c;c=function(){this.rhs=this.lhs=0};c.SBOX_MASK=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679];c.SBOX=Array(8);var a=c.SBOX;a[0]=[];a[0][0]=8421888;a[0][268435456]=32768;a[0][536870912]=8421378;a[0][805306368]=
2;a[0][1073741824]=512;a[0][1342177280]=8421890;a[0][1610612736]=8389122;a[0][1879048192]=8388608;a[0][-2147483648]=514;a[0][-1879048192]=8389120;a[0][-1610612736]=33280;a[0][-1342177280]=8421376;a[0][-1073741824]=32770;a[0][-805306368]=8388610;a[0][-536870912]=0;a[0][-268435456]=33282;a[0][134217728]=0;a[0][402653184]=8421890;a[0][671088640]=33282;a[0][939524096]=32768;a[0][1207959552]=8421888;a[0][1476395008]=512;a[0][1744830464]=8421378;a[0][2013265920]=2;a[0][-2013265920]=8389120;a[0][-1744830464]=
33280;a[0][-1476395008]=8421376;a[0][-1207959552]=8389122;a[0][-939524096]=8388610;a[0][-671088640]=32770;a[0][-402653184]=514;a[0][-134217728]=8388608;a[0][1]=32768;a[0][268435457]=2;a[0][536870913]=8421888;a[0][805306369]=8388608;a[0][1073741825]=8421378;a[0][1342177281]=33280;a[0][1610612737]=512;a[0][1879048193]=8389122;a[0][-2147483647]=8421890;a[0][-1879048191]=8421376;a[0][-1610612735]=8388610;a[0][-1342177279]=33282;a[0][-1073741823]=514;a[0][-805306367]=8389120;a[0][-536870911]=32770;a[0][-268435455]=
0;a[0][134217729]=8421890;a[0][402653185]=8421376;a[0][671088641]=8388608;a[0][939524097]=512;a[0][1207959553]=32768;a[0][1476395009]=8388610;a[0][1744830465]=2;a[0][2013265921]=33282;a[0][-2013265919]=32770;a[0][-1744830463]=8389122;a[0][-1476395007]=514;a[0][-1207959551]=8421888;a[0][-939524095]=8389120;a[0][-671088639]=0;a[0][-402653183]=33280;a[0][-134217727]=8421378;a[1]=[];a[1][0]=1074282512;a[1][16777216]=16384;a[1][33554432]=524288;a[1][50331648]=1074266128;a[1][67108864]=1073741840;a[1][83886080]=
1074282496;a[1][100663296]=1073758208;a[1][117440512]=16;a[1][134217728]=540672;a[1][150994944]=1073758224;a[1][167772160]=1073741824;a[1][184549376]=540688;a[1][201326592]=524304;a[1][218103808]=0;a[1][234881024]=16400;a[1][251658240]=1074266112;a[1][8388608]=1073758208;a[1][25165824]=540688;a[1][41943040]=16;a[1][58720256]=1073758224;a[1][75497472]=1074282512;a[1][92274688]=1073741824;a[1][109051904]=524288;a[1][125829120]=1074266128;a[1][142606336]=524304;a[1][159383552]=0;a[1][176160768]=16384;
a[1][192937984]=1074266112;a[1][209715200]=1073741840;a[1][226492416]=540672;a[1][243269632]=1074282496;a[1][260046848]=16400;a[1][268435456]=0;a[1][285212672]=1074266128;a[1][301989888]=1073758224;a[1][318767104]=1074282496;a[1][335544320]=1074266112;a[1][352321536]=16;a[1][369098752]=540688;a[1][385875968]=16384;a[1][402653184]=16400;a[1][419430400]=524288;a[1][436207616]=524304;a[1][452984832]=1073741840;a[1][469762048]=540672;a[1][486539264]=1073758208;a[1][503316480]=1073741824;a[1][520093696]=
1074282512;a[1][276824064]=540688;a[1][293601280]=524288;a[1][310378496]=1074266112;a[1][327155712]=16384;a[1][343932928]=1073758208;a[1][360710144]=1074282512;a[1][377487360]=16;a[1][394264576]=1073741824;a[1][411041792]=1074282496;a[1][427819008]=1073741840;a[1][444596224]=1073758224;a[1][461373440]=524304;a[1][478150656]=0;a[1][494927872]=16400;a[1][511705088]=1074266128;a[1][528482304]=540672;a[2]=[];a[2][0]=260;a[2][1048576]=0;a[2][2097152]=67109120;a[2][3145728]=65796;a[2][4194304]=65540;a[2][5242880]=
67108868;a[2][6291456]=67174660;a[2][7340032]=67174400;a[2][8388608]=67108864;a[2][9437184]=67174656;a[2][10485760]=65792;a[2][11534336]=67174404;a[2][12582912]=67109124;a[2][13631488]=65536;a[2][14680064]=4;a[2][15728640]=256;a[2][524288]=67174656;a[2][1572864]=67174404;a[2][2621440]=0;a[2][3670016]=67109120;a[2][4718592]=67108868;a[2][5767168]=65536;a[2][6815744]=65540;a[2][7864320]=260;a[2][8912896]=4;a[2][9961472]=256;a[2][11010048]=67174400;a[2][12058624]=65796;a[2][13107200]=65792;a[2][14155776]=
67109124;a[2][15204352]=67174660;a[2][16252928]=67108864;a[2][16777216]=67174656;a[2][17825792]=65540;a[2][18874368]=65536;a[2][19922944]=67109120;a[2][20971520]=256;a[2][22020096]=67174660;a[2][23068672]=67108868;a[2][24117248]=0;a[2][25165824]=67109124;a[2][26214400]=67108864;a[2][27262976]=4;a[2][28311552]=65792;a[2][29360128]=67174400;a[2][30408704]=260;a[2][31457280]=65796;a[2][32505856]=67174404;a[2][17301504]=67108864;a[2][18350080]=260;a[2][19398656]=67174656;a[2][20447232]=0;a[2][21495808]=
65540;a[2][22544384]=67109120;a[2][23592960]=256;a[2][24641536]=67174404;a[2][25690112]=65536;a[2][26738688]=67174660;a[2][27787264]=65796;a[2][28835840]=67108868;a[2][29884416]=67109124;a[2][30932992]=67174400;a[2][31981568]=4;a[2][33030144]=65792;a[3]=[];a[3][0]=2151682048;a[3][65536]=2147487808;a[3][131072]=4198464;a[3][196608]=2151677952;a[3][262144]=0;a[3][327680]=4198400;a[3][393216]=2147483712;a[3][458752]=4194368;a[3][524288]=2147483648;a[3][589824]=4194304;a[3][655360]=64;a[3][720896]=2147487744;
a[3][786432]=2151678016;a[3][851968]=4160;a[3][917504]=4096;a[3][983040]=2151682112;a[3][32768]=2147487808;a[3][98304]=64;a[3][163840]=2151678016;a[3][229376]=2147487744;a[3][294912]=4198400;a[3][360448]=2151682112;a[3][425984]=0;a[3][491520]=2151677952;a[3][557056]=4096;a[3][622592]=2151682048;a[3][688128]=4194304;a[3][753664]=4160;a[3][819200]=2147483648;a[3][884736]=4194368;a[3][950272]=4198464;a[3][1015808]=2147483712;a[3][1048576]=4194368;a[3][1114112]=4198400;a[3][1179648]=2147483712;a[3][1245184]=
0;a[3][1310720]=4160;a[3][1376256]=2151678016;a[3][1441792]=2151682048;a[3][1507328]=2147487808;a[3][1572864]=2151682112;a[3][1638400]=2147483648;a[3][1703936]=2151677952;a[3][1769472]=4198464;a[3][1835008]=2147487744;a[3][1900544]=4194304;a[3][1966080]=64;a[3][2031616]=4096;a[3][1081344]=2151677952;a[3][1146880]=2151682112;a[3][1212416]=0;a[3][1277952]=4198400;a[3][1343488]=4194368;a[3][1409024]=2147483648;a[3][1474560]=2147487808;a[3][1540096]=64;a[3][1605632]=2147483712;a[3][1671168]=4096;a[3][1736704]=
2147487744;a[3][1802240]=2151678016;a[3][1867776]=4160;a[3][1933312]=2151682048;a[3][1998848]=4194304;a[3][2064384]=4198464;a[4]=[];a[4][0]=128;a[4][4096]=17039360;a[4][8192]=262144;a[4][12288]=536870912;a[4][16384]=537133184;a[4][20480]=16777344;a[4][24576]=553648256;a[4][28672]=262272;a[4][32768]=16777216;a[4][36864]=537133056;a[4][40960]=536871040;a[4][45056]=553910400;a[4][49152]=553910272;a[4][53248]=0;a[4][57344]=17039488;a[4][61440]=553648128;a[4][2048]=17039488;a[4][6144]=553648256;a[4][10240]=
128;a[4][14336]=17039360;a[4][18432]=262144;a[4][22528]=537133184;a[4][26624]=553910272;a[4][30720]=536870912;a[4][34816]=537133056;a[4][38912]=0;a[4][43008]=553910400;a[4][47104]=16777344;a[4][51200]=536871040;a[4][55296]=553648128;a[4][59392]=16777216;a[4][63488]=262272;a[4][65536]=262144;a[4][69632]=128;a[4][73728]=536870912;a[4][77824]=553648256;a[4][81920]=16777344;a[4][86016]=553910272;a[4][90112]=537133184;a[4][94208]=16777216;a[4][98304]=553910400;a[4][102400]=553648128;a[4][106496]=17039360;
a[4][110592]=537133056;a[4][114688]=262272;a[4][118784]=536871040;a[4][122880]=0;a[4][126976]=17039488;a[4][67584]=553648256;a[4][71680]=16777216;a[4][75776]=17039360;a[4][79872]=537133184;a[4][83968]=536870912;a[4][88064]=17039488;a[4][92160]=128;a[4][96256]=553910272;a[4][100352]=262272;a[4][104448]=553910400;a[4][108544]=0;a[4][112640]=553648128;a[4][116736]=16777344;a[4][120832]=262144;a[4][124928]=537133056;a[4][129024]=536871040;a[5]=[];a[5][0]=268435464;a[5][256]=8192;a[5][512]=270532608;a[5][768]=
270540808;a[5][1024]=268443648;a[5][1280]=2097152;a[5][1536]=2097160;a[5][1792]=268435456;a[5][2048]=0;a[5][2304]=268443656;a[5][2560]=2105344;a[5][2816]=8;a[5][3072]=270532616;a[5][3328]=2105352;a[5][3584]=8200;a[5][3840]=270540800;a[5][128]=270532608;a[5][384]=270540808;a[5][640]=8;a[5][896]=2097152;a[5][1152]=2105352;a[5][1408]=268435464;a[5][1664]=268443648;a[5][1920]=8200;a[5][2176]=2097160;a[5][2432]=8192;a[5][2688]=268443656;a[5][2944]=270532616;a[5][3200]=0;a[5][3456]=270540800;a[5][3712]=
2105344;a[5][3968]=268435456;a[5][4096]=268443648;a[5][4352]=270532616;a[5][4608]=270540808;a[5][4864]=8200;a[5][5120]=2097152;a[5][5376]=268435456;a[5][5632]=268435464;a[5][5888]=2105344;a[5][6144]=2105352;a[5][6400]=0;a[5][6656]=8;a[5][6912]=270532608;a[5][7168]=8192;a[5][7424]=268443656;a[5][7680]=270540800;a[5][7936]=2097160;a[5][4224]=8;a[5][4480]=2105344;a[5][4736]=2097152;a[5][4992]=268435464;a[5][5248]=268443648;a[5][5504]=8200;a[5][5760]=270540808;a[5][6016]=270532608;a[5][6272]=270540800;
a[5][6528]=270532616;a[5][6784]=8192;a[5][7040]=2105352;a[5][7296]=2097160;a[5][7552]=0;a[5][7808]=268435456;a[5][8064]=268443656;a[6]=[];a[6][0]=1048576;a[6][16]=33555457;a[6][32]=1024;a[6][48]=1049601;a[6][64]=34604033;a[6][80]=0;a[6][96]=1;a[6][112]=34603009;a[6][128]=33555456;a[6][144]=1048577;a[6][160]=33554433;a[6][176]=34604032;a[6][192]=34603008;a[6][208]=1025;a[6][224]=1049600;a[6][240]=33554432;a[6][8]=34603009;a[6][24]=0;a[6][40]=33555457;a[6][56]=34604032;a[6][72]=1048576;a[6][88]=33554433;
a[6][104]=33554432;a[6][120]=1025;a[6][136]=1049601;a[6][152]=33555456;a[6][168]=34603008;a[6][184]=1048577;a[6][200]=1024;a[6][216]=34604033;a[6][232]=1;a[6][248]=1049600;a[6][256]=33554432;a[6][272]=1048576;a[6][288]=33555457;a[6][304]=34603009;a[6][320]=1048577;a[6][336]=33555456;a[6][352]=34604032;a[6][368]=1049601;a[6][384]=1025;a[6][400]=34604033;a[6][416]=1049600;a[6][432]=1;a[6][448]=0;a[6][464]=34603008;a[6][480]=33554433;a[6][496]=1024;a[6][264]=1049600;a[6][280]=33555457;a[6][296]=34603009;
a[6][312]=1;a[6][328]=33554432;a[6][344]=1048576;a[6][360]=1025;a[6][376]=34604032;a[6][392]=33554433;a[6][408]=34603008;a[6][424]=0;a[6][440]=34604033;a[6][456]=1049601;a[6][472]=1024;a[6][488]=33555456;a[6][504]=1048577;a[7]=[];a[7][0]=134219808;a[7][1]=131072;a[7][2]=134217728;a[7][3]=32;a[7][4]=131104;a[7][5]=134350880;a[7][6]=134350848;a[7][7]=2048;a[7][8]=134348800;a[7][9]=134219776;a[7][10]=133120;a[7][11]=134348832;a[7][12]=2080;a[7][13]=0;a[7][14]=134217760;a[7][15]=133152;a[7][-2147483648]=
2048;a[7][-2147483647]=134350880;a[7][-2147483646]=134219808;a[7][-2147483645]=134217728;a[7][-2147483644]=134348800;a[7][-2147483643]=133120;a[7][-2147483642]=133152;a[7][-2147483641]=32;a[7][-2147483640]=134217760;a[7][-2147483639]=2080;a[7][-2147483638]=131104;a[7][-2147483637]=134350848;a[7][-2147483636]=0;a[7][-2147483635]=134348832;a[7][-2147483634]=134219776;a[7][-2147483633]=131072;a[7][16]=133152;a[7][17]=134350848;a[7][18]=32;a[7][19]=2048;a[7][20]=134219776;a[7][21]=134217760;a[7][22]=
134348832;a[7][23]=131072;a[7][24]=0;a[7][25]=131104;a[7][26]=134348800;a[7][27]=134219808;a[7][28]=134350880;a[7][29]=133120;a[7][30]=2080;a[7][31]=134217728;a[7][-2147483632]=131072;a[7][-2147483631]=2048;a[7][-2147483630]=134348832;a[7][-2147483629]=133152;a[7][-2147483628]=32;a[7][-2147483627]=134348800;a[7][-2147483626]=134217728;a[7][-2147483625]=134219808;a[7][-2147483624]=134350880;a[7][-2147483623]=134217760;a[7][-2147483622]=134219776;a[7][-2147483621]=0;a[7][-2147483620]=133120;a[7][-2147483619]=
2080;a[7][-2147483618]=131104;a[7][-2147483617]=134350848;c.prototype._exchangeLR=function(a,b){var c=(this.lhs>>a^this.rhs)&b;this.rhs^=c;this.lhs^=c<<a};c.prototype._exchangeRL=function(a,b){var c=(this.rhs>>a^this.lhs)&b;this.lhs^=c;this.rhs^=c<<a};c.prototype.initialPerm=function(a,b){var c=a.slice(b,b+8);this.lhs=(c[0]<<24)+(c[1]<<16)+(c[2]<<8)+c[3];this.rhs=(c[4]<<24)+(c[5]<<16)+(c[6]<<8)+c[7];this._exchangeLR(4,252645135);this._exchangeLR(16,65535);this._exchangeRL(2,858993459);this._exchangeRL(8,
16711935);this._exchangeLR(1,1431655765)};c.prototype.round=function(a){for(var b=this.rhs,f=this.lhs,h=0,j=0;j<8;j++)h+=c.SBOX[j][(b^a[j])&c.SBOX_MASK[j]];this.lhs=b;this.rhs=f^h};c.prototype.finalPerm=function(a,b){var c=this.lhs;this.lhs=this.rhs;this.rhs=c;this._exchangeLR(1,1431655765);this._exchangeRL(8,16711935);this._exchangeRL(2,858993459);this._exchangeLR(16,65535);this._exchangeLR(4,252645135);a[b]=this.lhs>>24&255;a[b+1]=this.lhs>>16&255;a[b+2]=this.lhs>>8&255;a[b+3]=this.lhs&255;a[b+
4]=this.rhs>>24&255;a[b+5]=this.rhs>>16&255;a[b+6]=this.rhs>>8&255;a[b+7]=this.rhs&255};var j=f.DES={_blocksize:2,_keyschedule:null,_state:new c,_init:function(a){this._keyschedule=new b(a)},encrypt:function(a,c,g){var g=g||{},m=g.mode||new f.mode.OFB;m.fixOptions&&m.fixOptions(g);var a=a.constructor==String?h.stringToBytes(a):a,n=g.iv||k.randomBytes(8),c=c.constructor==String?f.PBKDF2(c,n,8,{asBytes:!0}):c;this._keyschedule=new b(c);m.encrypt(j,a,n);a=g.iv?a:n.concat(a);return g&&g.asBytes?a:k.bytesToBase64(a)},
_encryptblock:function(a,b){this._state.initialPerm(a,b);for(var c=0;c<=15;c++)this._state.round(this._keyschedule.getKey(c));this._state.finalPerm(a,b)},decrypt:function(a,c,g){var g=g||{},m=g.mode||new f.mode.OFB;m.fixOptions&&m.fixOptions(g);var a=a.constructor==String?k.base64ToBytes(a):a,n=g.iv||a.splice(0,8),c=c.constructor==String?f.PBKDF2(c,n,32,{asBytes:!0}):c;this._keyschedule=new b(c);m.decrypt(j,a,n);return g&&g.asBytes?a:h.bytesToString(a)},_decryptblock:function(a,b){this._state.initialPerm(a,
b);for(var c=15;c>=0;c--)this._state.round(this._keyschedule.getKey(c));this._state.finalPerm(a,b)}}})();
