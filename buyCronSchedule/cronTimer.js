const cron             =   require('node-cron');
const buyBinanceCron   =   require('../buyServices/buyBinance');
const sellBinanceCron  =   require('../sellServices/sellBinance');
const eventsBuy         =   require('../buyServices/buyEvent') 

//run after every 2 sec
cron.schedule('*/5 * * * * *', () => {
        
    // buyBinanceCron.directBuy();
});

//run after every 2 sec
cron.schedule('*/5 * * * * *', () => {
        
    // sellBinanceCron.directSell();
});

cron.schedule('0 */2 * * * *', () => {
    
    // buyBinanceCron.tradingOnOff()
})

cron.schedule('*/5 * * * * *', () => {
    
    eventsBuy.eventBuy()
})




