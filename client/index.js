/* eslint-disable no-undef */
let provider;
let web3Inst;
let selectedAccount;
let nftContract;
const msPerFrame = 15e3;
let nftId = 1;
let renderInterval;

function init() {
  if (typeof window.ethereum !== 'undefined') {
    // New web3 provider
    // As per EIP1102 and EIP1193
    // Ref: https://eips.ethereum.org/EIPS/eip-1102
    // Ref: https://eips.ethereum.org/EIPS/eip-1193
    try {
      // Request account access if needed

      // Opt out of refresh page on network change
      // Ref: https://docs.metamask.io/guide/ethereum-provider.html#properties
      provider = window.ethereum;
      provider.autoRefreshOnNetworkChange = false;
      web3Inst = new Web3(provider);
      onConnect();
    } catch (error) {
      // User denied account access
      console.error(error.message);
      return;
    }
  } else if (window.web3) {
    // Deprecated web3 provider
    provider = window.web3.currentProvider;
    web3Inst = new Web3(provider);
    onConnect();
  }
  // No web3 provider
  else {
    console.error('No web3 provider detected');
    return;
  }

  initContracts();
}

async function initContracts() {
  const web3 = web3Inst;
  try {
    const networkId = await web3.eth.net.getId();
    const nftContractArtefact = await fetch(
      '/contracts/BlockClockSvgNft.json',
    ).then((response) => response.json());

    const deployedNetwork = nftContractArtefact.networks[networkId];
    if (!deployedNetwork) {
      throw new Error(
        'No contract deployed on the network that you are connected. Please switch networks.',
      );
    }

    nftContract = new web3.eth.Contract(
      nftContractArtefact.abi,
      deployedNetwork.address,
    );
  } catch (error) {
    console.error(error.message);
  }
}

async function getNft() {
  const web3 = web3Inst;
  try {
    nftId = new web3.utils.BN(document.querySelector('#inputNftId').value);
    clearInterval(renderInterval);
    await renderNftAnimationFrame();
    renderInterval = setInterval(renderNftAnimationFrame, msPerFrame);
  } catch (err) {
    console.error(err.message);
  } finally {
    console.log('Get NFT response received');
  }
}

async function renderNftAnimationFrame() {
  const svg = await nftContract.methods.renderSvgLogo(nftId).call();
  if (!(svg.startsWith('<svg') && svg.endsWith('</svg>'))) {
    throw new Error(
      'Received data is not an SVG file and can not be displayed',
    );
  }
  document.querySelector('#areaRenderNftSvg').innerHTML = svg;
}

async function createNft() {
  const web3 = web3Inst;
  try {
    const [from] = await web3.eth.getAccounts();
    const getBytes = (color) => `0x${color.substr(1)}`;
    const bitcoinLeafColour = getBytes(
      document.querySelector('#inputBitcoinLeafColour').value,
    );
    const rskLeafColour = getBytes(
      document.querySelector('#inputRskLeafColour').value,
    );
    await nftContract.methods
      .create(bitcoinLeafColour, rskLeafColour)
      .send({ from });
  } catch (err) {
    console.error(err.message);
  } finally {
    console.log('Create NFT transaction sent');
  }
}

async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  const web3 = web3Inst;

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  document.querySelector('#network-name').textContent = `${chainId}`;

  // Get list of accounts of the connected wallet
  // const accounts = await web3.eth.getAccounts();
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  // MetaMask does not give you all accounts, only the selected account
  [selectedAccount] = accounts;

  document.querySelector('#selected-account').textContent = selectedAccount;

  const template = document.querySelector('#template-balance');
  const accountContainer = document.querySelector('#accounts');

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, 'ether');
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector('.address').textContent = address;
    clone.querySelector('.balance').textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  document.querySelector('#prepare').style.display = 'none';
  document.querySelector('#connected').style.display = 'block';
}

async function refreshAccountData() {
  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector('#connected').style.display = 'none';
  document.querySelector('#prepare').style.display = 'block';

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector('#btn-connect').setAttribute('disabled', 'disabled');
  await fetchAccountData(provider);
  document.querySelector('#btn-connect').removeAttribute('disabled');
}

async function onConnect() {
  // Subscribe to accounts change
  provider.on('accountsChanged', fetchAccountData);

  // Subscribe to chainId change
  provider.on('chainChanged', fetchAccountData);

  // Subscribe to networkId change
  provider.on('networkChanged', fetchAccountData);

  await refreshAccountData();
}

async function onDisconnect() {
  if (web3Inst && web3Inst.currentProvider && web3Inst.currentProvider.close) {
    await provider.close();
  }
  web3Inst = null;
  selectedAccount = null;
  // Set the UI back to the initial state
  document.querySelector('#prepare').style.display = 'block';
  document.querySelector('#connected').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', async () => {
  init();
  document.querySelector('#btn-connect').addEventListener('click', init);
  document
    .querySelector('#btn-disconnect')
    .addEventListener('click', onDisconnect);
  document.querySelector('#buttonGetNft').addEventListener('click', getNft);
  document
    .querySelector('#buttonCreateNft')
    .addEventListener('click', createNft);
});
