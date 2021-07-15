var TradegenERC20 = artifacts.require('TradegenERC20')

module.exports = function (deployer) {
  deployer.deploy(TradegenERC20)
}