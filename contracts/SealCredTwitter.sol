//                                                                        ,-,
//                            *                      .                   /.(              .
//                                       \|/                             \ {
//    .                 _    .  ,   .    -*-       .                      `-`
//     ,'-.         *  / \_ *  / \_      /|\         *   /\'__        *.                 *
//    (____".         /    \  /    \,     __      .    _/  /  \  * .               .
//               .   /\/\  /\/ :' __ \_  /  \       _^/  ^/    `—./\    /\   .
//   *       _      /    \/  \  _/  \-‘\/  ` \ /\  /.' ^_   \_   .’\\  /_/\           ,'-.
//          /_\   /\  .-   `. \/     \ /.     /  \ ;.  _/ \ -. `_/   \/.   \   _     (____".    *
//     .   /   \ /  `-.__ ^   / .-'.--\      -    \/  _ `--./ .-'  `-/.     \ / \             .
//        /     /.       `.  / /       `.   /   `  .-'      '-._ `._         /.  \
// ~._,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'
// ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~~
// ~~    ~~~~    ~~~~     ~~~~   ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~
//     ~~     ~~      ~~      ~~      ~~      ~~      ~~      ~~       ~~     ~~      ~~      ~~
//                          ๐
//                                                                              _
//                                                  ₒ                         ><_>
//                                  _______     __      _______
//          .-'                    |   _  "\   |" \    /" _   "|                               ๐
//     '--./ /     _.---.          (. |_)  :)  ||  |  (: ( \___)
//     '-,  (__..-`       \        |:     \/   |:  |   \/ \
//        \          .     |       (|  _  \\   |.  |   //  \ ___
//         `,.__.   ,__.--/        |: |_)  :)  |\  |   (:   _(  _|
//           '._/_.'___.-`         (_______/   |__\|    \_______)                 ๐
//
//                  __   __  ___   __    __         __       ___         _______
//                 |"  |/  \|  "| /" |  | "\       /""\     |"  |       /"     "|
//      ๐          |'  /    \:  |(:  (__)  :)     /    \    ||  |      (: ______)
//                 |: /'        | \/      \/     /' /\  \   |:  |   ₒ   \/    |
//                  \//  /\'    | //  __  \\    //  __'  \   \  |___    // ___)_
//                  /   /  \\   |(:  (  )  :)  /   /  \\  \ ( \_|:  \  (:      "|
//                 |___/    \___| \__|  |__/  (___/    \___) \_______)  \_______)
//                                                                                     ₒ৹
//                          ___             __       _______     ________
//         _               |"  |     ₒ     /""\     |   _  "\   /"       )
//       ><_>              ||  |          /    \    (. |_)  :) (:   \___/
//                         |:  |         /' /\  \   |:     \/   \___  \
//                          \  |___     //  __'  \  (|  _  \\    __/  \\          \_____)\_____
//                         ( \_|:  \   /   /  \\  \ |: |_)  :)  /" \   :)         /--v____ __`<
//                          \_______) (___/    \___)(_______/  (_______/                  )/
//                                                                                        '
//
//            ๐                          .    '    ,                                           ₒ
//                         ₒ               _______
//                                 ____  .`_|___|_`.  ____
//                                        \ \   / /                        ₒ৹
//                                          \ ' /                         ๐
//   ₒ                                        \/
//                                   ₒ     /      \       )                                 (
//           (   ₒ৹               (                      (                                  )
//            )                   )               _      )                )                (
//           (        )          (       (      ><_>    (       (        (                  )
//     )      )      (     (      )       )              )       )        )         )      (
//    (      (        )     )    (       (              (       (        (         (        )
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "./interfaces/ISCEmailLedger.sol";
import "./models/Tweet.sol";

/**
 * @title SealCred Twitter storage
 * @dev Allows owners of SCEmailDerivative to post tweets
 */
contract SealCredTwitter is BaseRelayRecipient {
  using Counters for Counters.Counter;

  // State
  Tweet[] public tweets;
  address public immutable sealCredEmailLedgerAddress;
  Counters.Counter public currentTweetId;
  string public override versionRecipient = "2.2.0";

  // Events
  event TweetSaved(
    uint256 id,
    string tweet,
    address indexed derivativeAddress,
    address indexed sender,
    uint256 timestamp
  );

  constructor(address _sealCredEmailLedgerAddress, address _forwarder) {
    sealCredEmailLedgerAddress = _sealCredEmailLedgerAddress;
    _setTrustedForwarder(_forwarder);
  }

  /**
   * @dev Posts a new tweet given that msg.sender is an owner of a SCEmailDerivative
   */
  function saveTweet(string memory tweet, string memory domain) external {
    // Get the derivative
    address derivativeAddress = ISCEmailLedger(sealCredEmailLedgerAddress)
      .getDerivativeContract(domain);
    // Check preconditions
    require(derivativeAddress != address(0), "Derivative contract not found");
    require(
      IERC721(derivativeAddress).balanceOf(_msgSender()) > 0,
      "You do not own this derivative"
    );
    // Post the tweet
    uint256 id = currentTweetId.current();
    Tweet memory newTweet = Tweet(
      id,
      tweet,
      derivativeAddress,
      _msgSender(),
      block.timestamp
    );
    tweets.push(newTweet);
    // Emit the tweet event
    emit TweetSaved(
      id,
      tweet,
      derivativeAddress,
      _msgSender(),
      block.timestamp
    );
    // Increment the current tweet id
    currentTweetId.increment();
  }

  /**
   * @dev Returns all tweets
   */
  function getAllTweets() external view returns (Tweet[] memory) {
    uint256 tweetsLength = tweets.length;
    Tweet[] memory allTweets = new Tweet[](tweetsLength);
    for (uint256 i = 0; i < tweetsLength; i++) {
      Tweet storage tweet = tweets[i];
      allTweets[i] = tweet;
    }
    return allTweets;
  }
}
