"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getbalance = exports.Output = exports.OutputList = exports.InputList = exports.Transaction = exports.Block = exports.validateblock = exports.makeBlock = exports.MyTransactionlist = exports.MyWallet = void 0;
//import * as CryptoJS from 'crypto-js';
var node_forge_1 = __importDefault(require("node-forge"));
// Generate a key pair
var keyPair = node_forge_1.default.pki.rsa.generateKeyPair({ bits: 2048 });
// Convert the keys to PEM format
var PUBLIC_KEY = node_forge_1.default.pki.publicKeyToPem(keyPair.publicKey);
var PRIVATE_KEY = node_forge_1.default.pki.privateKeyToPem(keyPair.privateKey);
console.log('Public Key:', PUBLIC_KEY);
console.log('Private Key:', PRIVATE_KEY);
// Create a transaction pool to store the unspent tranactions hash , their output index and their block index and transactiion index
var Overalldifficulty = 4;
var tranactionPerBlock = 1;
var TransactionPool = /** @class */ (function () {
    function TransactionPool() {
        this.transactionPool = new Map();
    }
    TransactionPool.prototype.addNewTransaction = function (transaction) {
        // Iterate over outputs and add them to the transaction pool
        for (var i = 0; i < transaction.Outputs.outputList.length; i++) {
            this.addTransaction(transaction.hash, i, 0, 0);
        }
        this.transactionPool.set([transaction.hash, 0], [0, 0]);
    };
    TransactionPool.prototype.addTransaction = function (transactionHash, outputIndex, blockIndex, transactionIndex) {
        this.transactionPool.set([transactionHash, outputIndex], [blockIndex, transactionIndex]);
    };
    TransactionPool.prototype.removeTransaction = function (transactionHash, outputIndex) {
        var e_1, _a;
        try {
            for (var _b = __values(this.transactionPool.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                var _e = __read(key, 2), transactionHashed = _e[0], outputIndexed = _e[1];
                if (transactionHash === transactionHashed && outputIndex === outputIndexed) {
                    var x = this.transactionPool.delete(key);
                    console.log(x);
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // let x : boolean =  this.transactionPool.delete([transactionHash, outputIndex]);
        // console.log(x);
    };
    TransactionPool.prototype.toString = function () {
        var result = "TransactionPool {\n";
        this.transactionPool.forEach(function (value, key) {
            var keyStr = JSON.stringify(Array.from(key));
            var valueStr = JSON.stringify(Array.from(value));
            result += "  " + keyStr + " => " + valueStr + "\n";
        });
        result += "}";
        return result;
    };
    return TransactionPool;
}());
// Transfer of funds between two wallets
var Input = /** @class */ (function () {
    function Input(transactionHash, outputIndex) {
        this.transactionHash = transactionHash;
        this.outputIndex = outputIndex;
    }
    return Input;
}());
var Output = /** @class */ (function () {
    function Output(receiverPublicKey, amount) {
        this.receiverPublicKey = receiverPublicKey;
        this.amount = amount;
    }
    return Output;
}());
exports.Output = Output;
var OutputList = /** @class */ (function () {
    // Constructor
    function OutputList() {
        this.outputList = [];
    }
    return OutputList;
}());
exports.OutputList = OutputList;
var InputList = /** @class */ (function () {
    // Constructor
    function InputList() {
        this.inputList = [];
    }
    InputList.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return InputList;
}());
exports.InputList = InputList;
var Transaction = /** @class */ (function () {
    function Transaction(Inputs, Outputs) {
        this.Inputs = Inputs;
        this.Outputs = Outputs;
        // sign the inputs and output by converting to string and signing with the private key of the sender
        this.signature = this.calculateSignature();
        this.hash = this.calculateHash();
    }
    Transaction.prototype.calculateSignature = function () {
        // Convert Inputs and Outputs to strings
        var inputStr = JSON.stringify(this.Inputs);
        var outputStr = JSON.stringify(this.Outputs);
        var dataToSign = inputStr + outputStr;
        // Sign the data with the private key using node-forge
        var privateKey = node_forge_1.default.pki.privateKeyFromPem(PRIVATE_KEY);
        var md = node_forge_1.default.md.sha256.create();
        md.update(dataToSign, 'utf8');
        var signatureBytes = privateKey.sign(md);
        var signature = node_forge_1.default.util.bytesToHex(signatureBytes);
        return signature;
    };
    Transaction.prototype.calculateHash = function () {
        // Convert Inputs, Outputs, and signature to strings
        var inputStr = JSON.stringify(this.Inputs);
        var outputStr = JSON.stringify(this.Outputs);
        var signatureStr = this.signature;
        var dataToHash = inputStr + outputStr + signatureStr;
        // Calculate hash using SHA-256 with node-forge
        var md = node_forge_1.default.md.sha256.create();
        md.update(dataToHash, 'utf8');
        var hash = md.digest().toHex();
        return hash;
    };
    Transaction.prototype.validateTransaction = function () {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d;
        try {
            for (var _e = __values(this.Inputs.inputList), _f = _e.next(); !_f.done; _f = _e.next()) {
                var input = _f.value;
                var key = [input.transactionHash.toString(), input.outputIndex];
                // console.log("Input is printed");
                // console.log(key);
                // console.log("Iterating over keys in MyTransactionPool:");
                var found = false;
                try {
                    for (var _g = (e_3 = void 0, __values(MyTransactionPool.transactionPool.keys())), _h = _g.next(); !_h.done; _h = _g.next()) {
                        var mapKey = _h.value;
                        // console.log("Current key in iteration:", mapKey);
                        if (mapKey[0] === key[0] && mapKey[1] === key[1]) {
                            found = true;
                            break;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                if (!found) {
                    console.log("validateTransaction Validation Failed");
                    return false;
                }
                // Check if the transaction hash and output index key is present in the transaction pool
                // if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                //     return false; // Return false if any input is not present in the transaction pool
                // }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Calculate the sum of amounts from input entries
        var inputSum = 0;
        try {
            for (var _j = __values(this.Inputs.inputList), _k = _j.next(); !_k.done; _k = _j.next()) {
                var input = _k.value;
                var _l = __read(MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]), 2), blockIndex = _l[0], transactionIndex = _l[1];
                var outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
                inputSum += outputAmount;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
            }
            finally { if (e_4) throw e_4.error; }
        }
        // Calculate the sum of amounts from output entries
        var outputSum = 0;
        try {
            for (var _m = __values(this.Outputs.outputList), _o = _m.next(); !_o.done; _o = _m.next()) {
                var output = _o.value;
                outputSum += output.amount;
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
            }
            finally { if (e_5) throw e_5.error; }
        }
        // If input amount sum is less than output amount sum, return false
        if (inputSum < outputSum) {
            return false;
        }
        return true;
    };
    Transaction.prototype.sendTransaction = function () {
        // Socket logic
    };
    Transaction.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Transaction;
}());
exports.Transaction = Transaction;
// Individual block on the chain
var Block = /** @class */ (function () {
    //constructor(prevHash: string, transactions: Transaction[], difficulty: number, ts: number = Date.now()) {
    // Get the length of the chain and set the index of the block
    function Block(prevHash, transactions, flag, difficulty, ts, nonce) {
        if (flag === void 0) { flag = true; }
        if (difficulty === void 0) { difficulty = Overalldifficulty; }
        if (ts === void 0) { ts = Date.now(); }
        if (nonce === void 0) { nonce = 0; }
        // Get the length of the chain and set the index of the block
        if (flag)
            this.index = MyChain.chain.length;
        else
            this.index = 0;
        this.prevHash = prevHash;
        this.difficulty = difficulty;
        this.transactionlist = transactions;
        this.ts = ts;
        this.nonce = nonce;
        this.hash = this.calculateHash(this.nonce);
        this.coinbase = 0;
    }
    Block.prototype.mineBlock = function () {
        console.log('⛏️  mining...');
        // console.log('Mining full speed');
        var hash = this.calculateHash(this.nonce);
        while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
            if (this.nonce === Number.MAX_SAFE_INTEGER) {
                this.ts = Date.now();
                this.nonce = 0;
            }
            this.nonce++;
            hash = this.calculateHash(this.nonce);
        }
        this.hash = hash;
        console.log("Block mined: " + hash);
        console.log("mineBlock Block mined");
        // MyChain.sendBlock(this);
    };
    // Add a transaction to the block
    Block.prototype.addTransaction = function (transaction) {
        this.transactionlist.push(transaction);
        if (this.transactionlist.length >= tranactionPerBlock) {
            this.mineBlock();
        }
    };
    Block.prototype.calculateHash = function (nonce) {
        var data = {
            prevHash: this.prevHash,
            difficulty: this.difficulty,
            transactions: this.transactionlist,
            ts: this.ts,
            nonce: nonce
        };
        var str = JSON.stringify(data);
        // Calculate hash using SHA-256 with node-forge
        var md = node_forge_1.default.md.sha256.create();
        md.update(str, 'utf8');
        var hash = md.digest().toHex();
        return hash;
    };
    return Block;
}());
exports.Block = Block;
// recieve
// recieve transaction
// validate transaction
// add transaction to the block
// send
// The blockchain 
var Chain = /** @class */ (function () {
    function Chain() {
        this.chain = [];
        var outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, 100));
        var genesisTransaction = new Transaction(new InputList(), outputList);
        var genesisBlock = new Block('', [genesisTransaction], false);
        // this.chain.push(genesisBlock);
        // console.log('Genesis block created');
        // console.log(genesisBlock);
        // // Add the output list to the transaction pool
        // for (let i = 0; i < genesisTransaction.Outputs.outputList.length; i++) {
        //     MyTransactionPool.addTransaction(genesisTransaction.hash, i, 0, 0);
        //     console.log("Added Genesis Transsaction");
        //     console.log(genesisTransaction.hash);
        // }
        // console.log(MyTransactionPool);
    }
    Object.defineProperty(Chain.prototype, "lastBlock", {
        // Most recent block
        get: function () {
            return this.chain[this.chain.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    Chain.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Chain;
}());
// Wallet gives a user a public/private keypair
var Wallet = /** @class */ (function () {
    function Wallet() {
        this.isInitialized = false;
        var _a = this.generateKeyPairSync(), publicKey = _a.publicKey, privateKey = _a.privateKey;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.isInitialized = true; // Set initialization flag
    }
    Wallet.prototype.generateKeyPairSync = function () {
        try {
            var rsa = node_forge_1.default.pki.rsa;
            var keyPair_1 = rsa.generateKeyPair({ bits: 2048 });
            // console.log(keyPair.publicKey);
            console.log(node_forge_1.default.pki.publicKeyToPem(keyPair_1.publicKey));
            return { publicKey: keyPair_1.publicKey, privateKey: keyPair_1.privateKey };
        }
        catch (err) {
            throw new Error('Error generating key pair');
        }
    };
    Wallet.prototype.sendMoney = function (publicKey2, money) {
        var e_6, _a;
        // Check if initialized
        if (!this.isInitialized) {
            throw new Error('Wallet is not yet initialized');
        }
        var publicKey = node_forge_1.default.pki.publicKeyFromPem(publicKey2);
        // const publicKey : any = publicKey2;
        var inputs = new InputList();
        var outputs = new OutputList();
        // Add transaction logic...
        outputs.outputList.push(new Output(publicKey, money));
        var totalInputAmount = 0;
        // console.log(MyTransactionPool);
        // Add all transaction outputs where the publicKey matches the wallet's publicKey
        var transactionPool = MyTransactionPool.transactionPool;
        try {
            for (var transactionPool_1 = __values(transactionPool), transactionPool_1_1 = transactionPool_1.next(); !transactionPool_1_1.done; transactionPool_1_1 = transactionPool_1.next()) {
                var _b = __read(transactionPool_1_1.value, 2), _c = __read(_b[0], 2), transactionHash = _c[0], outputIndex = _c[1], _d = __read(_b[1], 2), blockIndex = _d[0], transactionIndex = _d[1];
                var block = MyChain.chain[blockIndex];
                var transaction = block.transactionlist[transactionIndex];
                var output = transaction.Outputs.outputList[outputIndex];
                // Convert to Json output
                // console.log("HII");
                // console.log(totalInputAmount);
                // console.log(money);
                // console.log(output.receiverPublicKey);
                // console.log(forge.pki.publicKeyToPem(output.receiverPublicKey))
                // console.log(this.publicKey);
                // console.log(forge.pki.publicKeyToPem(this.publicKey))
                var outputPublicKeyJson = JSON.stringify(output.receiverPublicKey);
                var thisPublicKeyJson = JSON.stringify(this.publicKey);
                console.log(outputPublicKeyJson);
                console.log(thisPublicKeyJson);
                if (outputPublicKeyJson === thisPublicKeyJson && totalInputAmount < money) {
                    totalInputAmount += output.amount;
                    console.log("YESS");
                    inputs.inputList.push(new Input(transactionHash, outputIndex));
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (transactionPool_1_1 && !transactionPool_1_1.done && (_a = transactionPool_1.return)) _a.call(transactionPool_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
        // Add self transaction for change
        var change = totalInputAmount - money;
        if (change > 0) {
            outputs.outputList.push(new Output(this.publicKey, change));
            // console.log(outputs.outputList)
            // console.log(inputs.inputList)
        }
        else if (change < 0) {
            console.log("Not enough balance. Additional " + -change + " coins required.");
            return null;
        }
        // Create new transaction
        return new Transaction(inputs, outputs);
        sendtransaction(new Transaction(inputs, outputs));
        // return 'Transaction sent';
        // Your existing code...
    };
    Wallet.prototype.signAndVerify = function (transaction) {
        // Check if initialized
        if (!this.isInitialized) {
            throw new Error('Wallet is not yet initialized');
        }
        var str = transaction.Inputs.toString() + transaction.Outputs.toString();
        var data = node_forge_1.default.util.createBuffer(str, 'utf8');
        var signature = this.privateKey.sign(data);
        var isValid = this.publicKey.verify(data.bytes(), signature);
        return isValid;
    };
    return Wallet;
}());
// sendtransaction socket code
function sendtransaction(transaction) {
    //   
}
function sendBlock(block) {
    // 
}
function validateblock(block) {
    var e_7, _a, e_8, _b, e_9, _c;
    var transactionIndex;
    if (MyChain.chain.length != block.index)
        return false;
    if (MyChain.chain.length == 0) {
        for (transactionIndex = 0; transactionIndex < block.transactionlist.length; transactionIndex++) {
            var transaction = block.transactionlist[transactionIndex];
            for (var i = 0; i < transaction.Outputs.outputList.length; i++) {
                var output = transaction.Outputs.outputList[i];
                MyTransactionPool.addTransaction(transaction.hash, i, block.index, transactionIndex);
                console.log("Added Transactio");
                console.log(transaction.hash);
            }
        }
        MyChain.chain.push(block);
        console.log('⛏️  Genesis Block Added...');
        console.log(MyTransactionPool);
        console.log(MyChain);
        return true;
    }
    console.log("Validating block");
    console.log(block);
    if (MyChain.chain[block.index - 1].hash != block.prevHash)
        return false;
    for (transactionIndex = 0; transactionIndex < block.transactionlist.length; transactionIndex++) {
        var transaction = block.transactionlist[transactionIndex];
        try {
            // console.log("Validating transaction:");
            for (var _d = (e_7 = void 0, __values(transaction.Inputs.inputList)), _e = _d.next(); !_e.done; _e = _d.next()) {
                var input = _e.value;
                // Check if the transaction hash and output index key is present in the transaction pool
                var key = [input.transactionHash.toString(), input.outputIndex];
                // console.log("Input is printed");
                // console.log(key);
                // console.log("Iterating over keys in MyTransactionPool:");
                var found = false;
                try {
                    for (var _f = (e_8 = void 0, __values(MyTransactionPool.transactionPool.keys())), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var mapKey = _g.value;
                        // console.log("Current key in iteration:", mapKey);
                        if (mapKey[0] === key[0] && mapKey[1] === key[1]) {
                            found = true;
                            break;
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
                if (!found) {
                    console.log("validateblock Validation Failed");
                    return false;
                }
                // if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                //     return false; // Return false if any input is not present in the transaction pool
                // }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_7) throw e_7.error; }
        }
        // console.log("Validate Block completed")
        // Calculate the sum of amounts from input entries
        // let inputSum = 0;
        // for (const input of transaction.Inputs.inputList) {
        //     const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex])!;
        //     const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
        //     inputSum += outputAmount;
        // }
        // // Calculate the sum of amounts from output entries
        // let outputSum = 0;
        // for (const output of transaction.Outputs.outputList) {
        //     outputSum += output.amount;
        // }
        // // If input amount sum is less than output amount sum, return false
        // if (inputSum < outputSum) {
        //     return false;
        // }
        // // Add the positive difference to the coinbase variable
        // block.coinbase += inputSum - outputSum;
        // Put all output entries in the output list into the transaction pool map
        for (var i = 0; i < transaction.Outputs.outputList.length; i++) {
            var output = transaction.Outputs.outputList[i];
            MyTransactionPool.addTransaction(transaction.hash, i, block.index, transactionIndex);
            console.log("Added Transaction");
            console.log(transaction.hash);
        }
        try {
            // Remove all input entries from the transaction pool
            for (var _h = (e_9 = void 0, __values(transaction.Inputs.inputList)), _j = _h.next(); !_j.done; _j = _h.next()) {
                var input = _j.value;
                MyTransactionPool.removeTransaction(input.transactionHash, input.outputIndex);
                console.log("Remove Transaction");
                console.log(input.transactionHash);
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
            }
            finally { if (e_9) throw e_9.error; }
        }
        // console.log("Transaction Pool updated");
    }
    MyChain.chain.push(block);
    // Print Mychain object
    console.log('⛏️ New Block Added...');
    console.log(MyTransactionPool);
    console.log(MyChain);
    return true; // Return true if all transactions are valid
}
exports.validateblock = validateblock;
// function validateblock(block: Block): boolean {
//     return block.validateBlock();
// }
// Take the transactionperblock transactions from mytransactionlist and make a block and mine it
function makeBlock() {
    var e_10, _a, e_11, _b, e_12, _c, e_13, _d, e_14, _e;
    var transactions = [];
    for (var i = 0; i < tranactionPerBlock; i++) {
        transactions.push(MyTransactionlist.pop());
    }
    var prevHash = MyChain.lastBlock.hash;
    var block = new Block(prevHash, transactions);
    var transactionIndex = 0;
    // for each transaction calculate the diffrenec e between inout and outputs and add te coinbase transactions with input as null and output as the difference
    for (transactionIndex = 0; transactionIndex < transactions.length; transactionIndex++) {
        var transaction = transactions[transactionIndex];
        try {
            for (var _f = (e_10 = void 0, __values(transaction.Inputs.inputList)), _g = _f.next(); !_g.done; _g = _f.next()) {
                var input = _g.value;
                var key = [input.transactionHash.toString(), input.outputIndex];
                // console.log("Input is printed");
                // console.log(key);
                // console.log("Iterating over keys in MyTransactionPool:");
                var found = false;
                try {
                    for (var _h = (e_11 = void 0, __values(MyTransactionPool.transactionPool.keys())), _j = _h.next(); !_j.done; _j = _h.next()) {
                        var mapKey = _j.value;
                        // console.log("Current key in iteration:", mapKey);
                        if (mapKey[0] === key[0] && mapKey[1] === key[1]) {
                            found = true;
                            break;
                        }
                    }
                }
                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
                    }
                    finally { if (e_11) throw e_11.error; }
                }
                if (!found) {
                    console.log("Input Transaction not found in the transaction pool");
                    return null; // Return false if any input is not present in the transaction pool
                }
                // console.log("Input Transactions found in the transaction pool");
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
            }
            finally { if (e_10) throw e_10.error; }
        }
        // console.log("Input Transactions found in the transaction pool")
        // Calculate the sum of amounts from input entries
        var inputSum = 0;
        try {
            for (var _k = (e_12 = void 0, __values(transaction.Inputs.inputList)), _l = _k.next(); !_l.done; _l = _k.next()) {
                var input = _l.value;
                var _m = __read([1, 1], 2), blockIndex = _m[0], transactionIndex_1 = _m[1];
                try {
                    for (var _o = (e_13 = void 0, __values(MyTransactionPool.transactionPool.keys())), _p = _o.next(); !_p.done; _p = _o.next()) {
                        var mapKey = _p.value;
                        // console.log("Current key in iteration:", mapKey);
                        if (mapKey[0] === input.transactionHash && mapKey[1] === input.outputIndex) {
                            blockIndex = MyTransactionPool.transactionPool.get(mapKey)[0];
                            transactionIndex_1 = MyTransactionPool.transactionPool.get(mapKey)[1];
                            // [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get(mapKey)!;
                            // console.log("Block Index:", blockIndex, "Transaction Index:", transactionIndex);
                            break;
                        }
                    }
                }
                catch (e_13_1) { e_13 = { error: e_13_1 }; }
                finally {
                    try {
                        if (_p && !_p.done && (_d = _o.return)) _d.call(_o);
                    }
                    finally { if (e_13) throw e_13.error; }
                }
                // const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex])!;
                // console.log("Block Index:", blockIndex, "Transaction Index:", transactionIndex);
                var outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex_1].Outputs.outputList[input.outputIndex].amount;
                inputSum += outputAmount;
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
            }
            finally { if (e_12) throw e_12.error; }
        }
        // console.log("Input sum calculated:", inputSum);
        // Calculate the sum of amounts from output entries
        var outputSum = 0;
        try {
            // console.log("Output list is printed");
            // console.log(transaction.Outputs.outputList);
            for (var _q = (e_14 = void 0, __values(transaction.Outputs.outputList)), _r = _q.next(); !_r.done; _r = _q.next()) {
                var output = _r.value;
                // Dont add if output is to the sender
                if (output.receiverPublicKey === MyWallet.publicKey) {
                    // console.log("Output is to the sender. Skipping...");
                    continue;
                }
                outputSum += output.amount;
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (_r && !_r.done && (_e = _q.return)) _e.call(_q);
            }
            finally { if (e_14) throw e_14.error; }
        }
        // console.log("Output sum calculated:", outputSum);
        // If input amount sum is less than output amount sum, return false
        if (inputSum < outputSum) {
            // console.log("Input amount sum is less than output amount sum");
            return null;
        }
        // Add the positive difference to the coinbase variable
        block.coinbase += inputSum - outputSum;
    }
    // const outputList : OutputList = new OutputList();
    // outputList.outputList.push(new Output(MyWallet.publicKey, block.coinbase));
    // const extraTransaction = new Transaction(new InputList(), outputList);
    // MyTransactionPool.addTransaction(extraTransaction.hash, 0, block.index, transactionIndex);
    block.mineBlock();
    return block;
}
exports.makeBlock = makeBlock;
function getbalance() {
    var e_15, _a;
    // Add all transaction outputs where the publicKey matches the wallet's publicKey
    var totalInputAmount = 0;
    var transactionPool = MyTransactionPool.transactionPool;
    try {
        for (var transactionPool_2 = __values(transactionPool), transactionPool_2_1 = transactionPool_2.next(); !transactionPool_2_1.done; transactionPool_2_1 = transactionPool_2.next()) {
            var _b = __read(transactionPool_2_1.value, 2), _c = __read(_b[0], 2), transactionHash = _c[0], outputIndex = _c[1], _d = __read(_b[1], 2), blockIndex = _d[0], transactionIndex = _d[1];
            var block = MyChain.chain[blockIndex];
            var transaction = block.transactionlist[transactionIndex];
            var output = transaction.Outputs.outputList[outputIndex];
            // Convert to Json output
            // console.log("HII");
            // console.log(totalInputAmount);
            // console.log(money);
            // console.log(output.receiverPublicKey);
            // console.log(forge.pki.publicKeyToPem(output.receiverPublicKey))
            // console.log(this.publicKey);
            // console.log(forge.pki.publicKeyToPem(this.publicKey))
            var outputPublicKeyJson = JSON.stringify(output.receiverPublicKey);
            var thisPublicKeyJson = JSON.stringify(MyWallet.publicKey);
            console.log(outputPublicKeyJson);
            console.log(thisPublicKeyJson);
            if (outputPublicKeyJson === thisPublicKeyJson) {
                totalInputAmount += output.amount;
            }
        }
    }
    catch (e_15_1) { e_15 = { error: e_15_1 }; }
    finally {
        try {
            if (transactionPool_2_1 && !transactionPool_2_1.done && (_a = transactionPool_2.return)) _a.call(transactionPool_2);
        }
        finally { if (e_15) throw e_15.error; }
    }
    return totalInputAmount;
    // Add self transaction for change
}
exports.getbalance = getbalance;
var MyTemporaryTransactionPool = new TransactionPool();
var MyTransactionPool = new TransactionPool();
var MyWallet = new Wallet();
exports.MyWallet = MyWallet;
// const bob = new Wallet();
var MyChain = new Chain();
// const MyBlock = new Block();
var MyTransactionlist = [];
exports.MyTransactionlist = MyTransactionlist;
// const satoshi = new Wallet();
// const alice = new Wallet();
function sendMoneyAfterInitialization(wallet, publicKey, amount) {
    // Wait until the wallet is initialized
    wallet.generateKeyPairSync();
    // Now the wallet is initialized, you can call sendMoney
    wallet.sendMoney(publicKey, amount);
}
