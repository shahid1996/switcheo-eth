const { web3, getBroker, getJrc, getSwc, bn, shl, clone, validateBalance, hashMake,
        exchange, assertAsync, assertReversion, testValidation, printLogs } = require('../../utils')
const { getTradeParams } = require('../../utils/getTradeParams')

const { PRIVATE_KEYS } = require('../../wallets')
const { ZERO_ADDR, ETHER_ADDR } = require('../../constants')

contract('Test trade: existing make', async (accounts) => {
    let broker, jrc, swc
    const operator = accounts[0]
    const maker = accounts[1]
    const filler = accounts[2]
    const privateKeys = PRIVATE_KEYS

    beforeEach(async () => {
        broker = await getBroker()
        jrc = await getJrc()
        swc = await getSwc()
    })

    it('does not re-deduct make.offerAmount and make.feeAmount', async () => {
        await exchange.mintAndDeposit({ user: maker, token: jrc, amount: 500, nonce: 1 })
        await exchange.mintAndDeposit({ user: filler, token: swc, amount: 300, nonce: 2 })

        const makes = [{
            maker,
            offerAssetId: jrc.address,
            offerAmount: 100,
            wantAssetId: swc.address,
            wantAmount: 50,
            feeAssetId: swc.address,
            feeAmount: 7,
            nonce: 3
        }]

        const fills = [{
            filler,
            offerAssetId: swc.address,
            offerAmount: 15,
            wantAssetId: jrc.address,
            wantAmount: 30,
            feeAssetId: jrc.address,
            feeAmount: 3,
            nonce: 4
        }]

        const matches = [{ makeIndex: 0, fillIndex: 1, takeAmount: 30 }]
        await exchange.trade({ operator, makes, fills, matches }, { privateKeys })

        await validateBalance(maker, jrc, 400) // 500 jrc - 100 jrc
        await validateBalance(maker, swc, 8) // 15 swc - 7 swc
        await validateBalance(filler, jrc, 27) // 30 jrc - 3 jrc
        await validateBalance(filler, swc, 285) // 300 - 15 swc
        await validateBalance(operator, jrc, 3) // received 3 jrc
        await validateBalance(operator, swc, 7) // received 7 swc

        const makeHash = hashMake(makes[0])
        await assertAsync(broker.offers(makeHash), 70) // 100 jrc - 30 jrc

        fills[0] = { ...fills[0], nonce: 5, offerAmount: 20, wantAmount: 40 }
        matches[0] = { ...matches[0], takeAmount: 40 }
        const result = await exchange.trade({ operator, makes, fills, matches }, { privateKeys })

        await validateBalance(maker, jrc, 400) // unchanged
        await validateBalance(maker, swc, 28) // 8 swc + 20 swc
        await validateBalance(filler, jrc, 64) // 27 jrc + 40 jrc - 3 jrc
        await validateBalance(filler, swc, 265) // 285 swc - 20 swc
        await validateBalance(operator, jrc, 6) // received 3 jrc
        await validateBalance(operator, swc, 7) // unchanged

        await assertAsync(broker.offers(makeHash), 30) // 70 jrc - 40 jrc
    })
})
