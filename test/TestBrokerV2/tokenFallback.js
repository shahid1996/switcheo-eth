const { web3, getBroker, getDgtx, validateBalance,
        validateExternalBalance, assertRevert } = require('../utils')

contract('Test tokenFallback', async (accounts) => {
    let broker, dgtx
    const owner = accounts[0]
    const user = accounts[1]

    beforeEach(async () => {
        broker = await getBroker()
        dgtx = await getDgtx()

        await dgtx.transfer(user, 87, { from: owner })
    })

    contract('when parameters are valid', async () => {
        it('deposits tokens', async () => {
            await validateExternalBalance(user, dgtx, 87)
            await validateBalance(user, dgtx, 0)

            await broker.addWhitelistToken(dgtx.address)
            await dgtx.transfer(broker.address, 87, { from: user })

            await validateExternalBalance(user, dgtx, 0)
            await validateBalance(user, dgtx, 87)
        })
    })
})
