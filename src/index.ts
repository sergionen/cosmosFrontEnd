import { calculateFee, GasPrice, StdFee } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import fs from 'fs';
import {
	CosmWasmClient,
	SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate';

// This is your rpc endpoint
const RPC_ENDPOINT = 'https://rpc.testnet.osmosis.zone/';
const gasPrice = GasPrice.fromString('0.025uosmo');
const mnemonic =
	'clown federal version logic final frame junior test opinion minor cloth book'; //I created a normal wallet on Kepler, only testnet purposes, as the mnemonic is public here, not safe to have funds of course.

async function main() {
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
		prefix: 'osmo',
	}); // Initialize the wallet
	const [account] = await wallet.getAccounts(); // Get the default account of the wallet
	const accounts = await wallet.getAccounts();
	console.log('accounts:');
	console.log(accounts);
	console.log('Signer address:', account.address);

	const wasm = fs.readFileSync('./src/incremental.wasm'); //Binary of the Smartcontract

	const client = await CosmWasmClient.connect(RPC_ENDPOINT); //Connec to the testnet of Osmosis, it can change the rpc, that everything should be working the same, except for the fees coin, that should be changed to the correct blockchian rpc.
	const chainId = await client.getChainId();
	const height = await client.getHeight();

	console.log(height);
	console.log(chainId);
	console.log(client);

	const clientSigner = await SigningCosmWasmClient.connectWithSigner(
		RPC_ENDPOINT,
		wallet
	);

	const fees: StdFee = calculateFee(60000000, gasPrice);
	const contract_upload = await clientSigner.upload(
		account.address,
		wasm,
		fees,
		'Incremental tryout Sergio contract.'
	);

	const msg = {};
	const result = await clientSigner.instantiate(
		account.address,
		contract_upload.codeId,
		msg,
		'label contract Sergio',
		fees,
		{ memo: 'Sergio first contract incremental :)' }
	);
	console.log('Result instantiated:');
	console.log('Events:');
	console.log(result.events);

	console.log('Address:');
	console.log(result.contractAddress);
	console.log('Hash:');
	console.log(result.transactionHash);

	console.log(contract_upload.checksum);
	console.log(contract_upload.gasUsed);
	console.log(contract_upload.gasWanted);
	console.log(contract_upload.transactionHash);
	console.log(contract_upload.events);
	console.log(contract_upload.codeId);

	console.log('Query the contract and execute it');
	const queryRaw = await client.queryContractRaw(
		result.contractAddress,
		Uint8Array.from(Array.from('counter').map((l) => l.charCodeAt(0)))
	);

	const queryJson = await clientSigner.queryContractSmart(
		result.contractAddress,
		{
			get_counter: {},
		}
	);

	console.log(Buffer.from(queryRaw.buffer).toString());
	console.log(queryJson.counter);

	const exec = await clientSigner.execute(
		account.address,
		result.contractAddress,
		{ increment: {} },
		fees,
		'Incremented by SErgio'
	);

	const queryRaw2 = await clientSigner.queryContractRaw(
		result.contractAddress,
		Uint8Array.from(Array.from('counter').map((l) => l.charCodeAt(0)))
	);
	const queryJson2 = await clientSigner.queryContractSmart(
		result.contractAddress,
		{
			get_counter: {},
		}
	);

	console.log('Second query:');
	console.log(Buffer.from(queryRaw2.buffer).toString());
	console.log(queryJson2);

	const exec2 = await clientSigner.execute(
		account.address,
		result.contractAddress,
		{ increment: {} },
		fees,
		'Incremented by SErgio'
	);
	const exec3 = await clientSigner.execute(
		account.address,
		result.contractAddress,
		{ decrement: {} },
		fees,
		'Decremented by SErgio'
	);
	const exec5 = await clientSigner.execute(
		account.address,
		result.contractAddress,
		{ decrement: {} },
		fees,
		'Decremented by SErgio'
	);
	console.log('contract executed hash');
	console.log(exec5.transactionHash);

	const queryRaw3 = await clientSigner.queryContractRaw(
		result.contractAddress,
		Uint8Array.from(Array.from('counter').map((l) => l.charCodeAt(0)))
	);
	const queryJson3 = await clientSigner.queryContractSmart(
		result.contractAddress,
		{
			get_counter: {},
		}
	);

	console.log('third query:');
	console.log(Buffer.from(queryRaw3.buffer).toString());
	console.log(queryJson3);
}

main();
