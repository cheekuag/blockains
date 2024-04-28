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
exports.MyTransactionlist = exports.MyWallet = void 0;
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
        this.transactionPool.delete([transactionHash, outputIndex]);
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
var OutputList = /** @class */ (function () {
    // Constructor
    function OutputList() {
        this.outputList = [];
    }
    return OutputList;
}());
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
        var e_1, _a, e_2, _b, e_3, _c;
        try {
            for (var _d = __values(this.Inputs.inputList), _e = _d.next(); !_e.done; _e = _d.next()) {
                var input = _e.value;
                // Check if the transaction hash and output index key is present in the transaction pool
                if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                    return false; // Return false if any input is not present in the transaction pool
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Calculate the sum of amounts from input entries
        var inputSum = 0;
        try {
            for (var _f = __values(this.Inputs.inputList), _g = _f.next(); !_g.done; _g = _f.next()) {
                var input = _g.value;
                var _h = __read(MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]), 2), blockIndex = _h[0], transactionIndex = _h[1];
                var outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
                inputSum += outputAmount;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Calculate the sum of amounts from output entries
        var outputSum = 0;
        try {
            for (var _j = __values(this.Outputs.outputList), _k = _j.next(); !_k.done; _k = _j.next()) {
                var output = _k.value;
                outputSum += output.amount;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
            }
            finally { if (e_3) throw e_3.error; }
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
// Individual block on the chain
var Block = /** @class */ (function () {
    //constructor(prevHash: string, transactions: Transaction[], difficulty: number, ts: number = Date.now()) {
    // Get the length of the chain and set the index of the block
    function Block(prevHash, transactions, flag, difficulty, ts) {
        if (flag === void 0) { flag = true; }
        if (difficulty === void 0) { difficulty = Overalldifficulty; }
        if (ts === void 0) { ts = Date.now(); }
        // Get the length of the chain and set the index of the block
        if (flag) {
            this.index = MyChain.chain.length;
        }
        else {
            this.index = 0;
        }
        this.prevHash = prevHash;
        this.difficulty = difficulty;
        this.transactionlist = transactions;
        this.ts = ts;
        this.nonce = 0;
        this.hash = this.calculateHash(this.nonce);
        this.coinbase = 0;
    }
    Block.prototype.validateBlock = function () {
        var e_4, _a, e_5, _b, e_6, _c, e_7, _d;
        var transactionIndex;
        for (transactionIndex = 0; transactionIndex < this.transactionlist.length; transactionIndex++) {
            var transaction = this.transactionlist[transactionIndex];
            try {
                for (var _e = (e_4 = void 0, __values(transaction.Inputs.inputList)), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var input = _f.value;
                    // Check if the transaction hash and output index key is present in the transaction pool
                    if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                        return false; // Return false if any input is not present in the transaction pool
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                }
                finally { if (e_4) throw e_4.error; }
            }
            // Calculate the sum of amounts from input entries
            var inputSum = 0;
            try {
                for (var _g = (e_5 = void 0, __values(transaction.Inputs.inputList)), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var input = _h.value;
                    var _j = __read(MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]), 2), blockIndex = _j[0], transactionIndex_1 = _j[1];
                    var outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex_1].Outputs.outputList[input.outputIndex].amount;
                    inputSum += outputAmount;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_5) throw e_5.error; }
            }
            // Calculate the sum of amounts from output entries
            var outputSum = 0;
            try {
                for (var _k = (e_6 = void 0, __values(transaction.Outputs.outputList)), _l = _k.next(); !_l.done; _l = _k.next()) {
                    var output = _l.value;
                    outputSum += output.amount;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
                }
                finally { if (e_6) throw e_6.error; }
            }
            // If input amount sum is less than output amount sum, return false
            if (inputSum < outputSum) {
                return false;
            }
            // Add the positive difference to the coinbase variable
            this.coinbase += inputSum - outputSum;
            // Put all output entries in the output list into the transaction pool map
            for (var i = 0; i < transaction.Outputs.outputList.length; i++) {
                var output = transaction.Outputs.outputList[i];
                MyTransactionPool.addTransaction(transaction.hash, i, this.index, transactionIndex);
            }
            try {
                // Remove all input entries from the transaction pool
                for (var _m = (e_7 = void 0, __values(transaction.Inputs.inputList)), _o = _m.next(); !_o.done; _o = _m.next()) {
                    var input = _o.value;
                    MyTransactionPool.removeTransaction(input.transactionHash, input.outputIndex);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        var outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, this.coinbase));
        var extraTransaction = new Transaction(new InputList(), outputList);
        MyTemporaryTransactionPool.addTransaction(extraTransaction.hash, 0, this.index, transactionIndex);
        return true; // Return true if all transactions are valid
    };
    Block.prototype.mineBlock = function () {
        console.log('⛏️  mining...');
        console.log('Mining full speed');
        var hash = this.calculateHash(this.nonce);
        while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
            if (this.nonce === Number.MAX_SAFE_INTEGER) {
                this.ts = Date.now();
                this.nonce = 0;
            }
            this.nonce++;
            hash = this.calculateHash(this.nonce);
        }
        console.log("Block mined: " + hash);
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
        this.chain.push(genesisBlock);
        console.log('Genesis block created');
        console.log(genesisBlock);
        // Add the output list to the transaction pool
        for (var i = 0; i < genesisTransaction.Outputs.outputList.length; i++) {
            MyTransactionPool.addTransaction(genesisTransaction.hash, i, 0, 0);
        }
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
            return { publicKey: keyPair_1.publicKey, privateKey: keyPair_1.privateKey };
        }
        catch (err) {
            throw new Error('Error generating key pair');
        }
    };
    Wallet.prototype.sendMoney = function (publicKey, money) {
        var e_8, _a;
        // Check if initialized
        if (!this.isInitialized) {
            throw new Error('Wallet is not yet initialized');
        }
        var inputs = new InputList();
        var outputs = new OutputList();
        // Add transaction logic...
        outputs.outputList.push(new Output(publicKey, money));
        var totalInputAmount = 0;
        // Add all transaction outputs where the publicKey matches the wallet's publicKey
        var transactionPool = MyTransactionPool.transactionPool;
        try {
            for (var transactionPool_1 = __values(transactionPool), transactionPool_1_1 = transactionPool_1.next(); !transactionPool_1_1.done; transactionPool_1_1 = transactionPool_1.next()) {
                var _b = __read(transactionPool_1_1.value, 2), _c = __read(_b[0], 2), transactionHash = _c[0], outputIndex = _c[1], _d = __read(_b[1], 2), blockIndex = _d[0], transactionIndex = _d[1];
                var block = MyChain.chain[blockIndex];
                var transaction = block.transactionlist[transactionIndex];
                var output = transaction.Outputs.outputList[outputIndex];
                if (output.receiverPublicKey === this.publicKey && totalInputAmount < money) {
                    totalInputAmount += output.amount;
                    inputs.inputList.push(new Input(transactionHash, outputIndex));
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (transactionPool_1_1 && !transactionPool_1_1.done && (_a = transactionPool_1.return)) _a.call(transactionPool_1);
            }
            finally { if (e_8) throw e_8.error; }
        }
        // Add self transaction for change
        var change = totalInputAmount - money;
        if (change > 0) {
            outputs.outputList.push(new Output(this.publicKey, change));
            console.log(outputs.outputList);
            console.log(inputs.inputList);
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
var MyTemporaryTransactionPool = new TransactionPool();
var MyTransactionPool = new TransactionPool();
var MyWallet = new Wallet();
exports.MyWallet = MyWallet;
var bob = new Wallet();
var MyChain = new Chain();
// const MyBlock = new Block();
var MyTransactionlist = [];
exports.MyTransactionlist = MyTransactionlist;
var satoshi = new Wallet();
var alice = new Wallet();
function sendMoneyAfterInitialization(wallet, publicKey, amount) {
    // Wait until the wallet is initialized
    wallet.generateKeyPairSync();
    // Now the wallet is initialized, you can call sendMoney
    wallet.sendMoney(publicKey, amount);
}
// Call sendMoneyAfterInitialization for MyWallet
// Convert bob.publickey to string
sendMoneyAfterInitialization(MyWallet, bob.publicKey, 50);
sendMoneyAfterInitialization(MyWallet, alice.publicKey, 30);
