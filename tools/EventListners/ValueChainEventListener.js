"use strict";
/*
 * transfer event from BrandedTokenContract
 *
 * * Author: Rachin Kapoor
 * * Date: 26/10/2017
 * * Reviewed by: Sunil
 */
const BigNumber = require('bignumber.js')
      ,Web3 = require("web3")
;

const reqPrefix = "../.."
      ,coreAddresses = require(reqPrefix + '/config/core_addresses')
      ,coreConstants = require(reqPrefix + '/config/core_constants')
      ,Config = require(reqPrefix + "/config.json")
      ,web3WsProvider = new Web3( coreConstants.OST_GETH_VALUE_WS_PROVIDER ) /* ValueChain WebSocket Address */
      ,FOUNDATION = coreAddresses.getAddressForUser('foundation')
      ,REGISTRAR = coreAddresses.getAddressForUser('registrar')
      ,SIMPLETOKEN_CONTRACT = coreAddresses.getAddressForContract('simpleToken')
      ,STAKE_CONTRACT = coreAddresses.getAddressesForContract('staking')
;


const toST = function ( num ) {
  var bigNum = new BigNumber( num );
  var fact = new BigNumber( 10 ).pow( 18 );
  return bigNum.dividedBy( fact ).toString();
};


const logJSObject = function ( jo , heading ) {
  console.log("*****\t", heading);
  if ( jo && jo instanceof Object ) {
    console.log( JSON.stringify(jo) );
  } else {
    console.log( jo );
  }
};

const generateEventCallback = function ( displayName, colorCode ) {
  return function( e, res) {
    if ( !res ) { return; }
    const eventName = res.event;
    console.log("\n" + colorCode + "==== " + displayName + " :: " + eventName + " ====\x1b[0m");
    switch ( eventName ){
      case "Transfer": 
        showTransferEventDescription( res );
        break;
      case "MintingIntentDeclared":
      case "StakingIntentDeclared":
        showMintingIntentDeclaredDescription( res );
        break;
      case "Staked":
        showStakedDescription( res );
        break;
    }
    logJSObject( res, eventName);
  };
};


const showTransferEventDescription = function ( result ) {

  var returnValues = result.returnValues
      ,_from = returnValues._from
      ,_to = returnValues._to
      ,_value = returnValues._value
      ,fromDisplayInfo, toDisplayInfo
      ,description = ""
  ;

  fromDisplayInfo = getDisplayForAddress( _from );
  toDisplayInfo = getDisplayForAddress( _to );
  
  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event);
  console.log("From:\t\t" , fromDisplayInfo.displayName, " (", _from ,")");
  console.log("To:\t\t", toDisplayInfo.displayName, " (", _to ,")");
  console.log("Amount:\t\t", toST(_value) );
  description.length && console.log("Description:\t", description);
  console.log( "\x1b[0m" );
};

const showMintingIntentDeclaredDescription = function ( result ) {
  var returnValues = result.returnValues;
  var displayInfo = getDisplayForAddress( returnValues._staker );
  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event );
  console.log("Account:\t\t", getDisplayForAddress( returnValues._uuid ).displayName );
  console.log("Staker:\t\t", displayInfo.displayName );
  console.log("Amount [ST]:\t\t", toST(returnValues._amountST) );
  console.log("Amount [" + displayInfo.symbol + "]:\t\t", toST(returnValues._amountUT) );
  console.log("Minting Intent Hash:\t", returnValues._mintingIntentHash);
  console.log("Description: Staking Intent Declared by " + displayInfo.displayName + " for minting " + toST( returnValues._amountUT ) + " " + displayInfo.symbol ); 
  console.log( "\x1b[0m" );
};
const showStakedDescription = function ( result ) {
  var returnValues = result.returnValues;
  var displayInfo = getDisplayForAddress( returnValues._staker );

  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event);
  console.log("Staker:\t\t", getDisplayForAddress( returnValues._staker ).displayName );
  console.log("Amount [ST]:\t\t", toST(returnValues._amountST) );
  console.log("Amount [" + displayInfo.symbol + "]:\t\t", toST(returnValues._amountUT) );
  
  console.log("Description: " 
    + displayInfo.displayName 
    + " has staked " + toST(returnValues._amountST) + " [ST] " 
    + " to mint " + toST(returnValues._amountUT ) + " "
    + displayInfo.symbol
  );
  console.log( "\x1b[0m" );
}


const displayMap = {};

//Build Display Map
(function () {
  var _key;

  _key = FOUNDATION;
  displayMap[ _key.toLowerCase() ] = {
    isKnown: true,
    displayName: "SimpleToken Foundation",
    symbol: "ST"
  };
  _key = REGISTRAR;
  displayMap[ _key.toLowerCase() ] = {
    isKnown: true,
    displayName: "Registrar",
    symbol: "[NA]"
  };

  _key = SIMPLETOKEN_CONTRACT;
  displayMap[ _key.toLowerCase() ] = {
    isKnown: true,
    displayName: "SimpleTokenContract",
    symbol: "[NA]"
  };  

  _key = STAKE_CONTRACT;
  displayMap[ _key.toLowerCase() ] = {
    isKnown: true,
    displayName: "StakingContract",
    symbol: "[NA]"
  };

  Config.Members.forEach( function ( Member ) {
    var name = Member.Name;
    _key = Member.Reserve;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      displayName: "Reserve",
      symbol: Member.Symbol
    };

    _key = Member.ERC20;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      displayName: name + " " + "(ERC20)",
      symbol: Member.Symbol
    };

    _key = Member.UUID;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      displayName: name,
      symbol: Member.Symbol
    };

  });


})();

const getDisplayForAddress = function ( address ) {
  address = address || "";
  address = address.toLowerCase();
  return displayMap[ address ] || {
    isKnown: false,
    configKey: "NA", 
    displayName: "",
    symbol: "[NA]"
  };
};

const bindStakeEvents = function () {
  const ContractJson = require( reqPrefix +  "/contracts/Staking.json")
        ,contractAddress = STAKE_CONTRACT
        ,displayName = "Stake"
        ,colorCode = "\x1b[35m"
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new web3WsProvider.eth.Contract( contractAbi, contractAddress )
        ,callback = generateEventCallback( displayName, colorCode)
  ;
  contract.setProvider( web3WsProvider.currentProvider );
  contract.events.allEvents({} , callback);
};


const bindSimpleTokenEvents = function () {
  const ContractJson = require( reqPrefix + "/contracts/SimpleToken.json")
        ,contractAddress = SIMPLETOKEN_CONTRACT
        ,displayName = "SimpleToken"
        ,colorCode = "\x1b[36m"
        ,contractAbi = JSON.parse( ContractJson.contracts["SimpleToken.sol:SimpleToken"].abi )
        ,contract = new web3WsProvider.eth.Contract( contractAbi, contractAddress )
        ,callback = generateEventCallback( displayName, colorCode)
  ;
  contract.events.allEvents({} , callback);
};


bindStakeEvents();
bindSimpleTokenEvents();


// showStakedDescription({
//   "address": "0xDD0eaa0CD2EABBD90f45B6119bb2BC3b2Cbb1303",
//   "blockNumber": 2017050,
//   "transactionHash": "0xf8187bda4683679c3ce81ec194cb60b2ab548182b22a4b63be6e6350c5e2cae6",
//   "transactionIndex": 0,
//   "blockHash": "0x9697c366aad017b2fb8b3b480103ba22ef34ccce05cbc3acf5bba71ed6199fd9",
//   "logIndex": 0,
//   "removed": false,
//   "id": "log_2f6e88c0",
//   "returnValues": {
//     "0": "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//     "1": "0x0000000000000000000000000000000000000000",
//     "2": "0",
//     "3": "0",
//     "_uuid": "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//     "_staker": "0x0000000000000000000000000000000000000000",
//     "_amountST": "1000",
//     "_amountUT": "1000"
//   },
//   "event": "Staked",
//   "signature": "0xa1fdccfe567643a44425efdd141171e8d992854a81e5c819c1432b0de47c9a11",
//   "raw": {
//     "data": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
//     "topics": [
//       "0xa1fdccfe567643a44425efdd141171e8d992854a81e5c819c1432b0de47c9a11",
//       "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//       "0x0000000000000000000000000000000000000000000000000000000000000000"
//     ]
//   }
// });

// showMintingIntentDeclaredDescription({
//   "address": "0xDD0eaa0CD2EABBD90f45B6119bb2BC3b2Cbb1303",
//   "blockNumber": 2017046,
//   "transactionHash": "0x8e98ed049bde5209138c7e828c0e8f047e3b91406a9a835bff72cf7a118766e7",
//   "transactionIndex": 2,
//   "blockHash": "0xacd3776b1cd45d4a0bc108ce78f6bbc5c17cb59cd78af0ef6181cd4ef828147e",
//   "logIndex": 4,
//   "removed": false,
//   "id": "log_01c4da15",
//   "returnValues": {
//     "0": "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//     "1": "0x0000000000000000000000000000000000000000",
//     "2": "1",
//     "3": "1000000000000000000",
//     "4": "10000000000000000000",
//     "5": "2097713",
//     "6": "0x62b48d945372c9e8130b489d0332ce34f60bc944390e166de36117f48fcbc020",
//     "_uuid": "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//     "_staker": "0x0000000000000000000000000000000000000000",
//     "_stakerNonce": "1",
//     "_amountST": "1000000000000000000",
//     "_amountUT": "10000000000000000000",
//     "_escrowUnlockHeight": "2097713",
//     "_mintingIntentHash": "0x62b48d945372c9e8130b489d0332ce34f60bc944390e166de36117f48fcbc020"
//   },
//   "event": "StakingIntentDeclared",
//   "signature": "0x705c2e746b5bfdd9b0d7a36c0721b9b96bbe8c7ee382eb2d8cadadc6a1f86a41",
//   "raw": {
//     "data": "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000008ac7230489e80000000000000000000000000000000000000000000000000000000000000020023162b48d945372c9e8130b489d0332ce34f60bc944390e166de36117f48fcbc020",
//     "topics": [
//       "0x705c2e746b5bfdd9b0d7a36c0721b9b96bbe8c7ee382eb2d8cadadc6a1f86a41",
//       "0xd5d3724d321c18bea69caa89b57ba32e218aa89c2b92c976e64a55780f783021",
//       "0x0000000000000000000000000000000000000000000000000000000000000000"
//     ]
//   }
// });