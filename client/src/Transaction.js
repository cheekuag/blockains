const crypto = require('crypto-js');
const { PUBLIC_KEY, PRIVATE_KEY } = require('./constants.js');

console.log('Public Key:', PUBLIC_KEY);
console.log('Private Key:', PRIVATE_KEY);

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
    constructor() {
        this.outputList = [];
    }
}

class InputList {
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
        this.signature = this.calculateSignature();
        this.hash = this.calculateHash();
    }

    validateTransaction() {
        for (const input of this.Inputs.inputList) {
            if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                return false;
            }
        }
        let inputSum = 0;
        for (const input of this.Inputs.inputList) {
            const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]);
            const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
            inputSum += outputAmount;
        }
        let outputSum = 0;
        for (const output of this.Outputs.outputList) {
            outputSum += output.amount;
        }
        if (inputSum < outputSum) {
            return false;
        }
        return true;
    }

    calculateSignature() {
        const str = this.Inputs.toString() + this.Outputs.toString();
        const signature = crypto.createSign('SHA256');
        signature.update(str).end();
        return signature.sign(MyWallet.privateKey).toString('hex').toString();
    }

    calculateHash() {
        const str = this.Inputs.toString() + this.Outputs.toString() + this.signature;
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

    sendTransaction() {
        // socket here
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    constructor(prevHash, transactions, difficulty = Overalldifficulty, ts = Date.now()) {
        this.index = MyChain.chain.length;
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
                if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                    return false;
                }
            }
            let inputSum = 0;
            for (const input of transaction.Inputs.inputList) {
                const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex]);
                const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
                inputSum += outputAmount;
            }
            let outputSum = 0;
            for (const output of transaction.Outputs.outputList) {
                outputSum += output.amount;
            }
            if (inputSum < outputSum) {
                return false;
            }
            this.coinbase += inputSum - outputSum;
            for (let i = 0; i < transaction.Outputs.outputList.length; i++) {
                const output = transaction.Outputs.outputList[i];
                MyTransactionPool.addTransaction(transaction.hash, i, this.index, transactionIndex);
            }
            for (const input of transaction.Inputs.inputList) {
                MyTransactionPool.removeTransaction(input.transactionHash, input.outputIndex);
            }
        }
        const outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, this.coinbase));
        const extraTransaction = new Transaction(new InputList(), outputList);
        MyTemporaryTransactionPool.addTransaction(extraTransaction.hash, 0, this.index, transactionIndex);
        return true;
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
    }

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

class Chain {
    constructor() {
        const outputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, 100));
        const genesisTransaction = new Transaction(new InputList(), outputList);
        const genesisBlock = new Block('', [genesisTransaction]);
        this.chain = [genesisBlock];
        console.log('Genesis block created');
        for (let i = 0; i < genesisTransaction.Outputs.outputList.length; i++) {
            MyTransactionPool.addTransaction(genesisTransaction.hash, i, 0, 0);
        }
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(outputs) {
        const inputs = new InputList();
        let totalInputAmount = 0;
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
        const change = totalInputAmount - outputs.outputList.reduce((sum, output) => sum + output.amount, 0);
        if (change > 0) {
            outputs.outputList.push(new Output(this.publicKey, change));
        } else if (change < 0) {
            console.log(`Not enough balance. Additional ${-change} coins required.`);
            return;
        }
        sendtransaction(new Transaction(inputs, outputs));
    }
}

function sendtransaction(transaction) {
    // socket here
}

function sendBlock(block) {
    // 
}

let MyWallet = new Wallet();
let MyChain = new Chain();
let MyTransactionPool = new TransactionPool();
let MyTemporaryTransactionPool = new TransactionPool();
let MyTransactionlist = [];

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

const outputList = new OutputList();
outputList.outputList.push(new Output(bob.publicKey, 50));
MyWallet.sendMoney(outputList);

module.exports = { MyWallet };
