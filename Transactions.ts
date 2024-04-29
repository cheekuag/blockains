//import * as CryptoJS from 'crypto-js';
import forge from 'node-forge';

// Generate a key pair
const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

// Convert the keys to PEM format
const PUBLIC_KEY = forge.pki.publicKeyToPem(keyPair.publicKey);
const PRIVATE_KEY = forge.pki.privateKeyToPem(keyPair.privateKey);

console.log('Public Key:', PUBLIC_KEY);
console.log('Private Key:', PRIVATE_KEY);


// Create a transaction pool to store the unspent tranactions hash , their output index and their block index and transactiion index

const Overalldifficulty : number = 4;
const tranactionPerBlock : number = 1;

class TransactionPool {
    //transactionHash ,outputindex -> blocknumber, transaction no
    transactionPool: Map<[string, number], [number, number]>;

    constructor() {
        this.transactionPool = new Map();
    }

    addNewTransaction(transaction : Transaction){
        // Iterate over outputs and add them to the transaction pool
        for (let i = 0; i < transaction.Outputs.outputList.length; i++) {
            this.addTransaction(transaction.hash, i, 0, 0);
        }
        this.transactionPool.set([transaction.hash, 0], [0, 0]);
    }

    addTransaction(transactionHash: string, outputIndex: number, blockIndex: number, transactionIndex: number): void {
        this.transactionPool.set([transactionHash, outputIndex], [blockIndex, transactionIndex]);
    }

    removeTransaction(transactionHash: string, outputIndex: number): void {
        this.transactionPool.delete([transactionHash, outputIndex]);
    }
    
    toString(): string {
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
    transactionHash: string;
    outputIndex: number;

    constructor(transactionHash: string, outputIndex: number) {
        this.transactionHash = transactionHash;
        this.outputIndex = outputIndex;
    }
}

class Output {
    receiverPublicKey: CryptoKey;
    amount: number;

    constructor(receiverPublicKey: CryptoKey, amount: number) {
        this.receiverPublicKey = receiverPublicKey;
        this.amount = amount;
    }
}

class OutputList {
    outputList: Output[];

    // Constructor
    constructor() {
        this.outputList = [];
    }

}

class InputList {
    inputList: Input[];

    // Constructor
    constructor() {
        this.inputList = [];
    }

    toString(): string {
        return JSON.stringify(this);
    }
}

class Transaction {
    Inputs: InputList;
    Outputs: OutputList;
    signature: string;
    hash: string;

    constructor(Inputs: InputList, Outputs: OutputList) {
        this.Inputs = Inputs;
        this.Outputs = Outputs;
        // sign the inputs and output by converting to string and signing with the private key of the sender
        this.signature = this.calculateSignature();
        this.hash = this.calculateHash();
    }

    calculateSignature(): string {
        // Convert Inputs and Outputs to strings
        const inputStr = JSON.stringify(this.Inputs);
        const outputStr = JSON.stringify(this.Outputs);
        const dataToSign = inputStr + outputStr;

        // Sign the data with the private key using node-forge
        const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY);
        const md = forge.md.sha256.create();
        md.update(dataToSign, 'utf8');
        const signatureBytes = privateKey.sign(md);
        const signature = forge.util.bytesToHex(signatureBytes);

        return signature;
    }

    calculateHash(): string {
        // Convert Inputs, Outputs, and signature to strings
        const inputStr = JSON.stringify(this.Inputs);
        const outputStr = JSON.stringify(this.Outputs);
        const signatureStr = this.signature;
        const dataToHash = inputStr + outputStr + signatureStr;

        // Calculate hash using SHA-256 with node-forge
        const md = forge.md.sha256.create();
        md.update(dataToHash, 'utf8');
        const hash = md.digest().toHex();

        return hash;
    }

    validateTransaction(): boolean {
        for (const input of this.Inputs.inputList) {
            // Check if the transaction hash and output index key is present in the transaction pool
            if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
                return false; // Return false if any input is not present in the transaction pool
            }
        }
        // Calculate the sum of amounts from input entries
        let inputSum = 0;
        for (const input of this.Inputs.inputList) {
            const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex])!;
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

    sendTransaction(): void {
        // Socket logic
    }

    toString(): string {
        return JSON.stringify(this);
    }
}

// Individual block on the chain
class Block {
    index: number;
    prevHash: string;
    transactionlist: Transaction[];
    ts: number;
    nonce: number;
    difficulty: number;
    hash: string;
    coinbase: number;
    
    //constructor(prevHash: string, transactions: Transaction[], difficulty: number, ts: number = Date.now()) {
        // Get the length of the chain and set the index of the block
    constructor(prevHash: string, transactions: Transaction[],  flag: boolean = true, difficulty: number = Overalldifficulty, ts: number = Date.now()) {
      // Get the length of the chain and set the index of the block
        if(flag) this.index = MyChain.chain.length;
        else this.index = 0;
        this.prevHash = prevHash;
        this.difficulty = difficulty;
        this.transactionlist = transactions;
        this.ts = ts;
        this.nonce = 0;
        this.hash = this.calculateHash(this.nonce);
        this.coinbase = 0;
    }

    mineBlock(): void {
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
        this.hash = hash;
        console.log("Block mined: " + hash);
        // MyChain.sendBlock(this);
    }

    // Add a transaction to the block
    addTransaction(transaction: Transaction): void {
        this.transactionlist.push(transaction);
        if(this.transactionlist.length >= tranactionPerBlock){
            this.mineBlock();
        }
    }
    
    calculateHash(nonce: number): string {
        const data = {
            prevHash: this.prevHash,
            difficulty: this.difficulty,
            transactions: this.transactionlist,
            ts: this.ts,
            nonce: nonce
        };
        const str = JSON.stringify(data);

        // Calculate hash using SHA-256 with node-forge
        const md = forge.md.sha256.create();
        md.update(str, 'utf8');
        const hash = md.digest().toHex();

        return hash;
    }

}
// recieve
// recieve transaction
// validate transaction
// add transaction to the block

// send
// The blockchain 
class Chain {
    
    chain: Block[];

    constructor() {
        this.chain = [];
        const outputList: OutputList = new OutputList();
        outputList.outputList.push(new Output(MyWallet.publicKey, 100));
        const genesisTransaction = new Transaction(new InputList(), outputList);
        const genesisBlock = new Block('', [genesisTransaction], false);
        this.chain.push(genesisBlock);
        console.log('Genesis block created');
        console.log(genesisBlock);
        // Add the output list to the transaction pool
        for (let i = 0; i < genesisTransaction.Outputs.outputList.length; i++) {
            MyTransactionPool.addTransaction(genesisTransaction.hash, i, 0, 0);
        }
        console.log(MyTransactionPool.toString());
    }


    // Most recent block
    get lastBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    toString(): string {
        return JSON.stringify(this);
    }
}


// Wallet gives a user a public/private keypair
class Wallet {
    privateKey!: any; // Change the type to any
    publicKey!: any; // Change the type to any
    private isInitialized: boolean = false;

    constructor() {
        const { publicKey, privateKey } = this.generateKeyPairSync();
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.isInitialized = true; // Set initialization flag
    }

    generateKeyPairSync(): { publicKey: any; privateKey: any } {
        try {
            const rsa = forge.pki.rsa;
            const keyPair = rsa.generateKeyPair({ bits: 2048 });
            return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
        } catch (err) {
            throw new Error('Error generating key pair');
        }
    }   

    sendMoney(publicKey: CryptoKey, money: number): Transaction | null {
        // Check if initialized
        if (!this.isInitialized) {
            throw new Error('Wallet is not yet initialized');
        }

        const inputs: InputList = new InputList();
        const outputs: OutputList = new OutputList();

        // Add transaction logic...
        outputs.outputList.push(new Output(publicKey, money));
        let totalInputAmount = 0;
        // Add all transaction outputs where the publicKey matches the wallet's publicKey
        const transactionPool = MyTransactionPool.transactionPool;
        for (const [[transactionHash, outputIndex], [blockIndex, transactionIndex]] of transactionPool) {
            const block : Block = MyChain.chain[blockIndex];
            const transaction : Transaction = block.transactionlist[transactionIndex];
            const output : Output = transaction.Outputs.outputList[outputIndex];
            if (output.receiverPublicKey === this.publicKey && totalInputAmount < money) {
                totalInputAmount += output.amount;
                inputs.inputList.push(new Input(transactionHash, outputIndex));
            }
        }
        // Add self transaction for change
        const change : number = totalInputAmount - money;
        if (change > 0) {
            outputs.outputList.push(new Output(this.publicKey, change));
            console.log(outputs.outputList)
            console.log(inputs.inputList)
        }
        else if (change < 0){
            console.log(`Not enough balance. Additional ${-change} coins required.`);
            return null;
        }
        // Create new transaction
        return new Transaction(inputs, outputs);
        sendtransaction(new Transaction(inputs, outputs));
        // return 'Transaction sent';
        // Your existing code...
    }

    signAndVerify(transaction: Transaction): boolean {
        // Check if initialized
        if (!this.isInitialized) {
            throw new Error('Wallet is not yet initialized');
        }

        const str = transaction.Inputs.toString() + transaction.Outputs.toString();
        const data = forge.util.createBuffer(str, 'utf8');
        const signature = this.privateKey.sign(data);
        const isValid = this.publicKey.verify(data.bytes(), signature);
        return isValid;
    }
}

// sendtransaction socket code
function sendtransaction(transaction: Transaction): void {
    //   
}

function sendBlock(block: Block): void {
  // 
}
function validateblock(block : Block): boolean {
    let transactionIndex;
    if(MyChain.chain.length != block.index) return false;
    console.log("Validating block");
    console.log(block)
    if(MyChain.chain[block.index - 1].hash != block.prevHash) return false;
    for (transactionIndex = 0; transactionIndex < block.transactionlist.length; transactionIndex++) {
        const transaction = block.transactionlist[transactionIndex];
        console.log("Validating transaction:");
        for (const input of transaction.Inputs.inputList) {
            // Check if the transaction hash and output index key is present in the transaction pool
            const key: [string, number] = [input.transactionHash.toString(), input.outputIndex];
            console.log("Input is printed");
            console.log(key);

            console.log("Iterating over keys in MyTransactionPool:");
            let found = false;
            for (const mapKey of MyTransactionPool.transactionPool.keys()) {
                console.log("Current key in iteration:", mapKey);
                if (mapKey[0] === key[0] && mapKey[1] === key[1]) {
                    found = true;
                    break;
                }
            }
            if(!found){
                console.log("Valiation Failed");
                return false;
            }
            // if (!MyTransactionPool.transactionPool.has([input.transactionHash, input.outputIndex])) {
            //     return false; // Return false if any input is not present in the transaction pool
            // }
        }
        console.log("Validate Block completed")
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
        for (let i = 0; i < transaction.Outputs.outputList.length; i++) {
            const output = transaction.Outputs.outputList[i];
            MyTransactionPool.addTransaction(transaction.hash, i, block.index, transactionIndex);
        }

        // Remove all input entries from the transaction pool
        for (const input of transaction.Inputs.inputList) {
            MyTransactionPool.removeTransaction(input.transactionHash, input.outputIndex);
        }
        console.log("Transaction Pool updated");
    }
    MyChain.chain.push(block);
    // Print Mychain object
    console.log('⛏️  Block Added...');
    console.log(MyChain);
    return true; // Return true if all transactions are valid
}
// function validateblock(block: Block): boolean {
//     return block.validateBlock();
// }
// Take the transactionperblock transactions from mytransactionlist and make a block and mine it
function makeBlock(): Block | null {
    const transactions: Transaction[] = [];
    for (let i = 0; i < tranactionPerBlock; i++) {
        transactions.push(MyTransactionlist.pop()!);
    }
    const prevHash = MyChain.lastBlock.hash;
    const block = new Block(prevHash, transactions);
    let transactionIndex = 0;
    // for each transaction calculate the diffrenec e between inout and outputs and add te coinbase transactions with input as null and output as the difference
    for (transactionIndex = 0; transactionIndex < transactions.length; transactionIndex++) {
        const transaction : Transaction = transactions[transactionIndex];

        for (const input of transaction.Inputs.inputList) {
            const key: [string, number] = [input.transactionHash.toString(), input.outputIndex];
            console.log("Input is printed");
            console.log(key);

            console.log("Iterating over keys in MyTransactionPool:");
            let found = false;
            for (const mapKey of MyTransactionPool.transactionPool.keys()) {
                console.log("Current key in iteration:", mapKey);
                if (mapKey[0] === key[0] && mapKey[1] === key[1]) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log("Input Transaction not found in the transaction pool");
                return null; // Return false if any input is not present in the transaction pool
            }
            console.log("Input Transactions found in the transaction pool");

        }
        console.log("Input Transactions found in the transaction pool")
        // Calculate the sum of amounts from input entries
        let inputSum = 0;
        for (const input of transaction.Inputs.inputList) {
            let [blockIndex, transactionIndex] = [1,1];
            for (const mapKey of MyTransactionPool.transactionPool.keys()) {
                console.log("Current key in iteration:", mapKey);
                if (mapKey[0] === input.transactionHash && mapKey[1] === input.outputIndex) {
                    blockIndex = MyTransactionPool.transactionPool.get(mapKey)![0];
                    transactionIndex = MyTransactionPool.transactionPool.get(mapKey)![1];
                    // [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get(mapKey)!;
                    console.log("Block Index:", blockIndex, "Transaction Index:", transactionIndex);
                    break;
                }
            }
            // const [blockIndex, transactionIndex] = MyTransactionPool.transactionPool.get([input.transactionHash, input.outputIndex])!;
            console.log("Block Index:", blockIndex, "Transaction Index:", transactionIndex);
            const outputAmount = MyChain.chain[blockIndex].transactionlist[transactionIndex].Outputs.outputList[input.outputIndex].amount;
            inputSum += outputAmount;
        }
        console.log("Input sum calculated:", inputSum);
        // Calculate the sum of amounts from output entries
        let outputSum = 0;
        console.log("Output list is printed");
        console.log(transaction.Outputs.outputList);
        for (const output of transaction.Outputs.outputList) {
            // Dont add if output is to the sender
            if (output.receiverPublicKey === MyWallet.publicKey) {
                console.log("Output is to the sender. Skipping...");
                continue;
            }
            outputSum += output.amount;
        }
        console.log("Output sum calculated:", outputSum);
        // If input amount sum is less than output amount sum, return false
        if (inputSum < outputSum) {
            console.log("Input amount sum is less than output amount sum");
            return null;
        }
        // Add the positive difference to the coinbase variable
        block.coinbase += inputSum - outputSum;
    }
    const outputList : OutputList = new OutputList();
    outputList.outputList.push(new Output(MyWallet.publicKey, block.coinbase));
    const extraTransaction = new Transaction(new InputList(), outputList);
    MyTransactionPool.addTransaction(extraTransaction.hash, 0, block.index, transactionIndex);
    block.mineBlock();
    return block;
}

const MyTemporaryTransactionPool = new TransactionPool();
const MyTransactionPool = new TransactionPool();
const MyWallet = new Wallet();
const bob = new Wallet();
const MyChain = new Chain();
// const MyBlock = new Block();

const MyTransactionlist: Transaction[] = [];

const satoshi = new Wallet();
const alice = new Wallet();

function sendMoneyAfterInitialization(wallet: Wallet, publicKey: CryptoKey, amount: number): void {
    // Wait until the wallet is initialized
    wallet.generateKeyPairSync();

    // Now the wallet is initialized, you can call sendMoney
    wallet.sendMoney(publicKey, amount);
}

// Call sendMoneyAfterInitialization for MyWallet
// Convert bob.publickey to string

// sendMoneyAfterInitialization(MyWallet, bob.publicKey, 50);
// sendMoneyAfterInitialization(MyWallet, alice.publicKey, 30);

export { MyWallet, MyTransactionlist, makeBlock, validateblock, Block, Transaction};