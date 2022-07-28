import { EMAIL_LEDGER_ABI, ERC721_ABI, emails } from './utils'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

describe('SealCredTwitter', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('SealCredTwitter')
    this.txParams = {
      tweet: 'gm',
      domain: emails[0],
    }
    this.maxTweetLength = 280
  })
  beforeEach(async function () {
    this.SCEmailLedgerContract = await waffle.deployMockContract(
      this.owner,
      EMAIL_LEDGER_ABI
    )
    this.contract = await this.factory.deploy(
      this.SCEmailLedgerContract.address,
      this.maxTweetLength
    )
    await this.contract.connect(this.owner)
    await this.contract.deployed()

    this.derivativeContract = await waffle.deployMockContract(
      this.owner,
      ERC721_ABI
    )
  })

  describe('Constructor', function () {
    it('should deploy the SealCredTwitter contract with the correct fields', async function () {
      expect(await this.contract.sealCredEmailLedgerAddress()).to.equal(
        this.SCEmailLedgerContract.address
      )
      expect(await this.contract.maxTweetLength()).to.exist
    })
    it('should deploy SealCredTwitter, derivative and SCEmailLedgerContract contracts', async function () {
      expect(await this.contract.address).to.exist
      expect(await this.derivativeContract.address).to.exist
      expect(await this.SCEmailLedgerContract.address).to.exist
    })
  })

  describe('Owner-only calls from non-owner', function () {
    before(function () {
      this.contractWithIncorrectOwner = this.contract.connect(this.user)
    })
    it('should have the correct owner', async function () {
      expect(await this.contract.owner()).to.equal(this.owner.address)
    })
    it('should not be able to call setMaxTweetLength', async function () {
      this.contractWithIncorrectOwner = this.contract.connect(this.user)
      await expect(
        this.contractWithIncorrectOwner.setMaxTweetLength(281)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('Contract', function () {
    it('should save tweet', async function () {
      // Setup mocks
      await this.SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)
      await expect(
        this.contract.saveTweet(this.txParams.tweet, this.txParams.domain)
      )
        .to.emit(this.contract, 'TweetSaved')
        .withArgs(
          0,
          this.txParams.tweet,
          this.derivativeContract.address,
          this.owner.address,
          (
            await ethers.provider.getBlock('latest')
          ).timestamp
        )
      await this.contract.saveTweet(this.txParams.tweet, this.txParams.domain)

      const savedTweet = await this.contract.tweets(0)
      expect({
        tweet: savedTweet.tweet,
        derivativeAddress: savedTweet.derivativeAddress,
      }).to.deep.eq({
        tweet: this.txParams.tweet,
        derivativeAddress: this.derivativeContract.address,
      })
    })
    it('should not save tweet is derivative does not exist', async function () {
      // Setup mocks
      await this.SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns('0x0000000000000000000000000000000000000000')
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      await expect(
        this.contract.saveTweet(this.txParams.tweet, this.txParams.domain)
      ).to.be.revertedWith('Derivative contract not found')
    })
    it('should not save tweet if tweet exceeds max length', async function () {
      // Setup mocks
      await this.SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      const tweet = 'a'

      await expect(
        this.contract.saveTweet(tweet.repeat(281), this.txParams.domain)
      ).to.be.revertedWith('Tweet exceeds max tweet length')
    })
    it('should not save tweet if user does not own a derivative', async function () {
      // Setup mocks
      await this.SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(0)

      await expect(
        this.contract.saveTweet(this.txParams.tweet, this.txParams.domain)
      ).to.be.revertedWith('You do not own this derivative')
    })
    it('should return all tweets', async function () {
      // Setup mocks
      await this.SCEmailLedgerContract.mock.getDerivativeContract
        .withArgs(emails[0])
        .returns(this.derivativeContract.address)
      await this.derivativeContract.mock.balanceOf
        .withArgs(this.owner.address)
        .returns(1)

      const expectedTweets: { tweet: string; derivativeAddress: string }[] = []

      // Saving tweets and seting expectedTweets array
      for (let i = 0; i < 5; i++) {
        await this.contract.saveTweet(this.txParams.tweet, this.txParams.domain)
        expectedTweets.push({
          tweet: this.txParams.tweet,
          derivativeAddress: this.derivativeContract.address,
        })
      }

      const tweets = await this.contract.getAllTweets()
      // Serializing tweets array from contract call
      const serializedTweets = tweets.map((tweet) => ({
        tweet: tweet.tweet,
        derivativeAddress: tweet.derivativeAddress,
      }))

      expect(serializedTweets).to.deep.eq(expectedTweets)
    })
  })
})
