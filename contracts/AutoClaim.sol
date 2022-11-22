//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@pooltogether/owner-manager-contracts/contracts/Ownable.sol";


interface IPrizeDistributor {
    function claim(  address _user, uint32[] calldata _drawIds, bytes calldata _data) external returns (uint256);
}

error NoPayout();
error AmountOutTooLow();
error AmountOutTooHigh();
error NotAuthorized();
error PercentageTooLow();
error PercentageTooHigh();
error AllowanceTooLow();
error TokenTransferFailed();

// import "hardhat/console.sol";

contract AutoClaim is Ownable {
    using SafeERC20 for IERC20;

    IPrizeDistributor internal immutable prizeDistributor;
    IERC20 internal immutable prizeTicketToken;

    uint16 public minimumPercentage; // only verified when opting in, ClaimFor allowed with _minAmountOut = 0

    /// @notice Maps users => senderPercentage
    mapping(address => uint16) public autoClaimUsers;

    event UserOptedIn(address user, uint16 percentage);
    event UserOptedOut(address user);
    event PrizesClaimed(address bySender, uint256 senderAmountOut, address forUser, uint256 userAmountOut, uint32[] drawIds);
    
    constructor(
        address _owner,
        IERC20 _token,
        IPrizeDistributor _prizeDistributor,
        uint16 _minimumPercentage
    ) Ownable(_owner) {
        prizeDistributor = _prizeDistributor;
        prizeTicketToken = _token;
        minimumPercentage = _minimumPercentage;
    }

    function claimFor(
        address _user,
        uint32[] calldata _drawIds,
        bytes calldata _data,
        uint16 _senderPercentage, //10000 = 100%, 1000 = 10%, ...
        uint256 _minAmountOut // send 0 if profitablity is no concern
    ) external returns (uint256 amountToSender) {
        if(_senderPercentage != autoClaimUsers[_user]) revert NotAuthorized();

        uint256 totalPayout = prizeDistributor.claim(_user, _drawIds, _data);
        if(totalPayout == 0) revert NoPayout();

        if(_minAmountOut > 0) {
            if(_minAmountOut > prizeTicketToken.allowance(_user, address(this))) revert AllowanceTooLow();
        }

        amountToSender = (totalPayout * _senderPercentage) / 10000;
        
        if(_minAmountOut > amountToSender) revert AmountOutTooLow();
        if(amountToSender > totalPayout) revert AmountOutTooHigh(); // Never transfer more than the payout

        bool success = prizeTicketToken.transferFrom(_user, address(msg.sender), amountToSender);
        if(!success) revert TokenTransferFailed();

        emit PrizesClaimed(msg.sender, amountToSender, _user, totalPayout-amountToSender, _drawIds);
    }

    function optIn(uint16 _senderPercentage) external {
        address user = address(msg.sender);
        if(autoClaimUsers[user] == 0) {
            if(_senderPercentage < minimumPercentage) revert PercentageTooLow();
        } else if(_senderPercentage == 0) {
            return optOut();
        } else if(_senderPercentage > 10000) {
            revert PercentageTooHigh();
        }
        autoClaimUsers[user] = _senderPercentage;
        emit UserOptedIn(msg.sender, _senderPercentage);
    }

    function optOut() public {
        delete autoClaimUsers[msg.sender];
        emit UserOptedOut(msg.sender);
    }

    function setMinimumPercentage(uint16 _minimumPercentage) onlyOwner external {
        minimumPercentage = _minimumPercentage;
    }
}

