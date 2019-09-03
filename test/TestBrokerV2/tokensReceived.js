const { getBroker, getTokenList, getZeus, validateBalance, validateExternalBalance } = require('../utils')

contract('Test tokensReceived', async (accounts) => {
    let broker, tokenList, zeus
    const user = accounts[1]

    beforeEach(async () => {
        broker = await getBroker()
        tokenList = await getTokenList()
        zeus = await getZeus(accounts[0])

        await zeus.mint(user, 87)
    })

    contract('when parameters are valid', async () => {
        it('deposits tokens', async () => {
            await validateExternalBalance(user, zeus, 87)
            await validateBalance(user, zeus, 0)

            await tokenList.whitelistToken(zeus.address)
            await zeus.send(broker.address, 87, '0x0', { from: user })

            await validateExternalBalance(user, zeus, 0)
            await validateBalance(user, zeus, 87)
        })
    })
})
