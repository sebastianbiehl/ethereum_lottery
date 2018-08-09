const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')

const provider = ganache.provider()
const web3 = new Web3(provider)

const { interface, bytecode } = require('../compile')

let lottery
let accounts

beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    lottery = await new web3.eth.Contract(JSON.parse(interface)).deploy({ data: bytecode }).send({ from: accounts[0], gas: '1000000' })
})

describe('Lottery contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    })

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0])
        assert.equal(1, players.length)
    })

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        })
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.01', 'ether')
        })
         await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.01', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0])
        assert.equal(accounts[1], players[1])
        assert.equal(accounts[2], players[2])
        assert.equal(3, players.length)
    })

    it('requires minimum amount of ether to enter', async () => {
        let success = true
        try {
        await lottery.methods.enter().send({ 
                from: accounts[0], 
                value: web3.utils.toWei('0.001', 'ether') 
            })
        success = false
        } catch (err) {
            assert(err)
        }
        assert(success)
    })

    it('only manager can call pickWinner', async () => {
        let success = true
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            })
            success = false
        } catch (err) {
            assert(err)
        }
        assert(success)
    })

    it('sends money to the winner and resets player array', async () => {
        await lottery.methods.enter().send({ 
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        })

        const initialBalance = await web3.eth.getBalance(accounts[0])
        await lottery.methods.pickWinner().send({ from: accounts[0]})
        const finalBalance = await web3.eth.getBalance(accounts[0])
        const difference = finalBalance - initialBalance
        assert(difference > web3.utils.toWei('1.8', 'ether'))

        const finalArray = await lottery.methods.getPlayers().call( { from: accounts[0]})
        assert.ok(finalArray.length === 0)

        const contractBalance = await web3.eth.getBalance(lottery.options.address)
        assert.ok(contractBalance === '0')
    })
})