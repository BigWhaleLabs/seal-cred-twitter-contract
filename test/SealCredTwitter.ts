import { Contract } from 'ethers'
import { MockContract } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

const DERIVATIVE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

describe('SealCredTwitter', () => {
  let contract: Contract
  let derivativeContract: MockContract

  let accounts: SignerWithAddress[]
  let owner: SignerWithAddress

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    owner = accounts[0]

    const factory = await ethers.getContractFactory('SealCredTwitter')
    contract = await factory.deploy()
    await contract.connect(owner)
    await contract.deployed()

    derivativeContract = await waffle.deployMockContract(owner, DERIVATIVE_ABI)
  })

  it('should deploy SealCredTwitter and derivative contract', async () => {
    expect(await contract.address).to.exist
    expect(await derivativeContract.address).to.exist
  })
  it('should save tweet', async () => {
    const txParams = {
      tweet: 'gm',
      derivativeAddress: derivativeContract.address,
    }
    await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(1)

    await expect(contract.saveTweet(txParams.tweet, txParams.derivativeAddress))
      .to.emit(contract, 'TweetSaved')
      .withArgs(txParams.tweet, txParams.derivativeAddress)

    const savedTweet = await contract.tweets(0)

    expect({
      tweet: savedTweet.tweet,
      derivativeAddress: savedTweet.derivativeAddress,
    }).to.deep.eq(txParams)
  })
  it('should not save tweet if user does not own a derivative', async () => {
    const txParams = {
      tweet: 'gm',
      derivativeAddress: derivativeContract.address,
    }
    await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(0)

    await expect(
      contract.saveTweet(txParams.tweet, txParams.derivativeAddress)
    ).to.be.revertedWith('You do not own this derivative')
  })
})