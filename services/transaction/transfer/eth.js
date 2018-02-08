"use strict";

/**
 * Transfer Eth
 *
 * @module services/transaction/transfer/eth
 */

const rootPrefix = '../../..'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , fundManager = require(rootPrefix + '/lib/fund_manager')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Transfer Eth Service
 *
 * @param {object} params - this is object with keys - [either one of {sender_address, sender_passphrase} and {sender_name}],
 *                                                      [either one of {recipient_address} and {recipient_name}], amount_in_wei
 *
 * @constructor
 */
const TransferEthKlass = function(params) {
  const oThis = this
  ;

  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.senderName = params.sender_name;
  oThis.recipientAddress = params.recipient_address;
  oThis.recipientName = params.recipient_name;
  oThis.amountInWei = params.amount_in_wei;
};

TransferEthKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: function () {
    const oThis = this
    ;

    try {
      if(!oThis.senderAddress) {
        oThis.senderAddress = coreAddresses.getAddressForUser(oThis.senderName);
        oThis.senderPassphrase = coreAddresses.getPassphraseForUser(oThis.senderName);
      }

      if(!oThis.recipientAddress) {
        oThis.recipientAddress = coreAddresses.getAddressForUser(oThis.recipientName);
      }

      if ((!oThis.senderAddress) || (!oThis.senderPassphrase) || (!oThis.recipientAddress)) {
        return Promise.resolve(responseHelper.error('s_t_t_e_1',
          'Invalid params - sender_address or sender_passphrase or recipient_address'));
      }

      return fundManager.transferEth(oThis.senderAddress, oThis.senderPassphrase, oThis.recipientAddress, oThis.amountInWei);
    } catch (err) {
      return Promise.resolve(responseHelper.error('s_t_t_e_2', 'Something went wrong. ' + err.message));
    }
  }
};

module.exports = TransferEthKlass;