import * as crypto from 'crypto-browserify';
// const crypto = require("crypto");
// Create a transaction pool to store the unspent tranactions hash and their block index and transactiion index
const { PUBLIC_KEY, PRIVATE_KEY } = require('./constants.js');
console.log('Public Key:', PUBLIC_KEY);
console.log('Private Key:', PRIVATE_KEY);
// Create a transaction pool to store the unspent tranactions hash , their output index and their block index and transactiion index
const Overalldifficulty = 4;
const tranactionPerBlock = 1;
class TransactionPool {
    constructor() {
        this.transactionPool = new Map();
    }
    addTransaction(transactionHash, outputIndex, blockIndex, transactionIndex) {
        this.transactionPool.set([transactionHash, outputIndex], [blockIndex, transactionIndex]);
    }
    removeTransaction(transactionHash, outputIndex) {
        this.transactionPool.delete([transactionHash, outputIndex]);
    }
    toString() {
        let result = "TransactionPool {\n";
        this.transactionPool.forEach((value, key) => {
            const keyStr = JSON.stringify(Array.from(key));
            const valueStr = JSON.stringify(Array.from(value));
            result += `  ${keyStr} => ${valueStr}\n`;
        });
        result += "}";
        return result;
    }
}
// Transfer of funds between two wallets
class Input {
    constructor(transactionHash, outputIndex) {
        this.transactionHash = transactionHash;
        this.outputIndex = outputIndex;
    }
}
class Output {
    constructor(receiverPublicKey, amount) {
        this.receiverPublicKey = receiverPublicKey;
        this.amount = amount;
    }
}
class OutputList {
    // Constructor
    constructor() {
        this.outputList = [];
    }
}
class InputList {
    // Constructor
    constructor() {
        this.inputList = [];
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Transaction {
    constructor(Inputs, Outputs) {
        this.Inputs = Inputs;
        this.Outputs = Outputs;
        // sign the insputs and output by converting to strig and signing with the private key of the sender
        this.signature = this.calculateSignature();
        this.hash = this.calculateHash();
    }
    validateTransaction() {
        for (const input of this.Inputs.inputList) {
            // Check if the transaction hash and output index key is present in the transaction pool
            if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                return false; // Return false if any input is not present in the transaction pool
            }
        }
        // Calculate the sum of amounts from input entries
        let inputSum = 0;
        for (const input of this.Inputs.inputList) {
            const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]);
            const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
            inputSum += outputAmount;
        }
        // Calculate the sum of amounts from output entries
        let outputSum = 0;
        for (const output of this.Outputs.outputList) {
            outputSum += output.amount;
        }
        // If input amount sum is less than output amount sum, return false
        if (inputSum < outputSum) {
            return false;
        }
        return true;
    }
    // Give the calculateSignature
    calculateSignature() {
        const signature = crypto.createSign('SHA256');
        const str = this.Inputs.toString() + this.Outputs.toString();
        signature.update(str).end();
        const sign = signature.sign(MyWallet.privateKey).toString('hex').toString();
        return sign;
    }
    // give the calculateHash
    calculateHash() {
        const str = this.Inputs.toString() + this.Outputs.toString() + this.signature;
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
    sendTransaction() {
        //  socket here
    }
    toString() {
        return JSON.stringify(this);
    }
}
// Individual block on the chain
class Block {
    //constructor(prevHash: string, transactions: Transaction[], difficulty: number, ts: number = Date.now()) {
    // Get the length of the chain and set the index of the block
    constructor(prevHash, transactions, flag = true, difficulty = Overalldifficulty, ts = Date.now()) {
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
    validateBlock() {
        let transactionIndex;
        for (transactionIndex = 0; transactionIndex < this.transactionlist.length; transactionIndex++) {
            const transaction = this.transactionlist[transactionIndex];
            for (const input of transaction.Inputs.inputList) {
                // Check if the transaction hash and output index key is present in the transaction pool
                if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                    return false; // Return false if any input is not present in the transaction pool
                }
            }
            // Calculate the sum of amounts from input entries
            let inputSum = 0;
            for (const input of transaction.Inputs.inputList) {
                const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]);
                const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
                inputSum += outputAmount;
            }
            // Calculate the sum of amounts from output entries
            let outputSum = 0;
            for (const output of transaction.Outputs.outputList) {
                outputSum += output.amount;
            }
            // If input amount sum is less than output amount sum, return false
            if (inputSum < outputSum) {
                return false;
            }
            // Add the positive difference to the coinbase variable
            this.coinbase += inputSum - outputSum;
            // Put all output entries in the output list into the transaction pool map
            for (let i = 0; i < transaction.Outputs.outputList.length; i++) {
                const output = transaction.Outputs.outputList[i];
                MyTransactionPool.addTransaction(transaction.hash, i, this.index, transactionIndex);
            }
            // Remove all input entries from the transaction pool
            for (const input of transaction.Inputs.inputList) {
                MyTransactionPool.removeTransaction(input.transactionHash, input.outputIndex);
            }
        }
        const outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, this.coinbase));
        const extraTransaction = new Transaction(new InputList(), outputList);
        MyTemporaryTransactionPool.addTransaction(extraTransaction.hash, 0, this.index, transactionIndex);
        return true; // Return true if all transactions are valid
    }
    mineBlock() {
        console.log('⛏️  mining...');
        console.log('Mining full speed');
        let hash = this.calculateHash(this.nonce);
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
    }
    // Add a transaction to the block
    addTransaction(transaction) {
        this.transactionlist.push(transaction);
        if (this.transactionlist.length >= tranactionPerBlock) {
            this.mineBlock();
        }
    }
    calculateHash(nonce) {
        const str = JSON.stringify({ prevHash: this.prevHash, difficulty: this.difficulty, transactions: this.transactionlist, ts: this.ts, nonce });
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
// recieve
// recieve transaction
// validate transaction
// add transaction to the block
// send
// The blockchain 
class Chain {
    constructor() {
        this.chain = [];
        const outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, 100));
        const genesisTransaction = new Transaction(new InputList(), outputList);
        const genesisBlock = new Block('', [genesisTransaction], false);
        this.chain.push(genesisBlock);
        console.log('Genesis block created');
        // Add the output list to the transaction pool
        for (let i = 0; i < genesisTransaction.Outputs.outputList.length; i++) {
            MyTransactionPool.addTransaction(genesisTransaction.hash, i, 0, 0);
        }
    }
    // Most recent block
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    toString() {
        return JSON.stringify(this);
    }
}

async function generateKeyPair() {
     
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: 'SHA-256' },
        },
        true,
        ['encrypt', 'decrypt']
    );

    // Export keys as PEM format
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: Buffer.from(publicKey).toString('base64'),
        privateKey: Buffer.from(privateKey).toString('base64'),
    };
}

// Wallet gives a user a public/private keypair
class Wallet {
    constructor() {
        // const seedHash = crypto.createHash('sha256').update(seed).digest('hex'); 
        try {
            const keyPair = generateKeyPair();
            console.log('Public Key:', keyPair.publicKey);
            console.log('Private Key:', keyPair.privateKey);
        } catch (error) {
            console.error('Error generating key pair:', error);
        }

        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            // seed: seedHash
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(publicKey, money) {
        const inputs = new InputList();
        const outputs = new OutputList();
        outputs.outputList.push(new Output(publicKey, money));
        let totalInputAmount = 0;
        // Add all transaction outputs where the publicKey matches the wallet's publicKey
        const transactionPool = MyTransactionPool.transactionPool;
        for (const [[transactionHash, outputIndex], [blockIndex, transactionIndex]] of transactionPool) {
            const block = MyChain.chain[blockIndex];
            const transaction = block.transactionlist[transactionIndex];
            const output = transaction.Outputs.outputList[outputIndex];
            if (output.receiverPublicKey === this.publicKey && totalInputAmount < output.amount) {
                totalInputAmount += output.amount;
                inputs.inputList.push(new Input(transactionHash, outputIndex));
            }
        }
        // Add self transaction for change
        const change = totalInputAmount - outputs.outputList.reduce((sum, output) => sum + output.amount, 0);
        if (change > 0) {
            outputs.outputList.push(new Output(this.publicKey, change));
            console.log(outputs.outputList);
            console.log(inputs.inputList);
        }
        else if (change < 0) {
            console.log(`Not enough balance. Additional ${-change} coins required.`);
            return;
        }
        // Create new transaction
        const transaction = new Transaction(inputs, outputs);
        sendtransaction(transaction);
        console.log(transaction);
        const sign = Buffer.from(transaction.signature, 'hex');
        const verify = crypto.createVerify('SHA256');
        console.log("Hi");
        const str = transaction.Inputs.toString() + transaction.Outputs.toString();
        verify.update(str).end();
        const isValid = verify.verify(this.publicKey, sign);
        if (isValid) {
            console.log('Transaction is valid');
        }
        else {
            console.log('Transaction is invalid');
        }
        MyTransactionlist.push(transaction);
        // Add transaction to the blockchain
        // SingletonChain.getInstance().addBlock(transaction);
    }
}
// sendtransaction socket code
function sendtransaction(transaction) {
    //   
}
function sendBlock(block) {
    // 
}
let MyTemporaryTransactionPool = new TransactionPool();
let MyTransactionPool = new TransactionPool();
let MyWallet = new Wallet();
const bob = new Wallet();
let MyChain = new Chain();
// create new lsit of transaction
let MyTransactionlist = [];
const satoshi = new Wallet();
const alice = new Wallet();
// send money 50 to bob public key

// Use a function to wait for the initialization of the wallet
async function sendMoneyAfterInitialization(wallet, publicKey, amount) {
    // Wait until the wallet is initialized
    await wallet.generateKeyPair();

    // Now the wallet is initialized, you can call sendMoney
    await wallet.sendMoney(publicKey, amount);
}

// Call sendMoneyAfterInitialization for MyWallet
sendMoneyAfterInitialization(MyWallet, bob.publicKey, 50);

// console.log(SingletonChain.getInstance().chain);
// MyWallet.sendMoney(bob.publicKey, 50);
// bob.sendMoney(alice.publicKey, 23);
// console.log(SingletonChain.getInstance().chain);
// satoshi.sendMoney(50, bob.publicKey);
// bob.sendMoney(23, alice.publicKey);
// alice.sendMoney(5, bob.publicKey);

module.exports = {
    MyWallet : Wallet
}