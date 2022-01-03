const cron             =   require('node-cron');
const buyBinanceCron   =   require('../buyServices/buyBinance');
const sellBinanceCron  =   require('../sellServices/sellBinance');
const eventsBuy        =   require('../buyServices/buyEvent') 
const timerBuy         =   require('../buyServices/buyTimerBinance')
const sellServiceTimer =   require('../sellServices/sellBinanceTimer')

//run after every 2 sec
cron.schedule('*/5 * * * * *', () => {
        
    buyBinanceCron.directBuy();
});

//run after every 2 sec
cron.schedule('*/5 * * * * *', () => {
        
    // sellBinanceCron.directSell();
});

cron.schedule('0 */2 * * * *', () => {
    
    // buyBinanceCron.tradingOnOff()
})

cron.schedule('*/5 * * * * *', () => {
    
    // eventsBuy.eventBuy()
})




//buy service for timer
cron.schedule('*/5 * * * * *', () => {
    
    // timerBuy.timersBuyEvery()
})

cron.schedule('*/5 * * * * *', () => {
    
    // timerBuy.timersBuyOn()
})

cron.schedule('*/5 * * * * *', () => {
    
    // timerBuy.timersBuyRightNow()
})
//end buy service for timer






//sell serverice for timer
cron.schedule('*/5 * * * * *', () => {
    
    // sellServiceTimer.timersSellEvery()
})

cron.schedule('*/5 * * * * *', () => {
    
    // sellServiceTimer.timersSellOn()
})

cron.schedule('*/5 * * * * *', () => {
    
    // sellServiceTimer.timersSellRightNow()
})


