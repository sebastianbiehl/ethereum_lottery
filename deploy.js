const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
const { interface, bytecode } = require('./compile')

const provider = new HDWalletProvider(
    'forest addict split vacuum december arrow garden cushion misery inspire same gaze', 'https://rinkeby.infura.io/v3/343382763d8045eea4d63f3d55fd6eb6')

const web3 = new Web3(provider)

const deploy = async () => {
    const accounts = await web3.eth.getAccounts()

    console.log(`Attempting to deploy contract from account ${accounts[0]}`)

    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: `0x${bytecode}` })
        .send({ gas: '1000000', from: accounts[0] })
    
    console.log(`Contract successfully deployed to ${result.options.address}`)
}

deploy()