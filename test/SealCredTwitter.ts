import { Contract } from 'ethers'
import { DERIVATIVE_ABI, EMAIL_LEDGER_ABI, emails } from './utils'
import { MockContract } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

describe('SealCredTwitter', () => {
  let contract: Contract
  let SCEmailLedgerContract: MockContract
  let derivativeContract: MockContract

  let accounts: SignerWithAddress[]
  let owner: SignerWithAddress
  let user: SignerWithAddress
  const txParams = {
    tweet: 'gm',
    domain: emails[0],
  }

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    owner = accounts[0]
    user = accounts[1]

    const factory = await ethers.getContractFactory('SealCredTwitter')
    SCEmailLedgerContract = await waffle.deployMockContract(
      owner,
      EMAIL_LEDGER_ABI
    )
    contract = await factory.deploy(SCEmailLedgerContract.address)
    await contract.connect(owner)
    await contract.deployed()

    derivativeContract = await waffle.deployMockContract(owner, DERIVATIVE_ABI)
  })

  describe('Constructor', () => {
    it('should deploy the SealCredTwitter contract with the correct fields', async () => {
      expect(await contract.SCEmailLedgerAddress()).to.equal(
        SCEmailLedgerContract.address
      )
    })
    it('should deploy SealCredTwitter, derivative and SCEmailLedgerContract contracts', async () => {
      expect(await contract.address).to.exist
      expect(await derivativeContract.address).to.exist
      expect(await SCEmailLedgerContract.address).to.exist
    })
  })

  describe('Contract', () => {
    it('should save tweet', async () => {
      await SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(derivativeContract.address)
      await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(1)

      await expect(contract.saveTweet(txParams.tweet, txParams.domain))
        .to.emit(contract, 'TweetSaved')
        .withArgs(
          txParams.tweet,
          derivativeContract.address,
          txParams.tweet.length
        )

      const savedTweet = await contract.tweets(0)
      expect({
        tweet: savedTweet.tweet,
        derivativeAddress: savedTweet.derivativeAddress,
        tweetLength: savedTweet.tweetLength.toNumber(),
      }).to.deep.eq({
        tweet: txParams.tweet,
        derivativeAddress: derivativeContract.address,
        tweetLength: txParams.tweet.length,
      })
    })
    it('should not save tweet is derivative does not exist', async () => {
      await SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns('0x0000000000000000000000000000000000000000')
      await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(1)

      await expect(
        contract.saveTweet(txParams.tweet, txParams.domain)
      ).to.be.revertedWith('Derivative contract not found')
    })
    it('should not save tweet if user does not own a derivative', async () => {
      await SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(derivativeContract.address)
      await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(0)

      await expect(
        contract.saveTweet(txParams.tweet, txParams.domain)
      ).to.be.revertedWith('You do not own this derivative')
    })
    it('should delete tweet', async () => {
      await SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(derivativeContract.address)
      await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(1)
      await contract.saveTweet(txParams.tweet, txParams.domain)

      await expect(contract.deleteTweet(0)).to.emit(contract, 'TweetDeleted')

      const removedTweet = await contract.tweets(0)
      expect(removedTweet['tweet']).to.be.eq('0x0')
    })
    it('should not delete tweet if the caller is not owner', async () => {
      await SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(derivativeContract.address)
      await derivativeContract.mock.balanceOf.withArgs(owner.address).returns(1)
      await contract.saveTweet(txParams.tweet, txParams.domain)

      const contractAsUser = contract.connect(user)
      await expect(contractAsUser.deleteTweet(0)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })
})
